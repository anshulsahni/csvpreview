export interface DatasetMeta {
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  firstRowAsHeader?: boolean;
  /** ISO date (YYYY-MM-DD) on which data.csv last changed. Bump this whenever you edit the CSV. */
  lastModified: string;
  /**
   * URL of the license this dataset is published under. Set it only when the
   * upstream source requires a specific license; otherwise the site-wide
   * `DATASET_LICENSE_URL` applies.
   */
  license?: string;
}
