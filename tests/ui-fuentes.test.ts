import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf-8");
const html = readFileSync("index.html", "utf-8");

describe("fuentes de la UI", () => {
  it("usa una pila de fuentes del sistema, sin depender de fuentes externas", () => {
    expect(css).toContain("system-ui");
  });

  it("no carga fuentes externas via @import ni <link> a servicios como Google Fonts", () => {
    expect(css).not.toMatch(/@import/i);
    expect(html).not.toMatch(/fonts\.googleapis\.com/i);
    expect(html).not.toMatch(/fonts\.gstatic\.com/i);
  });
});
