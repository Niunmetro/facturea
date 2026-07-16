import { describe, it, expect } from "vitest";
import { renderFacturaHTML } from "../src/ui/factura-vista";
import { calcularFactura } from "../src/core/factura";
import { formatearEuros as formatearEurosLocal } from "../src/core/formato";
import type { FacturaGuardada, LineaFactura } from "../src/core/types";

function facturaCanonica(): { factura: FacturaGuardada; lineas: LineaFactura[] } {
  const lineas: LineaFactura[] = [
    { concepto: "A", cantidad: 10, precioUnitario: 50, ivaPct: 21, recargoPct: 0 },
    { concepto: "B", cantidad: 1, precioUnitario: 200, ivaPct: 21, recargoPct: 0 },
  ];

  const factura: FacturaGuardada = {
    numero: "2026-0001",
    fechaEmision: "2026-01-15",
    fechaVencimiento: "2026-02-15",
    emisor: {
      nombre: "Emisor Ejemplo SL",
      nif: "B12345678",
      direccion: "Calle Emisor 1",
    },
    cliente: {
      nombre: "Cliente Ejemplo SL",
      nif: "A87654321",
      direccion: "Calle Cliente 2",
    },
    lineas,
    retencionIrpfPct: 15,
  };

  return { factura, lineas };
}

describe("renderFacturaHTML", () => {
  it("caso canónico: incluye total, numero, NIFs y una fila por tipo de IVA", () => {
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toContain("742,00");
    expect(html).toContain(factura.numero);
    expect(html).toContain(factura.emisor.nif);
    expect(html).toContain(factura.cliente.nif);

    for (const d of resultado.desgloseIva) {
      expect(html).toContain(`${d.ivaPct}%`);
    }
  });

  it("la raiz del HTML tiene la clase factura-print", () => {
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toMatch(/<article[^>]*class="[^"]*factura-print[^"]*"/);
  });

  it("con esPro:false incluye la marca 'Hecho con Facturea'", () => {
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toContain("Hecho con Facturea");
  });

  it("con esPro:true NO incluye la marca 'Hecho con Facturea'", () => {
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: true });

    expect(html).not.toContain("Hecho con Facturea");
  });

  it("no toca el DOM: es una función pura ejecutable en Node", () => {
    expect(typeof document).toBe("undefined");
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);
    expect(() => renderFacturaHTML(factura, resultado, { esPro: false })).not.toThrow();
  });

  it("incluye retencion cuando es mayor que 0", () => {
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toContain(formatearEurosLocal(resultado.retencion));
  });

  it("incluye totalRecargo cuando lo hay", () => {
    const lineasConRecargo: LineaFactura[] = [
      { concepto: "Recargo", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 5.2 },
    ];
    const factura: FacturaGuardada = {
      ...facturaCanonica().factura,
      lineas: lineasConRecargo,
      retencionIrpfPct: 0,
    };
    const resultado = calcularFactura(lineasConRecargo, 0);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(resultado.totalRecargo).toBeGreaterThan(0);
    expect(html).toContain(formatearEurosLocal(resultado.totalRecargo));
  });

  it("incluye el IBAN cuando el emisor lo tiene", () => {
    const base = facturaCanonica();
    const factura: FacturaGuardada = {
      ...base.factura,
      emisor: { ...base.factura.emisor, iban: "ES1234567890123456789012" },
    };
    const resultado = calcularFactura(base.lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, { esPro: false });

    expect(html).toContain("ES1234567890123456789012");
  });

  it("aplica colorAcento y logoDataUrl cuando vienen en opts", () => {
    const { factura, lineas } = facturaCanonica();
    const resultado = calcularFactura(lineas, factura.retencionIrpfPct);

    const html = renderFacturaHTML(factura, resultado, {
      esPro: true,
      colorAcento: "#ff00ff",
      logoDataUrl: "data:image/png;base64,ABC123",
    });

    expect(html).toContain("#ff00ff");
    expect(html).toContain("data:image/png;base64,ABC123");
  });
});
