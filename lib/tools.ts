/**
 * Registry of the free tools under `/tools`. Single source of truth for the
 * hub page cards, the tool breadcrumbs and the sitemap, so a new tool only has
 * to be appended here to appear everywhere.
 *
 * Deliberately dependency-free — page-level copy (`metadata`, `keywords`, FAQ
 * items) stays in each tool's own `page.tsx`.
 */
export interface ToolMeta {
  /** URL segment under `/tools`. */
  slug: string;
  /** Card title and breadcrumb leaf, e.g. "CSV to Excel". */
  name: string;
  /** Name used in JSON-LD, e.g. "CSV to Excel Converter". */
  applicationName: string;
  /** Monospace eyebrow on the card, e.g. "csv → excel". */
  transform: string;
  /** One-sentence card blurb. */
  tagline: string;
  /** Two or three short chips listed on the card. */
  highlights: string[];
}

/** Declaration order is the display order on the hub page. */
export const tools: ToolMeta[] = [
  {
    slug: "csv-to-excel",
    name: "CSV to Excel",
    applicationName: "CSV to Excel Converter",
    transform: "csv → excel",
    tagline:
      "Turn one or many CSV files into an Excel workbook — merge them into a single .xlsx or download each one separately.",
    highlights: ["xlsx output", "merge files", "no upload"],
  },
  {
    slug: "excel-to-csv",
    name: "Excel to CSV",
    applicationName: "Excel to CSV Converter",
    transform: "excel → csv",
    tagline:
      "Split an Excel workbook into clean CSV files — every worksheet becomes its own CSV, ready to rename, download or copy.",
    highlights: ["every sheet", "zip download", "no upload"],
  },
];

const toolBySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return toolBySlug.get(slug);
}

/**
 * Like `getToolBySlug`, but for callers that know the tool exists — a tool page
 * asking for its own slug. Throws at build time if the registry falls out of
 * sync with the routes instead of silently rendering an empty label.
 */
export function requireTool(slug: string): ToolMeta {
  const tool = toolBySlug.get(slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

export function getToolPath(slug: string): string {
  return `/tools/${slug}`;
}

/** Every tool except the given one — for cross-links between tool pages. */
export function getOtherTools(slug: string): ToolMeta[] {
  return tools.filter((tool) => tool.slug !== slug);
}
