# Shipfront / Terminal

Marketing site for **Shipfront**, a third party logistics warehouse at The Reef,
1933 S. Broadway, Los Angeles, CA 90007.

This is the live three-pager recut to the locked Friday Terminal direction:
black, white, cube, one accent. Orange `#FF6A00` only on the wordmark bar and
Get a Quote. The CTA label is `#000` on the accent.

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

Copy stays with [myshipfront.com](https://www.myshipfront.com/). Product facts
that are not on that site are not invented here. Claims the lock forbids
(phone, SLAs, FDA, WMS, temperature) are not restated even when the live page
uses them.

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

Black, white, cube, one accent.

| Role      | Value     | Use                                              |
| --------- | --------- | ------------------------------------------------ |
| Ground    | `#000000` | Page background                                  |
| Sheet     | `#111111` | Tiles, inputs, raised slabs                      |
| Type      | `#FFFFFF` | Headlines, body, rules                           |
| Mute      | `#8A8A8A` | Secondary copy, mono labels                      |
| Accent    | `#FF6A00` | Wordmark bar and Get a Quote only                |
| CTA ink   | `#000000` | Label on the accent                              |

- **Display face:** Space Grotesk, weights 400 through 700, self hosted as a variable
  woff2 in `fonts/`.
- **Index face:** JetBrains Mono, for eyebrows, numbers, labels, and buttons.
- No Inter, no serif, no glass, no frost. Border radius is 0. Rules are 1px
  hairlines.
- CTA contrast is locked: `#000` on `#FF6A00`. Never white on orange.

### Mark

Kunal hex plus inner Y, stem down. Three filled faces `#000`, one accent stroke,
square caps, miter joins. ViewBox is `0 0 80 80`. This is not a pip, and it is
not the rejected `32x36` / `M16 3.2` drawing.

The cube sits on the orange wordmark bar with the SHIPFRONT word. Same geometry
in `favicon.svg` on the accent field.

### Capability tiles

The four things Shipfront does are the spine of Home: Warehousing, Fulfillment,
eCommerce Integrations, Location. Each tile is a still, then the title, a short
body, and one path out, which is always Get a Quote.

- The still is the rest state. It does not drift, breathe, or scale on hover.
- Do not generate or replace stills. The truck JPEG and the four plate SVGs
  stay byte for byte as committed.
- Every word is in the markup at rest.
- The tiles are a plain `ul`. They are never tabs.

### Motion

Motion is a spring library and three rules, all in `js/press.js`.

1. **Feedback lands on pointer down, not on click.**
2. **Everything is interruptible.**
3. **Only transform and opacity animate per frame.**

`prefers-reduced-motion: reduce` drops all of it to an opacity cross fade.
`prefers-reduced-transparency: reduce` takes the masthead and the sheet to solid
`#000000`.

The pre-reveal state is opt-in via `data-js="on"` in each `<head>`. Scripting
disabled, or `press.js` blocked: every headline and section renders in its final
position.

## Structure

```
index.html            Home
quote.html            Get a Quote
contact.html          Contact
favicon.svg           Kunal cube on the accent field
css/press.css         Tokens, layout, components, motion contract
js/press.js           Springs, press, sheet, settling masthead, reveals, form
fonts/                Space Grotesk + JetBrains Mono, latin and latin-ext woff2
images/logistics.jpg  Freight truck plate, byte locked
images/plate-*.svg    The four capability stills. Do not regenerate.
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

- Shipfront is a 3PL at The Reef, 1933 S. Broadway, Los Angeles, CA 90007. Reef is
  an address.
- Home H1 is exactly `You Sell. We Ship.`
- The four things we talk about: Warehousing, Fulfillment, eCommerce Integrations,
  Location.
- No invented phone. No invented SLAs, no FDA or temperature claims, no WMS, no
  metrics, no shipment IDs, no carrier tables, no AI chat, no Pricing page, no
  Developers page, no Sign in, no Request access.
- No em dashes anywhere in the copy. Periods, commas, parentheses.
- No cartoons.

The publish workflow enforces all of this on every run. A broken lock fails the
build instead of shipping.

## Accessibility

Skip link, one `h1` per page, hairline focus rings, labeled form fields with
`role="alert"` error slots, `aria-current` on the active nav item, a sheet that
is a real `dialog` with `aria-modal`, a focus trap, Escape to close, focus
returned to the control that opened it, `inert` on the page behind it, full
reduced motion and reduced transparency support, and readable content with
scripting turned off.

## Credits

Built by David T Phung
