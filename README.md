# Shipfront / THE PRESS

Marketing site for **Shipfront**, a third party logistics warehouse at 1933 S. Broadway,
Los Angeles.

THE PRESS is the fourth sibling in the Shipfront set, and it deliberately walks away from
the Terminal look. No night dock, no near black wash, no warm black chrome. This one is
newsprint: paper canvas, black ink, huge display type, hairline rules, and exactly one
signal color.

Static HTML, CSS, and JavaScript at the repo root. No build step, no framework, no
dependencies.

## Pages

| Page          | File            | H1                |
| ------------- | --------------- | ----------------- |
| Home          | `index.html`    | You Sell. We Ship. |
| Get a Quote   | `quote.html`    | Get a Quote.      |
| Contact       | `contact.html`  | Contact.          |

Navigation is Home / Get a Quote / Contact. The only call to action anywhere on the site is
**Get a Quote**.

## Published copy

- `claw` holds the source, including the fonts and the truck JPEG.
- `gh-pages` holds the built site and is refreshed by
  `.github/workflows/pages.yml` on every push to `claw`.

**GitHub Pages still needs one manual switch.** The workflow token cannot create
a Pages site, because that endpoint requires repository admin. To turn it on:
Settings, then Pages, then set Source to "Deploy from a branch", pick branch
`gh-pages` and folder `/ (root)`, then Save. The site then answers at
https://davidtphung.github.io/shipfront-the-press/ and stays current on its own.

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
| Sheet        | `#FFFFFF` | Inputs, image frames                             |
| Ink          | `#111111` | Type, hairlines, the closing CTA slab            |
| Mute         | `#5C5852` | Secondary copy, mono labels                      |
| Signal       | `#FF2D2D` | The only accent. Primary CTA, numbers, rules     |

- **Display face:** Space Grotesk, weights 400 through 700, self hosted as a variable
  woff2 in `fonts/`. Used heavy and tight for every headline.
- **Index face:** JetBrains Mono, for eyebrows, numbers, labels, and buttons.
- No Inter, no serif, no glass, no frost. Border radius is 0. Rules are 1px hairlines.
- CTA contrast is locked: ink on red for primary, white on ink for the ghost on dark
  sections. Never white on a weak orange.

### Mark

A cube wireframe treated as a **press stamp**: a 1px ink square with the cube inside.
Hover presses it down 1px and flips the strokes to the signal red. No yaw, no glow, no
pulse. The cube geometry starts on the path `M7 9 L12 6` and is drawn on integer
coordinates in a 24 unit box. Same geometry in `favicon.svg`.

### Motion

- Headlines clip up from behind their own overflow box.
- Section content rises with a stagger driven by `data-stagger` on the parent.
- Hover transitions are 220ms.
- The `You Sell. We Ship.` band is a real line from the site repeated, not a fake live
  telemetry marquee. It pauses on hover.
- `prefers-reduced-motion: reduce` turns all of it off. Nothing animates, nothing hides,
  and the marquee sits still.

The pre-reveal state is deliberately opt-in. A small inline script in each `<head>` sets
`data-js="on"` on `<html>`, and every hidden starting style is scoped to that attribute.
So the motion is additive rather than load bearing:

- Scripting disabled, or `press.js` blocked or 404: the attribute is never set, so every
  headline and section renders in its final position. The page loses the animation and
  nothing else.
- `press.js` present but failing to boot: the same inline script clears the attribute
  after 2 seconds unless `boot()` has set `data-ready="true"`, which reveals everything.

This matters because the reveal works by hiding content first. Without the guard, any
script failure would leave the page blank.

## Structure

```
index.html          Home
quote.html          Get a Quote
contact.html        Contact
favicon.svg         Cube stamp
css/press.css       Tokens, layout, components, motion
js/press.js         Reveals, mobile drawer, quote form
fonts/              Space Grotesk + JetBrains Mono, latin and latin-ext woff2
images/logistics.jpg  Freight truck plate
```

### The truck image

`images/logistics.jpg` is a byte for byte copy of the shared Shipfront asset. Do not
regenerate or re-encode it. The publish workflow asserts both values on every run.

```
sha1  01268520751d59bf9762d2d7d7c3e1555ba60c8d
size  376501 bytes
```

## The quote form

Three fields: **Name, Email, Company**. No phone number.

There is no backend. `js/press.js` validates on blur and on submit, then swaps the form for
a confirmation panel that also builds a prefilled `mailto:` link to
`info@myshipfront.com`. If you wire this to a real endpoint later, the submit handler in
`quoteForm()` is the single place to change.

## Copy rules

This site describes a warehouse. It does not describe a software product.

- Shipfront is a 3PL at 1933 S. Broadway, Los Angeles. It is not a freight OS.
- Home H1 is exactly `You Sell. We Ship.`
- The four things we talk about: Warehousing, Fulfillment, eCommerce Integrations,
  Location.
- No invented SLAs, no FDA or temperature claims, no WMS, no metrics, no shipment IDs, no
  carrier tables, no AI chat, no Pricing page, no Developers page.
- No em dashes anywhere in the copy.

The publish workflow enforces the H1 and the no dash rule on every run.

## Accessibility

Skip link, one `h1` per page, hairline focus rings in the signal color, labeled form
fields with `role="alert"` error slots, `aria-current` on the active nav item, an
`aria-expanded` mobile drawer, full reduced motion support, and readable content with
scripting turned off.

## Credits

Built by David T Phung. info@myshipfront.com.
