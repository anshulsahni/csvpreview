export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Single source of truth for the page's FAQ. Rendered visibly by the `Faq`
 * component and mirrored into the JSON-LD `FAQPage` structured data in
 * `page.tsx`, so keep the two in sync automatically by importing from here.
 */
export const faqItems: FaqItem[] = [
  {
    question: "Is this CSV to Excel converter free?",
    answer:
      "Yes. Converting CSV files to Excel (.xlsx) is completely free, with no signup required.",
  },
  {
    question: "Are my files uploaded to a server?",
    answer:
      "No. The conversion happens entirely in your browser — your CSV files never leave your device.",
  },
  {
    question: "Can I convert multiple CSV files at once?",
    answer:
      "Yes. Upload multiple CSV files and either merge them into a single Excel workbook (one sheet per CSV) or download each as a separate Excel file.",
  },
];
