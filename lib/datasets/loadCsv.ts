import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function loadDatasetCsv(slug: string): Promise<string> {
  return readFile(
    join(process.cwd(), "lib", "datasets", slug, "data.csv"),
    "utf-8",
  );
}
