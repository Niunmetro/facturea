import { describe, it, expect } from "vitest";

// Test de humo del andamiaje: el run de Forja añade los tests reales.
describe("andamiaje", () => {
  it("vitest funciona", () => {
    expect(2 * 2).toBe(4);
  });
});
