import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  LIMITE_FREE,
  cargarDatos,
  cargarEmisor,
  guardarEmisor,
  listarClientes,
  recordarCliente,
  listarFacturas,
  guardarFactura,
  borrarFactura,
  exportarJSON,
  importarJSON,
} from "../src/core/almacen";
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

function crearFactura(numero: string): FacturaGuardada {
  return {
    numero,
    fechaEmision: "2026-01-01",
    fechaVencimiento: "2026-01-31",
    emisor,
    cliente,
    lineas: [{ concepto: "Servicio", cantidad: 1, precioUnitario: 100, ivaPct: 21, recargoPct: 0 }],
    retencionIrpfPct: 15,
  };
}

describe("almacen", () => {
  it("cargarDatos devuelve estructura vacía cuando no hay nada guardado", () => {
    const datos = cargarDatos();
    expect(datos.emisor).toBeNull();
    expect(datos.clientes).toEqual([]);
    expect(datos.facturas).toEqual([]);
    expect(typeof datos.version).toBe("number");
  });

  it("guardarEmisor y cargarEmisor hacen roundtrip", () => {
    expect(cargarEmisor()).toBeNull();
    guardarEmisor(emisor);
    expect(cargarEmisor()).toEqual(emisor);
  });

  it("recordarCliente añade y listarClientes lo devuelve", () => {
    recordarCliente(cliente);
    expect(listarClientes()).toEqual([cliente]);
  });

  it("recordarCliente con mismo nif actualiza en vez de duplicar", () => {
    recordarCliente(cliente);
    const actualizado: Cliente = { ...cliente, direccion: "Nueva dirección" };
    recordarCliente(actualizado);
    expect(listarClientes()).toEqual([actualizado]);
  });

  it("guardar 5 facturas en free y la 6ª nueva -> { ok:false, motivo:'limite' }", () => {
    for (let i = 1; i <= LIMITE_FREE; i++) {
      const resultado = guardarFactura(crearFactura(`F-${i}`), false);
      expect(resultado).toEqual({ ok: true });
    }
    expect(listarFacturas()).toHaveLength(LIMITE_FREE);

    const resultado = guardarFactura(crearFactura("F-6"), false);
    expect(resultado).toEqual({ ok: false, motivo: "limite" });
    expect(listarFacturas()).toHaveLength(LIMITE_FREE);
  });

  it("la misma 6ª con esPro true -> { ok:true }", () => {
    for (let i = 1; i <= LIMITE_FREE; i++) {
      guardarFactura(crearFactura(`F-${i}`), false);
    }

    const resultado = guardarFactura(crearFactura("F-6"), true);
    expect(resultado).toEqual({ ok: true });
    expect(listarFacturas()).toHaveLength(LIMITE_FREE + 1);
  });

  it("actualizar por numero existente cuenta como sobrescritura y no aplica límite", () => {
    for (let i = 1; i <= LIMITE_FREE; i++) {
      guardarFactura(crearFactura(`F-${i}`), false);
    }

    const actualizada: FacturaGuardada = { ...crearFactura("F-1"), formaPago: "Transferencia" };
    const resultado = guardarFactura(actualizada, false);

    expect(resultado).toEqual({ ok: true });
    expect(listarFacturas()).toHaveLength(LIMITE_FREE);
    expect(listarFacturas().find((f) => f.numero === "F-1")?.formaPago).toBe("Transferencia");
  });

  it("borrarFactura elimina por numero", () => {
    guardarFactura(crearFactura("F-1"), false);
    guardarFactura(crearFactura("F-2"), false);
    borrarFactura("F-1");
    expect(listarFacturas().map((f) => f.numero)).toEqual(["F-2"]);
  });

  it("importarJSON('no-json') -> { ok:false }", () => {
    const resultado = importarJSON("no-json");
    expect(resultado.ok).toBe(false);
  });

  it("importarJSON rechaza un objeto con forma inválida", () => {
    const resultado = importarJSON(JSON.stringify({ foo: "bar" }));
    expect(resultado).toEqual({ ok: false, motivo: "formato" });
  });

  it("roundtrip exportarJSON/importarJSON conserva las facturas", () => {
    guardarFactura(crearFactura("F-1"), false);
    guardarFactura(crearFactura("F-2"), false);
    recordarCliente(cliente);
    guardarEmisor(emisor);

    const json = exportarJSON();

    mockStorage.clear();
    expect(listarFacturas()).toEqual([]);

    const resultado = importarJSON(json);
    expect(resultado).toEqual({ ok: true });
    expect(listarFacturas().map((f) => f.numero)).toEqual(["F-1", "F-2"]);
    expect(listarClientes()).toEqual([cliente]);
    expect(cargarEmisor()).toEqual(emisor);
  });

  it("con localStorage lanzando, ninguna función lanza excepción", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("lleno");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
      clear: () => {
        throw new Error("bloqueado");
      },
      key: () => {
        throw new Error("bloqueado");
      },
      length: 0,
    });

    expect(() => cargarDatos()).not.toThrow();
    expect(() => cargarEmisor()).not.toThrow();
    expect(() => guardarEmisor(emisor)).not.toThrow();
    expect(() => listarClientes()).not.toThrow();
    expect(() => recordarCliente(cliente)).not.toThrow();
    expect(() => listarFacturas()).not.toThrow();
    expect(() => guardarFactura(crearFactura("F-1"), false)).not.toThrow();
    expect(() => borrarFactura("F-1")).not.toThrow();
    expect(() => exportarJSON()).not.toThrow();
    expect(() => importarJSON("{}")).not.toThrow();
  });
});
