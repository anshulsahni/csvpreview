# CSV-29 — Fix button hover background in dark mode

## Context

[CSV-29](https://linear.app/csvpreview/issue/CSV-29/button-hover-bg-color-in-dark-mode-isnt-good-from-contrast-perspective)
(Bug, **Urgent**, currently Todo) reports two defects in one, with a screen recording attached:

1. **Contrast/readability** — in dark mode the hover background hurts the legibility of the button label.
2. **No perceptible change** — the hover background barely differs from the resting background, so the hover affordance reads as broken.

Investigation found these are not one button's problem but two systemic gaps in the token layer:

**Ghost/secondary buttons** (transparent base, `--foreground` label, `--border` outline) all hover to
`var(--subtle)`. In dark mode `--subtle` is `#1a1a1a` against a `#0a0a0a` page — a **1.14:1**
luminance step, effectively invisible. That is complaint #2.

**Filled/primary buttons** (`--primary` `#0070f3`, white label) hover via `filter: brightness(0.95)`.
This darkens in *both* themes, and 5% is imperceptible. `--primary` is a single flat value with no
`light-dark()` variant, so dark mode has no primary hover colour at all. That is complaint #1 and #2 together.

`app/globals.css` has exactly one hover token today — `--danger-hover` (line 18). There is no
`--hover-surface` and no `--primary-hover`. Every button re-declares its own hover, which is why the
behaviour drifted.

Intended outcome: two new theme tokens carry every button hover, both modes produce a clearly visible
hover step, and label contrast improves rather than degrades.

**Scope decision (agreed):** tokens + the hover declarations only. Hard-coded literals
(`#e11d48`/`#be123c` in the two modal close buttons, `color: #ffffff` on primary buttons,
`rgba(0,112,243,.08)` in `UploadModal`) and the five buttons that have no hover state at all
are **out of scope** — see Follow-ups.

## Step 1 — Add two tokens to `app/globals.css`

Add to the `:root` block, next to the existing `--danger-hover` (line 18) and `--subtle` (line 24):

```css
--primary-hover: #0059c1;
--hover-surface: light-dark(#e9ebef, #2e2e34);
```

Measured against the existing palette:

| | light | dark |
|---|---|---|
| `--hover-surface` vs `--background` | 1.19:1 (was 1.06:1) | **1.47:1** (was 1.14:1) |
| `--foreground` on `--hover-surface` | 15.0:1 | 11.5:1 |
| white label on `--primary-hover` | **6.57:1** (was 4.55:1 at rest) | 6.57:1 |
| `--primary-hover` vs `--background` | — | 3.02:1 (meets the 3:1 non-text minimum) |

`--primary-hover` is deliberately a single value, mirroring `--primary`, and darkens in both modes:
it raises the white label from a borderline 4.55:1 to a comfortable 6.57:1 while giving a **1.52×**
luminance step — the readability and the perceptibility fix in one move.

**Do not touch `--subtle`.** It is also used as a *static* surface at
`app/components/DownloadModal/DownloadModal.tsx:167` and `app/components/CountPills/CountPills.tsx:45`;
redefining it would change non-hover chrome. The new `--hover-surface` is a sibling, not a replacement.

**Name collision is safe.** `app/claude-design-theme.css:45` already defines `--primary-hover`
(the green "warm paper" value) under `:where(.about-theme, .data-theme, .tools-theme)`. That
declaration lands *directly* on the route wrapper element, and a direct declaration always beats an
inherited one regardless of selector specificity — so `/about`, `/data` and `/tools` keep their green
hover and the new `:root` value only reaches the app shell. Verify this visually (see Verification).

## Step 2 — Point ghost-button hovers at `--hover-surface`

Replace `background: var(--subtle)` with `background: var(--hover-surface)` in these `&:hover` blocks only:

- `app/components/CsvViewer/CopyControl.tsx:161, 186, 203` — `SimpleButton`, `Primary`, `Caret`
- `app/components/CsvViewer/DownloadControl.tsx:98, 115` — `Primary`, `Caret`
- `app/components/CsvViewer/CsvViewer.tsx:166` — `ClearButton`
- `app/components/Dropdown/Dropdown.tsx:58` — `MenuItem`
- `app/components/ConfirmModal/ConfirmModal.tsx:91` — `CancelButton`
- `app/components/DownloadModal/DownloadModal.tsx:191` — `CancelButton` (**not** line 167, a static bg)
- `app/components/ThemeToggle/ThemeToggle.tsx:108` — `Option:hover`

Plus one judgment call worth confirming on review: `app/components/ThemeToggle/ThemeToggle.tsx:112`
is the `[data-active="true"]` *selected* state, also on `--subtle`. Move it to `--hover-surface` as
well — otherwise the currently-selected theme pill becomes **less** prominent than a merely hovered
one. It keeps its `color: var(--primary)` to stay distinguishable from hover.

## Step 3 — Replace `filter: brightness(0.95)` with the token

In each `&:hover` block, swap the filter for `background: var(--primary-hover);`:

- `app/components/CsvViewer/CsvViewer.tsx:152` — `UploadButton`
- `app/components/DownloadModal/DownloadModal.tsx:206` — `DownloadButton` (`:hover:not(:disabled)`)
- `app/components/UploadModal/UploadModal.tsx:207` — `PickerButton`
- `app/components/UploadModal/UploadModal.tsx:254` — `PasteSubmitButton` (`:hover:not(:disabled)`)
- `app/data/[category]/[slug]/OpenInEditorButton.tsx:49` — `Button`

Keep every existing `:not(:disabled)` guard exactly as-is.

`OpenInEditorButton` sits inside the `.data-theme` scope, so its `var(--primary)` already resolves to
the warm-paper green; `var(--primary-hover)` resolves to the matching green hover there. This makes it
consistent with the tools-page buttons (`FileDropzone.tsx:118`, `CsvToExcelConverter.tsx:460`,
`ExcelToCsvConverter.tsx:346`) which already use `var(--primary-hover)` — no new token needed for it.

## Verification

No automated coverage exists for theming (`__tests__/lib/` has no `theme.test.ts`), so this is a
visual check plus a regression run.

1. `npm run dev`, then exercise both themes with the bottom-right `ThemeToggle` (Light / System / Dark).
2. **Dark mode, app shell** (`/`): load a CSV and hover Copy, Download and their split-button carets,
   the Clear button, and open a Dropdown. Each must show an obvious fill change — compare against the
   screen recording on the ticket.
3. **Dark mode, primary buttons**: hover Upload (`CsvViewer`), the Download button in `DownloadModal`,
   and both `UploadModal` buttons. The blue must visibly deepen and the white label must stay crisp.
4. **Light mode**: repeat 2–3 and confirm nothing regressed.
5. **Token-scope regression** — the important one: visit `/about`, `/tools`, and a `/data/[category]/[slug]`
   page in both themes. Buttons there must keep their **green** warm-paper hover, not the blue
   `--primary-hover`. If any turns blue, the `:root` declaration is leaking and
   `app/claude-design-theme.css` needs its tokens re-scoped.
6. Confirm the two static `--subtle` surfaces are unchanged: the `DownloadModal` field row and the
   `CountPills` pills.
7. `npm test` and `npm run lint` — both must stay green.

## Follow-ups (separate tickets, not this PR)

- Hard-coded `#e11d48`/`#be123c` in `UploadModal.tsx:153,167` and `DownloadModal.tsx:99,113` duplicate
  `--danger`/`--danger-hover`, and `color: #ffffff` is hard-coded on every primary button — both violate
  AGENTS.md §1.3. An `--on-primary` token in `globals.css` would close the second one.
- Five buttons have no hover state at all: `FilterDropdown.tsx` (`TextButton`, `PrimaryButton`,
  `SecondaryButton`), `SortButton.tsx`, `SpreadsheetGrid.tsx` `FilterFunnelButton`.
- White on `--danger` `#f43f5e` is 3.67:1 in dark mode — fails WCAG AA at rest, independent of hover.
- 30+ locally-declared `styled.button`s with no shared `Button` component is the reason this drifted;
  worth a ticket of its own.
