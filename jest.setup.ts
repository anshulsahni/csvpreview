import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom does not expose the TextEncoder/TextDecoder globals that browsers have,
// so code under test that encodes or decodes UTF-8 (the xlsx importer and the
// zip builder) would otherwise fail with a ReferenceError.
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

// jsdom's Blob/File predate `Blob.prototype.arrayBuffer` and `Blob.prototype.text`.
// FileReader is implemented, so route the modern APIs through it.
if (
  typeof Blob !== "undefined" &&
  typeof Blob.prototype.arrayBuffer !== "function"
) {
  Blob.prototype.arrayBuffer = function arrayBuffer(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
if (typeof Blob !== "undefined" && typeof Blob.prototype.text !== "function") {
  Blob.prototype.text = function text(): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
