import { describe, it, expect } from "vitest";
import { siguienteNumero } from "../src/core/numeracion";
import type { FacturaGuardada } from "../src/core/types";

function factura(numero: string): FacturaGuardada {
  return {
    numero,
    fechaEmision: "2026-01-01",
    fechaVencimiento: "2026-01-31",
    emisor: { nombre: "Emisor", nif: "00000000T", direccion: "Calle 1" },
    cliente: { nombre: "Cliente", nif: "11111111H", direccion: "Calle 2" },
    lineas: [],
    retencionIrpfPct: 0,
  };
}

describe("siguienteNumero", () => {
  it("sin facturas: empieza en 001 para el año pedido", () => {
    expect(siguienteNumero([], 2026)).toBe("2026-001");
  });

  it("con facturas 2026-001 y 2026-002: el siguiente es 2026-003", () => {
    const facturas = [factura("2026-001"), factura("2026-002")];

    expect(siguienteNumero(facturas, 2026)).toBe("2026-003");
  });

  it("si sólo hay facturas de otro año: reinicia en 001 al cambiar de año", () => {
    const facturas = [factura("2025-001"), factura("2025-002")];

    expect(siguienteNumero(facturas, 2026)).toBe("2026-001");
  });
});
