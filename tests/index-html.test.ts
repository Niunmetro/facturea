import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf-8");

describe("index.html", () => {
  it("declara lang es y charset UTF-8", () => {
    expect(html).toContain('lang="es"');
    expect(html).toContain('charset="UTF-8"');
  });

  it("tiene titulo y meta description para SEO", () => {
    expect(html).toMatch(/<title>.*Facturea.*<\/title>/);
    expect(html).toContain('name="description"');
  });

  it("tiene canonical y open graph", () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
  });

  it("tiene las cuatro zonas principales de la app", () => {
    expect(html).toContain('id="zona-formulario"');
    expect(html).toContain('id="zona-vista"');
    expect(html).toContain('id="zona-historial"');
    expect(html).toContain('id="zona-pro"');
  });

  it("carga los estilos y el script principal", () => {
    expect(html).toContain('href="/src/styles.css"');
    expect(html).toContain('src="/src/main.ts"');
  });
});
