import { describe, it, expect } from "vitest";
import {
  parseDecimalEs,
  formatearEuros,
  formatearNumero,
} from "../src/core/formato";

describe("parseDecimalEs", () => {
  it("parsea numero con coma decimal espanola", () => {
    expect(parseDecimalEs("1,5")).toBe(1.5);
  });

  it("parsea numero entero", () => {
    expect(parseDecimalEs("50")).toBe(50);
  });

  it("devuelve 0 para string vacio", () => {
    expect(parseDecimalEs("")).toBe(0);
  });

  it("parsea numero con espacios y separador de miles con punto", () => {
    expect(parseDecimalEs(" 1.234,50 ")).toBe(1234.5);
  });

  it("acepta punto como separador decimal", () => {
    expect(parseDecimalEs("1.5")).toBe(1.5);
  });

  it("devuelve 0 para valor invalido", () => {
    expect(parseDecimalEs("abc")).toBe(0);
  });

  it("maneja espacios al inicio y final", () => {
    expect(parseDecimalEs("  42  ")).toBe(42);
  });
});

describe("formatearEuros", () => {
  it("formatea numero entero con dos decimales", () => {
    expect(formatearEuros(742)).toBe("742,00");
  });

  it("formatea numero con decimal usando coma y separador de miles con punto", () => {
    expect(formatearEuros(1234.5)).toBe("1.234,50");
  });

  it("formatea numeros menores a 1000 sin separador de miles", () => {
    expect(formatearEuros(99.99)).toBe("99,99");
  });

  it("formatea numeros mayores a 1000 con separador de miles", () => {
    expect(formatearEuros(10000)).toBe("10.000,00");
  });

  it("redondea correctamente a 2 decimales", () => {
    expect(formatearEuros(1.555)).toBe("1,56");
  });

  it("maneja numeros negativos", () => {
    expect(formatearEuros(-1234.5)).toBe("-1.234,50");
  });

  it("maneja cero", () => {
    expect(formatearEuros(0)).toBe("0,00");
  });
});

describe("formatearNumero", () => {
  it("formatea con decimales personalizados", () => {
    expect(formatearNumero(1234.567, 1)).toBe("1.234,6");
  });

  it("usa 2 decimales por defecto", () => {
    expect(formatearNumero(42)).toBe("42,00");
  });

  it("formatea con 0 decimales", () => {
    expect(formatearNumero(1234.4, 0)).toBe("1.234");
  });

  it("formatea con 3 decimales", () => {
    expect(formatearNumero(1234.5678, 3)).toBe("1.234,568");
  });
});
