import { describe, it, expect } from "vitest";
import { calcularFactura } from "../src/core/factura";
import type { LineaFactura } from "../src/core/types";

describe("calcularFactura", () => {
  it("caso canónico: 10x50 al 21% + 1x200 al 21%, IRPF 15%", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 10, precioUnitario: 50, ivaPct: 21, recargoPct: 0 },
      { concepto: "B", cantidad: 1, precioUnitario: 200, ivaPct: 21, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 15);

    expect(resultado.baseImponible).toBe(700);
    expect(resultado.totalIva).toBe(147);
    expect(resultado.retencion).toBe(105);
    expect(resultado.total).toBe(742);
    expect(resultado.desgloseIva).toEqual([{ ivaPct: 21, base: 700, cuota: 147 }]);
  });

  it("lista vacía: todos los agregados a 0 y desgloseIva vacío", () => {
    const resultado = calcularFactura([], 0);

    expect(resultado.baseImponible).toBe(0);
    expect(resultado.desgloseIva).toEqual([]);
    expect(resultado.totalIva).toBe(0);
    expect(resultado.totalRecargo).toBe(0);
    expect(resultado.retencion).toBe(0);
    expect(resultado.total).toBe(0);
  });

  it("ivaPct 0 (exenta) produce cuota 0", () => {
    const lineas: LineaFactura[] = [
      { concepto: "Exenta", cantidad: 2, precioUnitario: 100, ivaPct: 0, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.desgloseIva).toEqual([{ ivaPct: 0, base: 200, cuota: 0 }]);
    expect(resultado.totalIva).toBe(0);
  });

  it("retencionIrpfPct 0 -> retencion 0", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.retencion).toBe(0);
  });

  it("recargoPct 5.2 aporta a totalRecargo", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 5.2 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.totalRecargo).toBe(5.2);
  });

  it("cantidad 1.5 se admite", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 1.5, precioUnitario: 10, ivaPct: 0, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.baseImponible).toBe(15);
  });

  it("precioUnitario 0 -> importe 0", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 10, precioUnitario: 0, ivaPct: 21, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.baseImponible).toBe(0);
    expect(resultado.desgloseIva).toEqual([{ ivaPct: 21, base: 0, cuota: 0 }]);
  });

  it("desgloseIva incluye solo los ivaPct efectivamente usados, ordenados ascendente", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 0 },
      { concepto: "B", cantidad: 1, precioUnitario: 100, ivaPct: 4, recargoPct: 0 },
      { concepto: "C", cantidad: 1, precioUnitario: 100, ivaPct: 10, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.desgloseIva).toEqual([
      { ivaPct: 4, base: 100, cuota: 4 },
      { ivaPct: 10, base: 100, cuota: 10 },
      { ivaPct: 21, base: 100, cuota: 21 },
    ]);
  });

  it("redondeo half-up en el .5 exacto de un agregado", () => {
    const lineas: LineaFactura[] = [
      { concepto: "A", cantidad: 1, precioUnitario: 1.005, ivaPct: 0, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.baseImponible).toBe(1.01);
  });
});
