#!/usr/bin/env python3
"""Draws the four capability plates for THE PRESS.

These are the stills that sit at the top of each capability tile on Home. They
are drawn, not photographed, because the only photograph this site is allowed to
ship is the byte locked truck JPEG. Ink on paper, hairline rules, exactly one
signal red per plate, every corner square.

    python3 tools/plates.py

Writes images/plate-*.svg. Rerunning is idempotent.
"""

import math
import os

W, H = 1200, 840

PAPER = "#F7F5EF"
SHEET = "#FFFFFF"
INK = "#111111"
SIGNAL = "#FF2D2D"

GRID = "rgba(17,17,17,.055)"
HAIR = "rgba(17,17,17,.22)"

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "images")


def head(title, desc):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="{title}">
  <title>{title}</title>
  <desc>{desc}</desc>
  <rect width="{W}" height="{H}" fill="{PAPER}"/>
"""


def grid(step=40):
    """The register grid every plate is set on."""
    d = []
    x = step
    while x < W:
        d.append(f"M{x} 0V{H}")
        x += step
    y = step
    while y < H:
        d.append(f"M0 {y}H{W}")
        y += step
    return f'  <path d="{"".join(d)}" stroke="{GRID}" stroke-width="1" fill="none"/>\n'


def crops(m=28, arm=34):
    """Crop marks. The plate is a printed thing."""
    d = [
        f"M{m} {m + arm}V{m}H{m + arm}",
        f"M{W - m - arm} {m}H{W - m}V{m + arm}",
        f"M{W - m} {H - m - arm}V{H - m}H{W - m - arm}",
        f"M{m + arm} {H - m}H{m}V{H - m - arm}",
    ]
    return f'  <path d="{"".join(d)}" stroke="{HAIR}" stroke-width="1.5" fill="none"/>\n'


def tail():
    return "</svg>\n"


def box(x, y, w, h, fill=SHEET, sw=2.2, stroke=INK):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


# --------------------------------------------------------------------------
# 01 Warehousing: front elevation of a four bay rack, loaded
# --------------------------------------------------------------------------


def warehousing():
    s = head(
        "Warehousing",
        "Front elevation of a four bay pallet rack, loaded with cartons on pallets. One carton is marked in red.",
    )
    s += grid()

    left, right = 96, 1104
    bays = 4
    bay_w = (right - left) / bays
    top = 160
    beams = [692, 556, 420, 284]  # deck height of each level, bottom first
    floor = 762

    pad = 18
    units = 6
    gap = 10
    inner = bay_w - pad * 2
    unit_w = (inner - gap * (units - 1)) / units

    def span_w(n):
        return n * unit_w + (n - 1) * gap

    # Carton height reads off its footprint, the way a real carton does.
    span_h = {2: 60, 3: 74, 4: 84, 6: 96}

    parts = []

    # Floor, a doubled press rule.
    parts.append(f'<path d="M40 {floor}H{W - 40}" stroke="{INK}" stroke-width="3" fill="none"/>')
    parts.append(f'<path d="M40 {floor + 10}H{W - 40}" stroke="{HAIR}" stroke-width="1.5" fill="none"/>')

    # Uprights and their foot plates.
    for i in range(bays + 1):
        x = left + i * bay_w
        parts.append(f'<path d="M{x:g} {top}V{floor}" stroke="{INK}" stroke-width="4" fill="none"/>')
        parts.append(box(x - 13, floor - 9, 26, 9, fill=INK, sw=0))

    # Beams and the top rail.
    for y in beams + [top]:
        parts.append(f'<path d="M{left} {y}H{right}" stroke="{INK}" stroke-width="4" fill="none"/>')

    # Load plan. Each cell is a run of (span, kind) across six units, where a
    # gap is an empty pallet position. Fixed so the plate is stable across runs.
    plan = {
        (0, 0): [(3, "box"), (3, "box")],
        (0, 1): [(2, "box"), (4, "box")],
        (0, 2): [(6, "box")],
        (0, 3): [(3, "box"), (3, "box")],
        (1, 0): [(4, "box"), (2, "box")],
        (1, 1): [(3, "box"), (3, "red")],
        (1, 2): [(2, "box"), (2, "gap"), (2, "box")],
        (1, 3): [(6, "box")],
        (2, 0): [(3, "box"), (3, "box")],
        (2, 1): [(6, "box")],
        (2, 2): [(4, "box"), (2, "box")],
        (2, 3): [(2, "box"), (4, "box")],
        (3, 0): [(2, "box"), (4, "box")],
        (3, 1): [(3, "box"), (3, "gap")],
        (3, 2): [(3, "box"), (3, "box")],
        (3, 3): [(4, "box"), (2, "box")],
    }

    for (level, bay), run in sorted(plan.items()):
        deck = beams[level]
        x0 = left + bay * bay_w + pad

        # Pallet deck spanning the bay: two boards and three blocks.
        py = deck - 14
        parts.append(f'<path d="M{x0:g} {py:g}h{inner:g}" stroke="{INK}" stroke-width="2.4" fill="none"/>')
        parts.append(f'<path d="M{x0:g} {deck - 3:g}h{inner:g}" stroke="{INK}" stroke-width="2" fill="none"/>')
        for k in range(3):
            bxp = x0 + 6 + k * (inner - 24) / 2
            parts.append(box(bxp, py + 2, 12, 9, fill=PAPER, sw=1.6))

        cursor = x0
        for span, kind in run:
            w = span_w(span)
            if kind == "gap":
                cursor += w + gap
                continue
            h = span_h[span]
            y = py - h
            parts.append(box(cursor, y, w, h, fill=SIGNAL if kind == "red" else SHEET, sw=2.2))
            # Tape seam and the two label rules every carton carries.
            mx = cursor + w / 2
            parts.append(f'<path d="M{mx:g} {y:g}V{py:g}" stroke="{INK}" stroke-width="1.6" fill="none"/>')
            parts.append(
                f'<path d="M{cursor + 11:g} {y + 18:g}H{mx - 11:g}M{cursor + 11:g} {y + 30:g}H{mx - 20:g}"'
                f' stroke="{INK}" stroke-width="2" fill="none" opacity=".5"/>'
            )
            cursor += w + gap

    s += "  " + "\n  ".join(parts) + "\n"
    s += crops()
    return s + tail()


# --------------------------------------------------------------------------
# 02 Fulfillment: a packed carton and the label that leaves with it
# --------------------------------------------------------------------------


def fulfillment():
    s = head(
        "Fulfillment",
        "A packed carton in axonometric view with a shipping label. One barcode bar is marked in red.",
    )
    s += grid()

    parts = []
    belt_y = 648

    # The next carton out, drawn first so it sits behind.
    bx0, bw2, bh2 = 872, 214, 168
    parts.append(box(bx0, belt_y - bh2, bw2, bh2, fill=PAPER, sw=2.2))
    parts.append(
        f'<path d="M{bx0 + bw2 / 2:g} {belt_y - bh2}V{belt_y}" stroke="{INK}" stroke-width="1.8" fill="none"/>'
    )
    parts.append(box(bx0 + 22, belt_y - bh2 + 28, 74, 48, fill=SHEET, sw=1.8))

    # Belt the carton rides out on.
    parts.append(f'<path d="M40 {belt_y}H{W - 40}" stroke="{INK}" stroke-width="3" fill="none"/>')
    for i in range(13):
        x = 64 + i * 88
        parts.append(f'<path d="M{x} {belt_y + 9}v16" stroke="{HAIR}" stroke-width="1.5" fill="none"/>')
    parts.append(f'<path d="M40 {belt_y + 29}H{W - 40}" stroke="{HAIR}" stroke-width="1.5" fill="none"/>')

    # Axonometric carton. The depth vector runs up and to the right.
    x0, y0 = 188, belt_y  # front bottom left
    w, h = 438, 350
    dx, dy = 192, -126

    fy0 = y0 - h  # front top
    fx0, fx1 = x0, x0 + w

    front = f"M{x0} {y0}H{fx1}V{fy0}H{fx0}Z"
    side = f"M{fx1} {y0}l{dx} {dy}V{fy0 + dy}l{-dx} {-dy}Z"
    topf = f"M{fx0} {fy0}H{fx1}l{dx} {dy}H{fx0 + dx}Z"

    parts.append(f'<path d="{side}" fill="{PAPER}" stroke="{INK}" stroke-width="2.6"/>')
    parts.append(f'<path d="{topf}" fill="{SHEET}" stroke="{INK}" stroke-width="2.6"/>')
    parts.append(f'<path d="{front}" fill="{SHEET}" stroke="{INK}" stroke-width="2.6"/>')

    # Tape seam across the closed top face.
    tape_x = fx0 + w / 2
    parts.append(f'<path d="M{tape_x:g} {fy0}l{dx} {dy}" stroke="{INK}" stroke-width="2.2" fill="none"/>')
    parts.append(
        f'<path d="M{tape_x - 26:g} {fy0}l{dx} {dy}M{tape_x + 26:g} {fy0}l{dx} {dy}"'
        f' stroke="{HAIR}" stroke-width="1.5" fill="none"/>'
    )
    parts.append(f'<path d="M{fx1} {y0}V{fy0}" stroke="{INK}" stroke-width="2.6" fill="none"/>')

    # The label. This is the subject of the plate.
    lx, ly, lw, lh = x0 + 48, fy0 + 68, 288, 204
    parts.append(box(lx, ly, lw, lh, fill=SHEET, sw=2.6))
    parts.append(f'<path d="M{lx} {ly + 40}h{lw}" stroke="{INK}" stroke-width="2.2" fill="none"/>')
    parts.append(box(lx + 14, ly + 12, 68, 16, fill=INK, sw=0))
    parts.append(box(lx + 92, ly + 12, 38, 16, fill="none", sw=1.6))

    # Address rules.
    for i, ww in enumerate([174, 206, 138]):
        parts.append(
            f'<path d="M{lx + 14} {ly + 64 + i * 22}h{ww}" stroke="{INK}" stroke-width="2"'
            f' fill="none" opacity="{0.85 - i * 0.16:g}"/>'
        )

    # Route stamp, the one signal on this plate.
    parts.append(box(lx + 14, ly + 138, 84, 40, fill=SIGNAL, sw=0))
    parts.append(
        f'<path d="M{lx + 30} {ly + 158}h44M{lx + 62} {ly + 148}l12 10l-12 10"'
        f' stroke="{INK}" stroke-width="2.6" fill="none"/>'
    )

    # Barcode alongside it.
    bar_y, bar_h = ly + 138, 40
    bx = lx + 116
    for bw in [3, 6, 3, 9, 3, 4, 7, 3, 5, 3, 8, 4, 3, 6]:
        if bx + bw > lx + lw - 14:
            break
        parts.append(box(bx, bar_y, bw, bar_h, fill=INK, sw=0))
        bx += bw + 5

    s += "  " + "\n  ".join(parts) + "\n"
    s += crops()
    return s + tail()


# --------------------------------------------------------------------------
# 03 eCommerce Integrations: stores wired to one dock
# --------------------------------------------------------------------------


def integrations():
    s = head(
        "eCommerce Integrations",
        "Five storefront plates wired down to a single receiving dock. One route is marked in red.",
    )
    s += grid()

    parts = []

    top_y = 150
    node_w, node_h = 168, 112
    xs = [110, 322, 534, 746, 958]
    dock_x, dock_w, dock_h = 372, 456, 136
    dock_y = 612
    trunk = dock_x + dock_w / 2

    # Storefront plates.
    for x in xs:
        parts.append(box(x, top_y, node_w, node_h, fill=SHEET, sw=2.4))
        parts.append(f'<path d="M{x} {top_y + 32}h{node_w}" stroke="{INK}" stroke-width="2.2" fill="none"/>')
        parts.append(box(x + 18, top_y + 11, 46, 10, fill=INK, sw=0))
        parts.append(box(x + 72, top_y + 11, 24, 10, fill="none", sw=1.4))
        for k in range(3):
            rw = [104, 74, 88][k]
            parts.append(
                f'<path d="M{x + 18} {top_y + 52 + k * 20}h{rw}" stroke="{INK}"'
                f' stroke-width="2" fill="none" opacity="{0.7 - k * 0.18:g}"/>'
            )

    # Each store drops to its own lane, then runs in to a single shared trunk.
    # Lanes are ordered by how far the store sits from the trunk, farthest
    # joining first, so no two routes ever sit on top of each other and the
    # nearest store feeds almost straight down.
    drop = top_y + node_h
    order = sorted(range(len(xs)), key=lambda i: -abs(xs[i] + node_w / 2 - trunk))
    lanes = {i: 350 + slot * 36 for slot, i in enumerate(order)}
    live = 3

    # The trunk, drawn once, from the highest lane down into the dock.
    parts.append(
        f'<path d="M{trunk:g} {min(lanes.values())}V{dock_y}" stroke="{INK}"'
        f' stroke-width="3.4" fill="none" stroke-linecap="square"/>'
    )

    for i, x in enumerate(xs):
        cx = x + node_w / 2
        lane = lanes[i]
        colour = SIGNAL if i == live else INK
        width = 3.4 if i == live else 2.2
        parts.append(
            f'<path d="M{cx:g} {drop}V{lane}H{trunk:g}" stroke="{colour}"'
            f' stroke-width="{width}" fill="none" stroke-linecap="square"/>'
        )
        if abs(cx - trunk) > 40:
            parts.append(box(cx - 5, lane - 5, 10, 10, fill=colour, sw=0))
        parts.append(box(trunk - 6, lane - 6, 12, 12, fill=colour, sw=0))

    # The dock every route lands on.
    parts.append(box(dock_x, dock_y, dock_w, dock_h, fill=SHEET, sw=3))
    parts.append(f'<path d="M{dock_x} {dock_y + 42}h{dock_w}" stroke="{INK}" stroke-width="2.4" fill="none"/>')
    parts.append(box(dock_x + 24, dock_y + 14, 96, 14, fill=INK, sw=0))
    parts.append(box(dock_x + 132, dock_y + 14, 40, 14, fill="none", sw=1.6))
    for k in range(6):
        sx = dock_x + 26 + k * 68
        parts.append(box(sx, dock_y + 66, 46, 46, fill=PAPER, sw=1.8))

    # Floor the dock stands on.
    parts.append(f'<path d="M40 {dock_y + dock_h}H{W - 40}" stroke="{INK}" stroke-width="3" fill="none"/>')
    parts.append(f'<path d="M40 {dock_y + dock_h + 10}H{W - 40}" stroke="{HAIR}" stroke-width="1.5" fill="none"/>')

    s += "  " + "\n  ".join(parts) + "\n"
    s += crops()
    return s + tail()


# --------------------------------------------------------------------------
# 04 Location: the downtown grid, one door marked
# --------------------------------------------------------------------------


def location():
    s = head(
        "Location",
        "A street plan on the downtown Los Angeles angle. South Broadway runs through it and the warehouse door is marked in red.",
    )

    parts = []
    ang = -28.0
    cx, cy = W / 2, H / 2

    # Blocks are drawn as solids and the streets are the paper left between
    # them, which is how a printed street plan actually reads.
    inner = []
    step_a, step_b = 152, 194  # avenue pitch, cross street pitch
    gap_a, gap_b = 16, 18
    shift = 11  # widens the one avenue into a proper arterial

    for i in range(-6, 7):
        for j in range(-4, 5):
            x = i * step_a + gap_a / 2 + (shift if i >= 0 else -shift)
            y = j * step_b + gap_b / 2
            inner.append(
                f'<rect x="{x:g}" y="{y:g}" width="{step_a - gap_a}" height="{step_b - gap_b}"'
                f' fill="rgba(17,17,17,.07)" stroke="rgba(17,17,17,.16)" stroke-width="1.4"/>'
            )

    # South Broadway: a paper corridor with two ink edges and a dashed centre.
    span = 1400
    inner.append(f'<rect x="-19" y="{-span}" width="38" height="{span * 2}" fill="{PAPER}"/>')
    inner.append(
        f'<path d="M-19 {-span}V{span}M19 {-span}V{span}" stroke="{INK}" stroke-width="2.6" fill="none"/>'
    )
    inner.append(
        f'<path d="M0 {-span}V{span}" stroke="{INK}" stroke-width="1.6" fill="none"'
        f' stroke-dasharray="16 14" opacity=".45"/>'
    )

    parts.append(f'<g transform="translate({cx} {cy}) rotate({ang})">{"".join(inner)}</g>')

    # The door, marked square on so it reads as a pin and not as a building.
    parts.append(
        f'<path d="M{cx} {cy - 168}v122M{cx} {cy + 46}v122M{cx - 168} {cy}h122M{cx + 46} {cy}h122"'
        f' stroke="{INK}" stroke-width="2" fill="none" opacity=".5"/>'
    )
    parts.append(box(cx - 36, cy - 36, 72, 72, fill=SHEET, sw=3))
    parts.append(box(cx - 18, cy - 18, 36, 36, fill=SIGNAL, sw=0))

    # North mark, plain.
    nx, ny = W - 128, 128
    parts.append(box(nx - 36, ny - 36, 72, 72, fill=PAPER, sw=1.6, stroke=HAIR))
    parts.append(
        f'<path d="M{nx} {ny + 22}V{ny - 24}M{nx - 12} {ny - 12}L{nx} {ny - 24}L{nx + 12} {ny - 12}"'
        f' stroke="{INK}" stroke-width="2.4" fill="none"/>'
    )

    s += "  " + "\n  ".join(parts) + "\n"
    s += crops()
    return s + tail()


PLATES = {
    "plate-warehousing.svg": warehousing,
    "plate-fulfillment.svg": fulfillment,
    "plate-integrations.svg": integrations,
    "plate-location.svg": location,
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in PLATES.items():
        path = os.path.join(OUT, name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(fn())
        print("wrote", path, os.path.getsize(path), "bytes")


if __name__ == "__main__":
    main()
