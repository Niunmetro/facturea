import { describe, it, expect } from "vitest";
import { validarNif, normalizarNif, tipoNif } from "../src/core/nif";

describe("validarNif", () => {
  it("valida un DNI correcto", () => {
    expect(validarNif("12345678Z")).toBe(true);
  });

  it("valida un NIE correcto", () => {
    expect(validarNif("X1234567L")).toBe(true);
  });

  it("rechaza un DNI con letra de control incorrecta", () => {
    expect(validarNif("12345678A")).toBe(false);
  });

  it("normaliza minusculas y espacios antes de validar", () => {
    expect(validarNif("  12345678z ")).toBe(true);
  });

  it("rechaza una cadena vacia", () => {
    expect(validarNif("")).toBe(false);
  });

  it("valida un CIF correcto conocido", () => {
    expect(validarNif("A58818501")).toBe(true);
  });

  it("rechaza un CIF con digito de control incorrecto", () => {
    expect(validarNif("A58818500")).toBe(false);
  });
});

describe("normalizarNif", () => {
  it("quita espacios y pasa a mayusculas", () => {
    expect(normalizarNif("  12345678z ")).toBe("12345678Z");
  });
});

describe("tipoNif", () => {
  it("identifica un DNI", () => {
    expect(tipoNif("12345678Z")).toBe("DNI");
  });

  it("identifica un NIE", () => {
    expect(tipoNif("X1234567L")).toBe("NIE");
  });

  it("identifica un CIF", () => {
    expect(tipoNif("A58818501")).toBe("CIF");
  });

  it("devuelve null para un valor no reconocido", () => {
    expect(tipoNif("")).toBe(null);
  });
});
