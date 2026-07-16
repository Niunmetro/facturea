import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles.css", "utf-8");

describe("styles.css", () => {
  it("define las variables de color base", () => {
    expect(css).toContain("--color-fondo");
    expect(css).toContain("--color-primario");
    expect(css).toContain("--color-foco");
  });

  it("define estilos de impresion para .factura-print", () => {
    expect(css).toContain("@media print");
    expect(css).toContain(".factura-print");
  });

  it("define la barra total fija con sus botones", () => {
    expect(css).toContain(".barra-total");
  });
});
