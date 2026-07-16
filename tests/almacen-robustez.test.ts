import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cargarDatos, guardarFactura, listarFacturas, exportarJSON, importarJSON } from "../src/core/almacen";
import type { Cliente, Emisor, FacturaGuardada } from "../src/core/types";

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  get length(): number {
    return this.store.size;
  }
}

let mockStorage: LocalStorageMock;

beforeEach(() => {
  mockStorage = new LocalStorageMock();
  vi.stubGlobal("localStorage", mockStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const emisor: Emisor = { nombre: "Yo Autónomo", nif: "12345678Z", direccion: "Calle Falsa 1" };
const cliente: Cliente = { nombre: "Cliente SL", nif: "B12345678", direccion: "Calle Real 2" };

function facturaConFechaOperacion(numero: string, fechaOperacion?: string): FacturaGuardada {
  return {
    numero,
    fechaEmision: "2026-01-01",
    fechaVencimiento: "2026-01-31",
    fechaOperacion,
    emisor,
    cliente,
    lineas: [{ concepto: "Servicio", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 0 }],
    retencionIrpfPct: 15,
  };
}

describe("almacen: robustez con fechaOperacion", () => {
  it("guardarFactura con fechaOperacion hace roundtrip", () => {
    guardarFactura(facturaConFechaOperacion("F-1", "2025-12-20"), false);
    expect(listarFacturas()[0].fechaOperacion).toBe("2025-12-20");
  });

  it("guardarFactura sin fechaOperacion no la incluye ni rompe nada", () => {
    guardarFactura(facturaConFechaOperacion("F-1"), false);
    expect(listarFacturas()[0].fechaOperacion).toBeUndefined();
  });

  it("exportarJSON/importarJSON conserva fechaOperacion", () => {
    guardarFactura(facturaConFechaOperacion("F-1", "2025-12-20"), false);
    const json = exportarJSON();
    mockStorage.clear();
    importarJSON(json);
    expect(listarFacturas()[0].fechaOperacion).toBe("2025-12-20");
  });

  it("cargarDatos con JSON de un array en vez de objeto no lanza y degrada a vacio", () => {
    mockStorage.setItem("facturea:datos", JSON.stringify([1, 2, 3]));
    expect(() => cargarDatos()).not.toThrow();
    expect(cargarDatos().facturas).toEqual([]);
  });

  it("cargarDatos con facturas no siendo array no lanza y degrada a vacio", () => {
    mockStorage.setItem(
      "facturea:datos",
      JSON.stringify({ version: 1, emisor: null, clientes: [], facturas: "no-array" })
    );
    expect(() => cargarDatos()).not.toThrow();
    expect(cargarDatos().facturas).toEqual([]);
  });
});
