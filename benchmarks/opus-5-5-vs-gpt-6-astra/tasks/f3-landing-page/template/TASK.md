# Task: landing page for Tidepool

Build the marketing landing page for **Tidepool**, a (made-up) app that keeps one shared grocery
list for a household. Make it look like a real, polished product page: the visual design, layout,
colours, type and any illustrations are up to you.

You may use any framework or none. The deliverable is a static build:

- `npm run build` must produce `dist/index.html` (plus any assets it needs).
- The site must work when `dist/` is served by a plain static file server at the root URL (`/`),
  and it must not load anything from other servers: no web fonts, images, scripts or styles from
  CDNs. Use system fonts or fonts you bundle, and draw illustrations with inline SVG or CSS.
- When you finish, the `dist/` folder must be built and up to date.

Automated browser tests will check the requirements below, so follow the texts and attributes
precisely. Use the copy below as written.

## Copy

**Header**: the name "Tidepool" and a navigation with three links: "Features" (to `#features`),
"Pricing" (to `#pricing`) and "FAQ" (to `#faq`).

**Hero**
- Headline (the page's only `<h1>`): Groceries, sorted together.
- Subheadline: Tidepool keeps one shopping list for the whole household, in sync on every phone,
  so nobody buys the third jar of mustard.
- Primary button: Get Tidepool free
- Secondary link: See pricing (to `#pricing`)

**Features** (section with `id="features"`)
- Lists that sync instantly: Add milk on the bus, and it's on your partner's list before they
  reach the checkout.
- Aisle-by-aisle order: Tidepool learns your store's layout and sorts the list the way you walk
  it.
- Recipes to list in one tap: Paste a recipe link and the ingredients land on the list, minus
  what you already have.

**Pricing** (section with `id="pricing"`)

| Plan   | Monthly | Includes                                                   |
| ------ | ------- | ---------------------------------------------------------- |
| Free   | $0      | 1 list, 2 people                                           |
| Family | $4      | Unlimited lists, 6 people, recipe import                   |
| Plus   | $9      | Everything in Family, store layouts, 12 people, priority support |

The Family plan is labelled "Most popular". A toggle labelled "Bill yearly (2 months free)"
switches the prices between monthly and yearly; a year costs 10 months.

**FAQ** (section with `id="faq"`)
- Does everyone need an account? — Yes, each person signs in with an email address or a phone
  number. Invites take a few seconds.
- Does it work offline? — Yes. Changes made offline sync as soon as you're back online.
- Can I cancel any time? — Yes. Your lists stay free on the Free plan after you cancel.
- Which stores does it know? — Store layouts cover 4,000 supermarkets in Europe and North
  America, and grow every week.

**Footer**: © 2026 Tidepool, and links to Privacy, Terms and Contact (they can point to `#`).

## Behaviour

- **Prices**: elements with `data-testid="price-free"`, `data-testid="price-family"` and
  `data-testid="price-plus"` show the price exactly as `$4/mo` when monthly and `$40/yr` when
  yearly (and so on for each plan). Monthly is the default.
- **Billing toggle**: an element with `data-testid="billing-toggle"` switches between monthly and
  yearly when clicked. It's a switch, a checkbox or a button, and its state is exposed with
  `aria-checked`, `checked` or `aria-pressed` (true when yearly).
- **FAQ**: each question is a `<button>` with `aria-expanded` and an `aria-controls` pointing to
  the id of its answer. All answers start collapsed (not visible); clicking a question shows or
  hides its answer and updates `aria-expanded`.
- **Mobile navigation**: when the viewport is narrower than 768 px, the three navigation links are
  hidden until a button with `data-testid="menu-button"` is pressed; it has `aria-expanded`
  reflecting whether the links are shown. At 768 px and wider, the links are always visible and
  the menu button is not.
- **Responsive**: at viewports 360, 768 and 1280 px wide, the page must not scroll sideways.
- **Accessible**: no accessibility violations of serious or critical impact in an axe-core
  (4.x) scan, at 1280 and 390 px wide.
