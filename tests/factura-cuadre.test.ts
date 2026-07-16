import { describe, it, expect } from "vitest";
import { calcularFactura } from "../src/core/factura";
import type { LineaFactura } from "../src/core/types";

describe("calcularFactura: cuadre con lineas exentas y motivoExencion", () => {
  it("una linea exenta con motivoExencion cuadra igual que sin motivo", () => {
    const lineas: LineaFactura[] = [
      {
        concepto: "Servicio exento",
        cantidad: 1,
        precioUnitario: 500,
        ivaPct: 0,
        recargoPct: 0,
        motivoExencion: "Art. 20 Uno 9º LIVA",
      },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.baseImponible).toBe(500);
    expect(resultado.totalIva).toBe(0);
    expect(resultado.total).toBe(500);
    expect(resultado.desgloseIva).toEqual([{ ivaPct: 0, base: 500, cuota: 0 }]);
  });

  it("mezcla de lineas con y sin motivoExencion cuadra el total", () => {
    const lineas: LineaFactura[] = [
      { concepto: "Gravada", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 0 },
      {
        concepto: "Exenta",
        cantidad: 1,
        precioUnitario: 50,
        ivaPct: 0,
        recargoPct: 0,
        motivoExencion: "Art. 20 Uno 9º LIVA",
      },
    ];

    const resultado = calcularFactura(lineas, 15);

    expect(resultado.baseImponible).toBe(150);
    expect(resultado.totalIva).toBe(21);
    expect(resultado.retencion).toBe(22.5);
    expect(resultado.total).toBe(148.5);
  });

  it("motivoExencion ausente en una linea gravada no afecta el calculo", () => {
    const lineas: LineaFactura[] = [
      { concepto: "Gravada", cantidad: 2, precioUnitario: 25, ivaPct: 4, recargoPct: 0 },
    ];

    const resultado = calcularFactura(lineas, 0);

    expect(resultado.baseImponible).toBe(50);
    expect(resultado.totalIva).toBe(2);
  });
});
