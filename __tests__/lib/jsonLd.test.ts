import { serializeJsonLd } from "@/lib/jsonLd";

describe("serializeJsonLd", () => {
  it("matches JSON.stringify when nothing needs escaping", () => {
    const data = { "@type": "Dataset", name: "World Rivers" };

    expect(serializeJsonLd(data)).toBe(JSON.stringify(data));
  });

  it("escapes <, > and & as JSON unicode escapes", () => {
    const output = serializeJsonLd({ name: "a<b>c&d" });

    expect(output).toBe('{"name":"a\\u003cb\\u003ec\\u0026d"}');
  });

  it("never emits a literal closing script tag", () => {
    const output = serializeJsonLd({
      variableMeasured: ["Rank", "Country</script><script>alert(1)</script>"],
    });

    expect(output).not.toContain("</script");
    expect(output).not.toContain("<script");
  });

  it("round-trips to the original value", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Airline IATA & ICAO Codes (CSV)",
      variableMeasured: ["Hub(s)", "a<b", "c>d", "</script>"],
      isAccessibleForFree: true,
      nested: { count: 3, tags: ["x&y"] },
    };

    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("leaves ampersands that already look like HTML entities alone", () => {
    // Google applies a single pass of HTML unescaping to JSON-LD, so `&amp;`
    // left bare would be read back as `&`. Escaping the ampersand keeps the
    // literal text intact.
    const output = serializeJsonLd({ name: "R&amp;D" });

    expect(output).toBe('{"name":"R\\u0026amp;D"}');
    expect(JSON.parse(output).name).toBe("R&amp;D");
  });
});
