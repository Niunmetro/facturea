import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validarFormatoLicencia,
  activarLicencia,
  esProActivo,
  desactivarLicencia,
} from "../src/core/licencia";

function crearLocalStorageMock() {
  let almacen: Record<string, string> = {};
  return {
    getItem: vi.fn((clave: string) => (clave in almacen ? almacen[clave] : null)),
    setItem: vi.fn((clave: string, valor: string) => {
      almacen[clave] = String(valor);
    }),
    removeItem: vi.fn((clave: string) => {
      delete almacen[clave];
    }),
    clear: vi.fn(() => {
      almacen = {};
    }),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", crearLocalStorageMock());
  vi.stubGlobal("fetch", vi.fn());
});

describe("validarFormatoLicencia", () => {
  it("acepta una clave con el formato correcto", () => {
    expect(validarFormatoLicencia("FACT-AB12-CD34-EF56")).toBe(true);
  });

  it("rechaza una clave con formato incorrecto", () => {
    expect(validarFormatoLicencia("FACT-abc")).toBe(false);
  });
});

describe("activarLicencia / esProActivo (sin GUMROAD_PRODUCT_ID)", () => {
  it("activa correctamente una clave con formato valido", async () => {
    const resultado = await activarLicencia("FACT-AB12-CD34-EF56");
    expect(resultado).toBe(true);
    expect(esProActivo()).toBe(true);
  });

  it("no activa una clave con formato invalido", async () => {
    const resultado = await activarLicencia("FACT-abc");
    expect(resultado).toBe(false);
    expect(esProActivo()).toBe(false);
  });

  it("desactivarLicencia deja esProActivo en false", async () => {
    await activarLicencia("FACT-AB12-CD34-EF56");
    expect(esProActivo()).toBe(true);

    desactivarLicencia();
    expect(esProActivo()).toBe(false);
  });
});
