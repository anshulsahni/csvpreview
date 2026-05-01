import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

export async function loadDatasetCsv(slug: string): Promise<string> {
  const baseDir = resolve(process.cwd(), "lib", "datasets");
  const filePath = resolve(baseDir, slug, "data.csv");
  if (!filePath.startsWith(`${baseDir}${sep}`)) {
    throw new Error("Invalid dataset slug");
  }
  return readFile(filePath, "utf-8");
}
