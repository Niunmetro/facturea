import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { PRECIO_PRO } from "../src/config";

describe("config", () => {
  it("PRECIO_PRO tiene el valor esperado", () => {
    expect(PRECIO_PRO).toBe("29 €/año");
  });
});

describe("vite.config.ts", () => {
  it("define base '/facturea/'", () => {
    const contenido = readFileSync("vite.config.ts", "utf-8");
    expect(contenido).toMatch(/base:\s*["']\/facturea\/["']/);
  });
});
