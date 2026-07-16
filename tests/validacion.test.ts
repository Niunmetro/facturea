import { describe, it, expect } from "vitest";
import { validarFacturaParaImprimir } from "../src/core/validacion";
import type { EntradaValidacion } from "../src/core/validacion";

function entradaCompleta(): EntradaValidacion {
  return {
    emisor: { nombre: "Emisor", nif: "12345678Z" },
    cliente: { nombre: "Cliente" },
    fechaEmision: "2026-01-15",
    lineas: [{ concepto: "Servicio", precioUnitario: 100 }],
  };
}

describe("validarFacturaParaImprimir", () => {
  it("entrada completa: ok true y sin faltas", () => {
    const resultado = validarFacturaParaImprimir(entradaCompleta());
    expect(resultado).toEqual({ ok: true, faltas: [] });
  });

  it("sin nombre de emisor: ok false y falta reportada", () => {
    const entrada = entradaCompleta();
    entrada.emisor.nombre = "";
    const resultado = validarFacturaParaImprimir(entrada);
    expect(resultado.ok).toBe(false);
    expect(resultado.faltas.length).toBeGreaterThan(0);
  });

  it("sin lineas: ok false", () => {
    const entrada = entradaCompleta();
    entrada.lineas = [];
    const resultado = validarFacturaParaImprimir(entrada);
    expect(resultado.ok).toBe(false);
  });
});
