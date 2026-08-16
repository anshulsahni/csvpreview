# CSV-35 — Plan for the tools hub page

Written in ASD-STE100 Simplified Technical English.

## 1. Why we do this

Ticket CSV-35 asks for one page that shows all the free tools.

A user wants to see all the tools in one place. A search engine must read all the tool pages as one group. Ticket CSV-32 made this structure for the data pages in commit `e663154`. We now make the same structure for the tool pages.

The site has two tool pages:

- `/tools/csv-to-excel`
- `/tools/excel-to-csv`

No page on the site has a link to these two pages. The command `grep -rn "tools/" app lib` finds only `app/sitemap.ts`. The two converter components have a link to each other. The route `/tools` does not exist. No file holds the list of the tools. The two navigation bars do not show the tools.

After this change:

- The page `/tools` shows all the tools.
- The two navigation bars and the about page have a link to `/tools`.
- Each tool page has a breadcrumb with a link back to `/tools`.
- One file holds the tool list. The hub page and the sitemap read this file.

## 2. Decisions from the user

- Make a flat hub at `/tools`. Do not make a category level.
- Do not change the two tool URLs. Thus you do not add a redirect.
- Add `/tools` to the two navigation bars, to the tool pages, and to the about page.
- Do not show the CSV viewer at `/` as a tool.
- Put the tool list in a new file `lib/tools.ts`.

## 3. Make the tool list file

Make the new file `lib/tools.ts`. Use the same structure as `lib/datasets/categories.ts`. Do not import other modules into this file. The file must stay independent.

Write these types and functions:

```ts
export interface ToolMeta {
  slug: string;              // "csv-to-excel"
  name: string;              // "CSV to Excel" — card title and breadcrumb text
  applicationName: string;   // "CSV to Excel Converter" — name for the JSON-LD data
  transform: string;         // "csv → excel" — small label on the card
  tagline: string;           // one sentence for the card
  highlights: string[];      // two or three short words for the chips
}

export const tools: ToolMeta[];                       // the order here is the display order
export function getToolBySlug(slug: string): ToolMeta | undefined;
export function getToolPath(slug: string): string;    // `/tools/${slug}`
export function getOtherTools(slug: string): ToolMeta[];
```

Put the two tools in the list. Use the text that the tool pages already have. The files are `app/tools/csv-to-excel/page.tsx` and `app/tools/excel-to-csv/page.tsx`. Use the `EyebrowLabel` text from the two converter components for the `transform` field.

Keep only card data and link data in this file. Keep the `metadata` object, the `keywords` and the FAQ items in their page files. Do not move them.

## 4. Make the `/tools` route

### 4.1 The layout file

Make the new file `app/tools/layout.tsx`. It must put the children in this element:

```tsx
<div className="tools-theme" style={{ flex: "1 0 auto" }}>
```

Keep the comment that tells why `flex: 1` alone cuts the background short.

Then remove these two files:

- `app/tools/csv-to-excel/layout.tsx`
- `app/tools/excel-to-csv/layout.tsx`

The two files have the same content. The new layout replaces them. If you keep them, the tool pages get two wrappers.

### 4.2 The style file

Make the new file `app/tools/tools-theme.css`. Use the same structure as `app/data/data-theme.css`. The file has nine lines:

- One line with `@import '../claude-design-theme.css';`
- One rule for `.tools-theme h3` that sets the serif font.

Then add `.tools-theme` to the five `:where(.about-theme, .data-theme)` selectors in `app/claude-design-theme.css`. That file tells you to add new routes to the selector list. Do not write the token block again.

The tokens do not change. Thus the two tool pages look the same as before.

## 5. Make the hub page

Make the new file `app/tools/page.tsx`. Use the same structure as `app/data/page.tsx`.

Write the `metadata` object:

- `title`: `"Free CSV & Excel Tools | CSV Preview"`
- `description`: one sentence about the two converters
- `keywords`
- `robots: { index: true, follow: true }`
- `alternates.canonical: "/tools"`
- `openGraph` with `url: "/tools"` and `brandOpenGraphImages`
- `twitter`

Get these values from `@/lib/brand`. Write the canonical path as a relative path. The file `app/layout.tsx` sets `metadataBase`.

Write the page body in this order:

1. `<AboutNavbar />` — the tool pages already use this bar.
2. `<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Tools" }]} />`
3. `<main><ToolsHubContent /></main>`
4. The JSON-LD `<script>` element.

## 6. Make the hub components

Make these new files in `app/tools/components/`:

**`toolsJsonLd.ts`** — a pure function `computeToolsHubJsonLd(tools, siteUrl)`. It returns a `CollectionPage` object and an `ItemList` of `SoftwareApplication` items. It builds the items from the tool list file. The `/data` pages do not have an `ItemList`. Thus this is new. We add it because the tool pages already send `WebApplication` data. Keep the function pure. Then you can test it. The function `computeBreadcrumbJsonLd` in `app/components/Breadcrumb/hooks.ts` is in the same style.

