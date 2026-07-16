import { describe, it, expect } from "vitest";
import { formatearFechaEs } from "../src/core/formato";

describe("formatearFechaEs", () => {
  it("formatea fecha ISO valida a formato español", () => {
    expect(formatearFechaEs("2026-01-15")).toBe("15/01/2026");
  });

  it("formatea otra fecha ISO valida", () => {
    expect(formatearFechaEs("2025-12-31")).toBe("31/12/2025");
  });

  it("devuelve la entrada tal cual si no casa el formato ISO", () => {
    expect(formatearFechaEs("15/01/2026")).toBe("15/01/2026");
  });

  it("devuelve la entrada tal cual para string vacio", () => {
    expect(formatearFechaEs("")).toBe("");
  });

  it("devuelve la entrada tal cual para fecha con hora ISO completa", () => {
    expect(formatearFechaEs("2026-01-15T10:00:00Z")).toBe("2026-01-15T10:00:00Z");
  });
});
