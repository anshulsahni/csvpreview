/**
 * Serialize a structured-data object for embedding in a
 * `<script type="application/ld+json">` tag.
 *
 * `JSON.stringify` escapes quotes and backslashes but leaves `<`, `>` and `&`
 * untouched — it has no idea its output is heading into HTML. To the HTML
 * parser a script body is raw text, so a `</script>` sequence *inside* a JSON
 * string still closes the tag: everything after it stops being data and
 * becomes live markup. That turns any value we don't author by hand — a CSV
 * header row feeding `variableMeasured`, say — into a stored-XSS vector.
 * Emitting the three characters as JSON `\uXXXX` escapes keeps the parsed
 * value byte-identical while making the early close impossible.
 *
 * Escaping `&` also matches Google's August 2026 change to JSON-LD
 * extraction: their parser now applies a single pass of HTML unescaping, so
 * ampersands are safest written as `\u0026` rather than left bare.
 *
 * See `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`, which calls
 * out the same `JSON.stringify` hazard and recommends the `<` escape.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