**`ToolsHubContent.tsx`** — use the same structure as `app/data/components/DataHubContent.tsx`. Use the same Linaria `styled` blocks: `Wrapper`, `Hero`, `Lede`, `Stats` and `Grid`. Use the same tokens: `--s-*`, `--text-*`, `--surface` and `--shadow-card`. Put one italic `<Accent>` word in the `h1` element. Calculate the number in the stats block from `tools.length`. Then the number is always correct.

**`ToolCard.tsx`** — use the same structure as `app/data/components/CategoryCard.tsx`. Make the full card a `styled(Link)` element with `href={getToolPath(tool.slug)}`. The card shows:

- `<h3>{tool.name}</h3>`
- the `transform` label in the mono font
- the `tagline`
- the `highlights` chips
- a footer with the path and an arrow

## 7. Add the links

Do these six changes:

1. In `app/components/Navbar.tsx`, add `<Link href="/tools">Tools</Link>` before the Data link and the About link.
2. In `app/about/components/AboutNavbar.tsx`, add `<Link href="/tools">tools</Link>` between the `app` link and the `data` link.
3. In `app/tools/csv-to-excel/page.tsx`, add a `<Breadcrumb />` element between `<AboutNavbar />` and `<main>`.
4. In `app/tools/excel-to-csv/page.tsx`, add the same element.
5. Use these breadcrumb items: `Home` (`/`), `Tools` (`/tools`), and the tool name from the tool list file.
6. In `app/about/components/AboutContent.tsx`, add a short `<Section>` with the label `free tools`. Put one link to `/tools` in it.

Use the component `@/app/components/Breadcrumb`. It also sends the `BreadcrumbList` data to the search engine.

Do not put a link to each tool page on the about page. Put only the link to `/tools`. Ticket CSV-32 removed this flat structure from the data pages.

## 8. Change the sitemap and the llms.txt file

In `app/sitemap.ts`:

- Add this static entry: `{ url: `${SITE_URL}/tools`, changeFrequency: "weekly" }`. The `/data` entry uses the same frequency.
- Remove the two tool URLs that the file holds now.
- Calculate the two tool URLs from the tool list file:

```ts
tools.map((t) => ({ url: `${SITE_URL}${getToolPath(t.slug)}`, changeFrequency: "monthly" }))
```

- Keep this order for the static pages: `/`, `/about`, `/tools`, the tool pages, `/data`.

In `public/llms.txt`, add a `## Free Tools` section. Put the hub link and the two tool links in it. The file has no `/tools` link now.

## 9. Write the tests

Make the new file `__tests__/lib/tools.test.ts`. Use the same style as `__tests__/lib/datasets/categories.test.ts`. Put all the expected values at the bottom of the file. Do not calculate them from the code that you test. Add a `describe("hardcoded expectations are self-consistent")` block first. Then test these items:

- the slugs, in the correct order
- the display names
- that each slug is unique
- that each slug uses lower case letters and hyphens
- `getToolBySlug` with a good slug and with a bad slug
- the result of `getToolPath`
- that `getOtherTools` does not give the tool that you sent to it

Make the new file `__tests__/app/tools/toolsJsonLd.test.ts`. Make sure that `computeToolsHubJsonLd` gives one `ListItem` for each tool. The first `position` value must be 1. Each URL must be a full `csvpreview.com` URL.

Change the file `__tests__/app/sitemap.test.ts`. This test holds the exact contents of the sitemap. Do these changes:

- Change `STATIC_PAGE_COUNT` from 5 to 6.
- Change `TOTAL_URL_COUNT` from 57 to 58.
- Add `https://csvpreview.com/tools` to `EXPECTED_STATIC_URLS` and to `EXPECTED_STATIC_ENTRIES`. Use the new order.
- Add a test for the hub URL.

The test for the data URLs looks only at paths that contain `/data/`. Thus the new tool URLs do not break it.

Do not write a React Testing Library test for the hub page. The AGENTS.md file, section 1.5, permits this. The page only does a `map` on the tool list.

## 10. How to test the work

1. Run `npm test`. Look at the sitemap test and the two new test files.
2. Run `npm run lint`.
3. Run `npm run build`. The build shows that Next.js can make the `/tools` page. It also shows that the two tool routes still work after you remove their layout files.
4. Run `npm run dev`. Then do these checks:
   - Open `/tools`. Make sure that the page shows the hero, the number of tools, and one card for each tool. Click each card. Make sure that it goes to the correct tool.
   - Open `/tools/csv-to-excel` and `/tools/excel-to-csv`. Make sure that they look the same as before. The cream background must fill a long page. Make sure that each page shows `Home › Tools › …`.
   - Open `/`, `/data`, `/about` and the two tool pages. Make sure that each page shows the Tools link. Make sure that the about page has a link to `/tools`.
   - Show the page source of `/tools`. Make sure that it has one `BreadcrumbList` script and one `CollectionPage` script with an `ItemList`. The URLs must start with `https://csvpreview.com/tools`.
5. Run `curl -s localhost:3000/sitemap.xml | grep tools`. The output must show the hub URL and the two tool URLs. It must not show a URL two times.
