# Example tickets

Copies of the tickets that `SKILL.md` names as style references. Read these
instead of fetching them from Linear. Snapshot taken 2026-08-16.

Each block below is the real description, word for word.

---

## The common case: 1-3 plain bullets

Most tickets look like this. Copy this shape first.

### CSV-16 — Implement sorting by date, in case all the values are valid date format

Labels: none · Priority: Medium · Status: Todo

```markdown
As a user if any of column is a date column - all the values in the column are valid date format - then I should be able to sort considering the values as date while sorting and not as string or number
```

### CSV-19 — Implement currency formatting for numbers.

Labels: none · Priority: Low · Status: Todo

Shows that an open question can sit in the ticket as one italic line.

```markdown
* As a user, I should be able to format numbers as currency, with a currency symbol of my choosing

*Very rough user story  & requirement, will need more thought to be put onto it*
```

### CSV-22 — Implement a chrome extension using the core csv handling library

Labels: none · Priority: Low · Status: Todo

Shows a bullet with no "As a <role>" opener. Plain intent is fine.

```markdown
* As part of moving the code functionality to an open-core or a open-source library, the second step will be implementing a chrome extension, which will be separate approach for accessing csvpreview app to edit, view, convert or download csvs
```

### CSV-28 — Implement support for handling large CSV files seamlessly in the application

Labels: none · Priority: Urgent · Status: Done

Shows the "Reality / Expectation" pair. Use it for a bug or a gap. The two
words are the only structure. They are not markdown headers.

```markdown
Realiy

* As a user, if I upload a csv fie of more than 1k rows, the application slows down and starts giving jittery experience, even with scrolling

Expectation

* As a user, I should be able to work on very large csv files also with ease, without my system getting frozen or any kind of jittery experience
```

### CSV-32 — Implement hub and spoke model in structuring pages for better SEO categorisation and getting better rankings in search engine on different kinds of queries

Labels: none · Priority: Urgent · Status: Done

Shows a non-human role, "a search engine bot". Also shows nested sub-bullets
that carry the how, under a bullet that carries the what.

```markdown
* As a search engine bot, when I visit your site I am unable to understand the topical category of your data pages. None of your data ages aren't connected to home page, all of those are linked via about us page, all of those are linked from the same central page.
* As a search engine bot, this is too much information for spread at same level, I am unable to understand why the page US Presidents, list of endangered species and dog-breeds all of the pages are reachable from same about page
* As a search engine bot I want all the pages to be categorised in different categories, so that I can analyse each category separately and understand the use case of different pages in that category or sub-category.
  * For categorisation we can consider keeping the url of pages nested according to categories, but not necessary, we can also just have one page acting as the central hub for that category, the central hub will be just having the links of other pages of that respective category and nothing else.
  * If you are following the above mentioned approach then  make sure none of the already indexed pages are left dangling like this with broken links rather add proper redirect to them with 308 or 301 status code.
```

---

## The rare case: light structure

Use headers only when the ticket is genuinely complex. These two are the only
examples. Do not treat them as the default.

### CSV-15 — Make csvpreview full keyboard operaable

Labels: none · Priority: Medium · Status: Todo

The lightest form of structure: one italic warning line, then a flat list.

```markdown
*This ticket needs a review, more thinking and possibly some research with Claude*


Using keyboard shortcut framework implement following shortcuts

* O to  open/upload a new csv file, this will replace the existing csv content
* cmd+C to copy the selected content - will work only if 1 or more cells are selected
* C - this key will select the whole content - until the last filled row & last filled column
* cmd+A, this trigger the selection of the whole content - until last row & last column with value
```

### CSV-31 — Split the maths out of the grid's scroll-to-cell code so it can be tested simply

Labels: none · Priority: High · Status: Todo

The fullest ticket in the team. It earns its headers because it explains a
refactor with a rationale. Note the plain, simple English throughout — short
sentences, no jargon, and the headers are questions in plain words rather than
process labels.

````markdown
## What is wrong

When you press an arrow key and the cell you are moving to is not on screen, the grid has to scroll to it first. The code that does this lives in `scrollRowIntoView` inside `app/components/SpreadsheetGrid/gridDomUtils.ts`.

That one function does two different jobs at the same time:

1. It asks the browser where things are on screen — how tall the scroll area is, where a row sits, how tall the header is, how far down the user has scrolled.
2. It does the maths to work out where to scroll to.

Mixing the two makes the function hard to test.

## Why it is hard to test

Our tests do not run in a real browser. They run in a fake one called jsdom, and jsdom does not draw anything. Nothing has a real size or position there — every measurement comes back as zero.

So before a test can check the maths, it has to fake the whole screen layout by hand: the size of the scroll area, the height of the header, and the position of every single cell. In the test file I just added (`__tests__/components/SpreadsheetGrid/gridDomUtils.test.ts`) that fake setup is about 80 lines, while the actual tests are about 88. Half the file exists only to make jsdom pretend it can draw.

There is a worse problem too. To decide which rows to fake, the test has to copy the rule the grid uses to pick which rows to show. That rule already lives in the real code, in `computeRowWindow`. Now there are two copies of it. If someone changes the real one, the copy in the test does not change with it. The test would keep passing while testing something that no longer matches the app.

## What to do

Move the maths into its own function that takes plain numbers and returns a plain number. Something like:

```ts
export function computeScrollTopForRow(
  targetIdx: number,
  sampleIdx: number,
  sampleTop: number,
  rowHeight: number,
  headerHeight: number,
  viewTop: number,
  viewportHeight: number
): number | null
```

It returns the new scroll position, or `null` when the row is already visible and no scrolling is needed.

`scrollRowIntoView` then becomes short and boring: read the measurements from the browser, pass them to this function, and set the scroll position to whatever comes back.

## Why this helps

* The maths can be tested with plain numbers. No fake layout at all. Each case — row is above the screen, row is below the screen, row is already visible — becomes a two-line test.
* The copied rule about which rows are shown goes away, so nothing can drift out of sync.
* What is left needs only two DOM tests: a cell already on screen gets focused straight away, and a cell that is not on screen gets focused once its row appears.
* It follows our own guideline 1.2, which says to keep pure helpers in their own file next to the component and unit test them.

## How we know it is done

* `computeScrollTopForRow` exists as a pure function with its own tests, no DOM involved.
* The DOM test file is much smaller and no longer copies `computeRowWindow`'s rule.
* Keyboard navigation still works in the browser: arrow keys and Ctrl+arrow jump to a far-off row and land on the right cell, scrolling both down and up.

## Background

This came out of the CodeRabbit review on PR #64. The tests were added there and they do pass — this is about making them simpler and safer to rely on, not about fixing a bug.
````

---

## Keeping this file current

This is a snapshot, not a live view. Refresh a block with
`mcp__linear-server__get_issue` only when a ticket here looks out of date or a
new one becomes a better example.
