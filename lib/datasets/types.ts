export interface DatasetMeta {
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  firstRowAsHeader?: boolean;
  /** ISO date (YYYY-MM-DD) on which data.csv last changed. Bump this whenever you edit the CSV. */
  lastModified: string;
}
