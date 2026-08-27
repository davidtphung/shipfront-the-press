/* SHIPFRONT / THE PRESS
   Springs, press feedback, an interruptible sheet, a settling masthead, and
   the clip up reveals.

   Three rules this file is built around.

   1. Feedback lands on pointer down, not on click. A press is acknowledged
      the moment a finger touches the target.
   2. Everything is interruptible. Springs carry their own velocity, so a new
      target can arrive mid flight and the value keeps moving instead of
      restarting. Input is never locked while something animates.
   3. Only transform and opacity are animated per frame. Colour, hairlines,
      and shadows are left to CSS transitions.

   Springs are critically damped by default: damping 1.0 means the value
   settles without overshoot, which is what a sheet and a button press want.
*/

(function () {
  "use strict";

  var root = document.documentElement;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Spring ------------------------------------------------------------ */

  /* One shared frame loop drives every live spring, so a page with a pressed
     button, a moving sheet, and a settling masthead still runs one rAF. */

  var live = [];
  var ticking = false;
  var last = 0;

  function tick(now) {
    var dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    // A backgrounded tab hands back a huge delta. Clamp it so nothing jumps.
    if (dt > 1 / 30) dt = 1 / 30;

    for (var i = live.length - 1; i >= 0; i--) {
      if (!live[i].step(dt)) live.splice(i, 1);
    }

    if (live.length) {
      requestAnimationFrame(tick);
    } else {
      ticking = false;
      last = 0;
    }
  }

  function start(spring) {
    if (live.indexOf(spring) === -1) live.push(spring);
    if (!ticking) {
      ticking = true;
      last = 0;
      requestAnimationFrame(tick);
    }
  }

  /* response is the time the value takes to cover most of the distance, in
     seconds. damping 1.0 is critical, which is the only setting used here. */
  function Spring(value, opts) {
    opts = opts || {};
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.response = opts.response || 0.34;
    this.damping = opts.damping == null ? 1 : opts.damping;
    this.epsilon = opts.epsilon || 0.0005;
    this.onChange = opts.onChange || null;
    this.onRest = opts.onRest || null;
  }

  Spring.prototype.step = function (dt) {
    // Implicit integration, which stays stable at any frame length and lets a
    // target change mid flight without a discontinuity.
    var omega = (2 * Math.PI) / this.response;
    var zeta = this.damping;
    var f = 1 + 2 * dt * zeta * omega;
    var oo = omega * omega;
    var hoo = dt * oo;
    var hhoo = dt * hoo;
    var detInv = 1 / (f + hhoo);

    var detX = f * this.value + dt * this.velocity + hhoo * this.target;
    var detV = this.velocity + hoo * (this.target - this.value);

    this.value = detX * detInv;
    this.velocity = detV * detInv;

    var settled =
      Math.abs(this.target - this.value) < this.epsilon &&
      Math.abs(this.velocity) < this.epsilon * 12;

    if (settled) {
      this.value = this.target;
      this.velocity = 0;
      if (this.onChange) this.onChange(this.value, this);
      if (this.onRest) this.onRest(this.value, this);
      return false;
    }

    if (this.onChange) this.onChange(this.value, this);
    return true;
  };

  Spring.prototype.to = function (target, response) {
    if (response) this.response = response;
    this.target = target;
    if (reduceMotion) {
      this.value = target;
      this.velocity = 0;
      if (this.onChange) this.onChange(this.value, this);
      if (this.onRest) this.onRest(this.value, this);
      return this;
    }
    start(this);
    return this;
  };

  /* Hand a live value and its velocity to the spring, which is how a drag
     release becomes a throw rather than a restart. */
  Spring.prototype.from = function (value, velocity) {
    this.value = value;
    this.velocity = velocity || 0;
    if (this.onChange) this.onChange(this.value, this);
    return this;
  };

  Spring.prototype.stop = function () {
    var at = live.indexOf(this);
    if (at !== -1) live.splice(at, 1);
    this.velocity = 0;
    return this;
  };

  /* --- Press ------------------------------------------------------------- */

  /* Pointer down takes the target down quickly. Release springs it home.
     Both directions are critically damped, so a press never bounces and a
     release part way through a press picks up from wherever it got to. */

  var PRESS_DOWN = 0.13;
  var PRESS_UP = 0.34;

  function pressable(el) {
    // A wide target travels further for the same scale, so it presses less.
    var down = el.getBoundingClientRect().width > 520 ? 0.985 : 0.97;

    var spring = new Spring(1, {
      response: PRESS_UP,
      damping: 1,
      epsilon: 0.0002,
      onChange: function (v) {
        el.style.transform = "scale(" + v.toFixed(5) + ")";
      },
      onRest: function (v) {
        // Leave no inline transform behind at rest, so CSS owns the element
        // again the moment the gesture is over.
        if (v === 1) el.style.transform = "";
      }
    });

    var held = false;

    function press() {
      if (held) return;
      held = true;
      el.setAttribute("data-press", "down");
      spring.to(down, PRESS_DOWN);
    }

    function release() {
      if (!held) return;
      held = false;
      el.removeAttribute("data-press");
      spring.to(1, PRESS_UP);
    }

    el.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      press();
    });

    // Every way the gesture can end, including the ones that never fire a
    // click, has to put the target back.
    ["pointerup", "pointercancel", "pointerleave", "blur", "dragstart"].forEach(
      function (name) {
        el.addEventListener(name, release);
      }
    );

    // Keyboard sees the same feedback as a pointer.
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") press();
    });
    el.addEventListener("keyup", release);

    // A pointer released outside the target still ends the press.
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  }

  function presses() {
    if (reduceMotion) return;
    var targets = document.querySelectorAll(
      ".btn, .tile, .burger, .sheet__x, .blink"
    );
    Array.prototype.forEach.call(targets, pressable);
  }

  /* --- Sheet ------------------------------------------------------------- */

  /* The menu is a sheet, not a toggled block. Its progress runs 0 to 1 and is
     a live value: it can be opened, grabbed mid open, dragged back, and
     thrown, and the same spring drives every one of those. */

  function sheet() {
    var panel = document.querySelector("[data-sheet-panel]");
    // Not [data-sheet]: body carries that one for the scroll lock, and body
    // comes first in document order.
    var host = document.querySelector("[data-sheet-host]");
    var scrim = document.querySelector("[data-sheet-scrim]");
    var openers = document.querySelectorAll("[data-sheet-open]");
    var closers = document.querySelectorAll("[data-sheet-close]");
    if (!panel || !host) return;

    var inertable = [
      document.querySelector(".masthead"),
      document.getElementById("main"),
      document.querySelector(".foot")
    ].filter(Boolean);

    var progress = 0;
    var opened = false;

    function paint(p) {
      progress = p;
      var shown = p > 0.001;
      host.setAttribute("data-live", shown ? "true" : "false");
      if (!reduceMotion) {
        panel.style.transform =
          "translate3d(0," + ((p - 1) * 100).toFixed(3) + "%,0)";
      }
      if (scrim) scrim.style.opacity = Math.min(1, Math.max(0, p)).toFixed(3);
    }

    var spring = new Spring(0, {
      response: 0.34,
      damping: 1,
      epsilon: 0.0006,
      onChange: paint,
      onRest: function (v) {
        if (v === 0) settle(false);
      }
    });

    function settle(isOpen) {
      opened = isOpen;
      host.setAttribute("data-open", isOpen ? "true" : "false");
      // The sheet is visibility:hidden until it is live. Mark it live before
      // anything tries to move focus into it, or the focus call is dropped.
      if (isOpen) host.setAttribute("data-live", "true");
      document.body.setAttribute("data-sheet", isOpen ? "open" : "closed");
      Array.prototype.forEach.call(openers, function (b) {
        b.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
      inertable.forEach(function (el) {
        if (isOpen) {
          el.setAttribute("inert", "");
        } else {
          el.removeAttribute("inert");
        }
      });
      if (!isOpen) {
        host.setAttribute("data-live", "false");
        panel.style.transform = "";
      }
    }

    var returnTo = null;

    function open(from) {
      if (from) returnTo = from;
      settle(true);
      spring.to(1);
      var first = panel.querySelector("a, button");
      if (first) first.focus({ preventScroll: true });
    }

    function close() {
      if (!opened && progress <= 0.001) return;
      // Drop inert before the focus goes back, or the burger cannot take it.
      inertable.forEach(function (el) {
        el.removeAttribute("inert");
      });
      opened = false;
      host.setAttribute("data-open", "false");
      document.body.setAttribute("data-sheet", "closed");
      Array.prototype.forEach.call(openers, function (b) {
        b.setAttribute("aria-expanded", "false");
      });
      spring.to(0);
      if (returnTo && document.contains(returnTo)) {
        returnTo.focus({ preventScroll: true });
      }
    }

    Array.prototype.forEach.call(openers, function (b) {
      b.addEventListener("click", function () {
        if (opened) close();
        else open(b);
      });
    });

    Array.prototype.forEach.call(closers, function (b) {
      b.addEventListener("click", close);
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && opened) close();
      if (e.key !== "Tab" || !opened) return;

      // Keep Tab inside the sheet while it is up.
      var stops = panel.querySelectorAll("a[href], button:not([disabled])");
      if (!stops.length) return;
      var first = stops[0];
      var lastStop = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastStop.focus();
      } else if (!e.shiftKey && document.activeElement === lastStop) {
        e.preventDefault();
        first.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 760 && (opened || progress > 0)) close();
    });

    if (reduceMotion) return;

    /* Drag. The sheet can be grabbed at any point, including while it is
       still springing open, and the release hands its velocity back to the
       same spring. Pulling past the open stop rubber bands instead of
       tearing off the top of the screen. */

    var dragging = false;
    var pid = null;
    var startY = 0;
    var startP = 0;
    var lastY = 0;
    var lastT = 0;
    var vel = 0;

    function height() {
      return panel.offsetHeight || 1;
    }

    function band(over) {
      // Resistance grows with distance, so the stop is felt rather than hit.
      return (over * 0.42) / (1 + Math.abs(over) * 2.4);
    }

    panel.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("a, button")) {
        // A tap on a link is a tap, not a drag, until it travels.
        startY = e.clientY;
        startP = progress;
        pid = e.pointerId;
        dragging = false;
        lastY = e.clientY;
        lastT = e.timeStamp;
        return;
      }
      pid = e.pointerId;
      startY = lastY = e.clientY;
      lastT = e.timeStamp;
      startP = progress;
      vel = 0;
      dragging = true;
      spring.stop();
    });

    panel.addEventListener("pointermove", function (e) {
      if (pid !== e.pointerId) return;
      var dy = e.clientY - startY;

      if (!dragging) {
        if (Math.abs(dy) < 9) return;
        dragging = true;
        spring.stop();
        try {
          panel.setPointerCapture(e.pointerId);
        } catch (err) {
          /* capture is a nicety, not a requirement */
        }
      }

      var p = startP + dy / height();
      if (p > 1) p = 1 + band(p - 1);
      if (p < 0) p = 0;

      var dt = (e.timeStamp - lastT) / 1000;
      if (dt > 0) vel = (e.clientY - lastY) / height() / dt;
      lastY = e.clientY;
      lastT = e.timeStamp;

      paint(p);
    });

    function letGo(e) {
      if (pid !== e.pointerId) return;
      pid = null;
      if (!dragging) return;
      dragging = false;

      // Where the throw is heading, not just where it stopped.
      var projected = progress + vel * 0.13;
      var toOpen = projected > 0.5;

      spring.from(progress, vel);
      spring.to(toOpen ? 1 : 0);
      if (toOpen) settle(true);
      else close();
    }

    panel.addEventListener("pointerup", letGo);
    panel.addEventListener("pointercancel", letGo);
  }

  /* --- Settling masthead -------------------------------------------------- */

  /* The bar lies flat on the paper at the top of the page and settles into a
     light material once it has been scrolled past. The read rule under it is
     scroll position, drawn with a transform. */

  function masthead() {
    var bar = document.querySelector(".masthead");
    var read = document.querySelector("[data-read]");
    if (!bar) return;

    function amount(y) {
      return Math.min(1, Math.max(0, y / 72));
    }

    // CSS ships --settle at 1 so a page without scripting gets the landed bar.
    // Take it to wherever the scroll actually is before the first frame, then
    // spring from there.
    var at = amount(window.pageYOffset || root.scrollTop || 0);
    bar.style.setProperty("--settle", at.toFixed(3));

    var settle = new Spring(at, {
      response: 0.32,
      damping: 1,
      epsilon: 0.002,
      onChange: function (v) {
        bar.style.setProperty("--settle", v.toFixed(3));
      }
    });

    var queued = false;

    function measure() {
      queued = false;
      var y = window.pageYOffset || root.scrollTop || 0;

      settle.to(amount(y));
      bar.setAttribute("data-settled", y > 8 ? "true" : "false");

      if (read) {
        var span =
          Math.max(
            document.body.scrollHeight,
            root.scrollHeight
          ) - window.innerHeight;
        var p = span > 0 ? Math.min(1, Math.max(0, y / span)) : 0;
        read.style.setProperty("--read", p.toFixed(4));
      }
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(measure);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    measure();
  }

  /* --- Reveal ------------------------------------------------------------ */

  function show(el) {
    el.classList.add("is-in");
  }

  function reveal() {
    var targets = document.querySelectorAll(
      "[data-clip], [data-rise], [data-rise-plate]"
    );

    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, show);
      return;
    }

    // Stagger siblings that share a group.
    var groups = document.querySelectorAll("[data-stagger]");
    Array.prototype.forEach.call(groups, function (group) {
      var stepMs = parseInt(group.getAttribute("data-stagger"), 10) || 70;
      var kids = group.querySelectorAll(
        "[data-clip], [data-rise], [data-rise-plate]"
      );
      Array.prototype.forEach.call(kids, function (kid, i) {
        kid.style.setProperty("--d", i * stepMs + "ms");
      });
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          show(entry.target);
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );

    Array.prototype.forEach.call(targets, function (el) {
      // Anything already on the first screen fires immediately.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        requestAnimationFrame(function () {
          show(el);
        });
        return;
      }
      io.observe(el);
    });
  }

  /* --- Quote form -------------------------------------------------------- */

  function quoteForm() {
    var form = document.querySelector("[data-quote]");
    if (!form) return;

    var done = document.querySelector("[data-done]");
    var mailto = document.querySelector("[data-mailto]");

    function fieldOf(input) {
      return input.closest(".field");
    }

    function bad(input, msg) {
      var f = fieldOf(input);
      if (!f) return;
      f.setAttribute("data-bad", "true");
      var err = f.querySelector(".field__err");
      if (err) err.textContent = msg;
    }

    function clear(input) {
      var f = fieldOf(input);
      if (f) f.removeAttribute("data-bad");
    }

    var emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function check(input) {
      var v = input.value.trim();
      if (!v) {
        bad(input, "Required");
        return false;
      }
      if (input.type === "email" && !emailShape.test(v)) {
        bad(input, "Check this email address");
        return false;
      }
      clear(input);
      return true;
    }

    var inputs = form.querySelectorAll("input");

    Array.prototype.forEach.call(inputs, function (input) {
      input.addEventListener("input", function () {
        var f = fieldOf(input);
        if (f && f.getAttribute("data-bad") === "true") check(input);
      });
      input.addEventListener("blur", function () {
        if (input.value.trim()) check(input);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var ok = true;
      var first = null;
      Array.prototype.forEach.call(inputs, function (input) {
        if (!check(input)) {
          ok = false;
          if (!first) first = input;
        }
      });

      if (!ok) {
        if (first) first.focus();
        return;
      }

      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var company = form.elements.company.value.trim();

      if (mailto) {
        var body =
          "Name: " + name + "\nEmail: " + email + "\nCompany: " + company + "\n";
        mailto.setAttribute(
          "href",
          "mailto:info@myshipfront.com?subject=" +
            encodeURIComponent("Quote request: " + company) +
            "&body=" +
            encodeURIComponent(body)
        );
      }

      form.setAttribute("data-off", "true");
      if (done) {
        var slot = done.querySelector("[data-name]");
        if (slot) slot.textContent = name.split(" ")[0] || name;
        done.setAttribute("data-on", "true");
        done.setAttribute("tabindex", "-1");
        done.focus({ preventScroll: false });
      }
    });
  }

  /* --- Boot -------------------------------------------------------------- */

  function boot() {
    reveal();
    sheet();
    masthead();
    presses();
    quoteForm();
    root.setAttribute("data-ready", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
