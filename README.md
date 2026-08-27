# Shipfront / THE PRESS

Marketing site for **Shipfront**, a third party logistics warehouse at 1933 S. Broadway,
Los Angeles, CA 90007.

THE PRESS is the fourth sibling in the Shipfront set, and it deliberately walks away from
the Terminal look. No night dock, no near black wash, no warm black chrome. This one is
newsprint: paper canvas, black ink, huge display type, hairline rules, and exactly one
signal color.

Static HTML, CSS, and JavaScript at the repo root. No build step, no framework, no
dependencies.

## Pages

| Page          | File            | H1                 |
| ------------- | --------------- | ------------------ |
| Home          | `index.html`    | You Sell. We Ship. |
| Get a Quote   | `quote.html`    | Get a Quote.       |
| Contact       | `contact.html`  | Contact.           |

Three pages, and there is no fourth. Navigation is Home / Get a Quote / Contact. The only
call to action anywhere on the site is **Get a Quote**.

## Published copy

- `claw` holds the source, including the fonts and the truck JPEG.
- `gh-pages` holds the built site and is refreshed by
  `.github/workflows/pages.yml` on every push to `claw`.

**GitHub Pages still needs one manual switch.** The workflow token cannot create
a Pages site, because that endpoint requires repository admin. To turn it on:
Settings, then Pages, then set Source to "Deploy from a branch", pick branch
`gh-pages` and folder `/ (root)`, then Save. The site then answers at
https://davidtphung.github.io/shipfront-the-press/ and stays current on its own.
Until that switch is flipped the address returns 404, even though `gh-pages` is
built and up to date.

Routing is flat: `/`, `/quote.html`, `/contact.html`. Every link and asset path is
relative, so the site works unchanged from a subdirectory.

## Run it locally

Any static file server works. There is nothing to install and nothing to compile.

```bash
python3 -m http.server 47381
```

Then open http://127.0.0.1:47381.

Alternatives, if you prefer:

```bash
npx serve . -l 47381
php -S 127.0.0.1:47381
```

## Design

Paper, not Terminal.

| Role         | Value     | Use                                              |
| ------------ | --------- | ------------------------------------------------ |
| Canvas       | `#F7F5EF` | Page background, newsprint tone                  |
| Sheet        | `#FFFFFF` | Capability tiles, inputs, image frames           |
| Ink          | `#111111` | Type, hairlines, the closing CTA slab            |
| Mute         | `#5C5852` | Secondary copy, mono labels                      |
| Signal       | `#FF2D2D` | The only accent. Primary CTA, numbers, rules     |

- **Display face:** Space Grotesk, weights 400 through 700, self hosted as a variable
  woff2 in `fonts/`. Used heavy and tight for every headline.
- **Index face:** JetBrains Mono, for eyebrows, numbers, labels, and buttons.
- No Inter, no serif, no glass, no frost. Border radius is 0, and 2px on plates. Rules
  are 1px hairlines.
- Plates carry an 11px caps label and a `rgba(0, 0, 0, .06)` hairline.
- CTA contrast is locked: ink on red for primary, white on ink for the ghost on dark
  sections. Never white on red, and never a weak orange.

### Mark

A cube wireframe treated as a **press stamp**: a 1px ink square with the cube inside.
Hover flips the strokes to the signal red. No yaw, no glow, no pulse. The cube geometry
starts on the path `M7 9 L12 6` and is drawn on integer coordinates in a 24 unit box.
Same geometry in `favicon.svg`.

### Capability tiles

The four things Shipfront does are the spine of Home, and each one is a tile rather than
a row: a large still, then the title, a short body, and one path out, which is always
Get a Quote. Image first.

- The still is the rest state. It does not drift, breathe, or scale on hover.
- Hover and keyboard focus settle the chrome around the still instead: the number takes
  the signal, the hairlines darken, the rule under the call to action draws in, and the
  arrow steps 4px.
- Every word is in the markup at rest. Nothing is revealed only on hover, so a keyboard
  and a screen reader get the same copy a pointer does.
- The tiles are a plain `ul`. They are never tabs.

### Plates

`tools/plates.py` draws the four capability stills into `images/plate-*.svg`. They are
drawn rather than photographed because the only photograph this site ships is the byte
locked truck JPEG, and a stock warehouse would be inventing a building.

```bash
python3 tools/plates.py
```

Each plate is ink on paper on a register grid, with crop marks, hairline rules, square
corners, and exactly one element in the signal red. Rerunning the script is idempotent.

| Plate                       | Subject                                              |
| --------------------------- | ---------------------------------------------------- |
| `plate-warehousing.svg`     | Front elevation of a loaded four bay pallet rack      |
| `plate-fulfillment.svg`     | A packed carton on the belt, carrying its label       |
| `plate-integrations.svg`    | Five storefronts wired down into one receiving dock   |
| `plate-location.svg`        | The downtown street plan, the door marked on Broadway |

### Motion

Motion is a spring library and three rules, all in `js/press.js`.

1. **Feedback lands on pointer down, not on click.** A press is acknowledged the moment a
   finger touches the target: `scale(0.97)` over roughly 100ms, then a critically damped
   settle back to rest.
