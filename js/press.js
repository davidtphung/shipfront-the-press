/* SHIPFRONT / THE PRESS
   Clip-up headlines, staggered rises, drawer, quote form. */

(function () {
  "use strict";

  var still =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Reveal ------------------------------------------------------------ */

  function show(el) {
    el.classList.add("is-in");
  }

  function reveal() {
    var targets = document.querySelectorAll("[data-clip], [data-rise]");

    if (still || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, show);
      return;
    }

    // Stagger siblings that share a group.
    var groups = document.querySelectorAll("[data-stagger]");
    Array.prototype.forEach.call(groups, function (group) {
      var step = parseInt(group.getAttribute("data-stagger"), 10) || 70;
      var kids = group.querySelectorAll("[data-clip], [data-rise]");
      Array.prototype.forEach.call(kids, function (kid, i) {
        kid.style.setProperty("--d", i * step + "ms");
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
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    Array.prototype.forEach.call(targets, function (el) {
      // Anything already in the first screen fires immediately.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
        requestAnimationFrame(function () {
          show(el);
        });
        return;
      }
      io.observe(el);
    });
  }

  /* --- Drawer ----------------------------------------------------------- */

  function drawer() {
    var btn = document.querySelector("[data-burger]");
    var panel = document.getElementById("drawer");
    if (!btn || !panel) return;

    function set(open) {
      panel.setAttribute("data-open", open ? "true" : "false");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    btn.addEventListener("click", function () {
      set(panel.getAttribute("data-open") !== "true");
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) set(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") set(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 760) set(false);
    });
  }

  /* --- Quote form ------------------------------------------------------- */

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
        if (fieldOf(input) && fieldOf(input).getAttribute("data-bad") === "true") {
          check(input);
        }
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

  /* --- Boot ------------------------------------------------------------- */

  function boot() {
    reveal();
    drawer();
    quoteForm();
    document.documentElement.setAttribute("data-ready", "true");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
