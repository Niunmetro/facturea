import { describe, it, expect } from "vitest";
import { renderFacturaHTML } from "../src/ui/factura-vista";
import { calcularFactura } from "../src/core/factura";
import { formatearFechaEs } from "../src/core/formato";
import type { FacturaGuardada, LineaFactura } from "../src/core/types";

function facturaConExencionYOperacion(): { factura: FacturaGuardada; lineas: LineaFactura[] } {
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

  const factura: FacturaGuardada = {
    numero: "2026-0002",
    fechaEmision: "2026-01-15",
    fechaVencimiento: "2026-02-15",
    fechaOperacion: "2026-01-10",
    emisor: { nombre: "Emisor Ejemplo SL", nif: "B12345678", direccion: "Calle Emisor 1" },
    cliente: { nombre: "Cliente Ejemplo SL", nif: "A87654321", direccion: "Calle Cliente 2" },
    lineas,
    retencionIrpfPct: 0,
  };

  return { factura, lineas };
}

describe("renderFacturaHTML v2: motivoExencion y fechaOperacion", () => {
  it("incluye el motivo de exencion de una linea exenta", () => {
    const { factura, lineas } = facturaConExencionYOperacion();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toContain("Art. 20 Uno 9º LIVA");
  });

  it("incluye la fecha de operacion formateada en español", () => {
    const { factura, lineas } = facturaConExencionYOperacion();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toContain(formatearFechaEs(factura.fechaOperacion!));
  });
});