2. **Everything is interruptible.** Springs carry their own velocity, so a new target can
   arrive mid flight and the value keeps moving instead of restarting. Input is never
   locked while something animates.
3. **Only transform and opacity animate per frame.** Colour, hairlines, and shadows are
   left to 220ms CSS transitions.

Springs are critically damped, damping `1.0` and response `0.3` to `0.4`, so nothing
overshoots. They drive the press feedback, the sheet, and the settling masthead. They do
not drive the stills, which are at rest by definition.

- **Sheet.** The mobile menu is a live value from 0 to 1, not a toggled block. It can be
  opened, grabbed while it is still springing open, dragged back, and thrown, and the same
  spring drives every one of those. Pulling past the open stop rubber bands. Release hands
  the gesture velocity straight to the spring, and the throw is judged on where it is
  heading rather than where it stopped. In and out take the same path.
- **Settling masthead.** At the top of the page the bar is bare type on the paper. Once it
  has been scrolled past, the ink rule draws in, a light paper material comes up under it,
  and the read rule under the bar tracks scroll position with a `scaleX`. The bar's height
  never changes, so settling cannot shift the page under a pointer.
- **Reveals.** Headlines clip up from behind their own overflow box. Sections rise 18px,
  tiles rise 24px from `scale(0.98)`, staggered by `data-stagger` on the parent.
- **Ticker.** The `You Sell. We Ship.` band is a real line from the site repeated, not a
  fake live telemetry marquee. It pauses on hover.

`prefers-reduced-motion: reduce` drops all of it to an opacity cross fade. Scale and
overshoot are removed, the springs resolve instantly to their targets, the sheet fades
rather than slides, the marquee stops, and no content is ever left hidden.

`prefers-reduced-transparency: reduce` takes the masthead and the sheet to solid `#F7F5EF`
and removes the grain.

The pre-reveal state is deliberately opt-in. A small inline script in each `<head>` sets
`data-js="on"` on `<html>`, and every hidden starting style is scoped to that attribute.
So the motion is additive rather than load bearing:

- Scripting disabled, or `press.js` blocked or 404: the attribute is never set, so every
  headline and section renders in its final position. The page loses the animation and
  nothing else. `--settle` defaults to `1`, so the masthead is solid rather than
  transparent.
- `press.js` present but failing to boot: the same inline script clears the attribute
  after 2 seconds unless `boot()` has set `data-ready="true"`, which reveals everything.

This matters because the reveal works by hiding content first. Without the guard, any
script failure would leave the page blank.

## Structure

```
index.html            Home
quote.html            Get a Quote
contact.html          Contact
favicon.svg           Cube stamp
css/press.css         Tokens, layout, components, motion contract
js/press.js           Springs, press, sheet, settling masthead, reveals, form
fonts/                Space Grotesk + JetBrains Mono, latin and latin-ext woff2
images/logistics.jpg  Freight truck plate, byte locked
images/plate-*.svg    The four drawn capability stills
tools/plates.py       Draws images/plate-*.svg
```

### The truck image

`images/logistics.jpg` is a byte for byte copy of the shared Shipfront asset. Do not
regenerate or re-encode it, and do not move it through any API that only carries text.
The publish workflow asserts both values on every run.

```
sha1  01268520751d59bf9762d2d7d7c3e1555ba60c8d
size  376501 bytes
```

The four woff2 faces are pinned by sha256 in the same step, for the same reason.

## The quote form

Three fields: **Name, Email, Company**. No phone number.

There is no backend. `js/press.js` validates on blur and on submit, then swaps the form for
a confirmation panel that also builds a prefilled `mailto:` link to
`info@myshipfront.com`. If you wire this to a real endpoint later, the submit handler in
`quoteForm()` is the single place to change.

## Copy rules

This site describes a warehouse. It does not describe a software product.

- Shipfront is a 3PL at 1933 S. Broadway, Los Angeles, CA 90007. It is not a freight OS.
- Home H1 is exactly `You Sell. We Ship.`
- The four things we talk about: Warehousing, Fulfillment, eCommerce Integrations,
  Location.
- No invented SLAs, no FDA or temperature claims, no WMS, no metrics, no shipment IDs, no
  carrier tables, no AI chat, no Pricing page, no Developers page, no Sign in, no Request
  access.
- No em dashes anywhere in the copy. Periods, commas, parentheses.

The publish workflow enforces all of this on every run, along with the page count, the
palette, the mark geometry, the address and zip, the three form fields, the absence of a
phone number, and the footer credit. A broken lock fails the build instead of shipping.

## Accessibility

Skip link, one `h1` per page, hairline focus rings in the signal color, labeled form
fields with `role="alert"` error slots, `aria-current` on the active nav item, a sheet
that is a real `dialog` with `aria-modal`, a focus trap, Escape to close, focus returned
to the control that opened it, `inert` on the page behind it, full reduced motion and
reduced transparency support, and readable content with scripting turned off.

## Credits

Built by David T Phung. info@myshipfront.com.
