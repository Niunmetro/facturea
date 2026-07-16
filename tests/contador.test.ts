import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { peekNumero, consumirNumero } from "../src/core/contador";

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

describe("contador", () => {
  it("peekNumero sin contador previo devuelve el primero del año sin consumir", () => {
    expect(peekNumero(2026)).toBe("2026-001");
    expect(peekNumero(2026)).toBe("2026-001");
  });

  it("consumirNumero incrementa y devuelve el numero consumido", () => {
    expect(consumirNumero(2026)).toBe("2026-001");
    expect(consumirNumero(2026)).toBe("2026-002");
  });

  it("tras consumirNumero, peekNumero devuelve el siguiente", () => {
    consumirNumero(2026);
    expect(peekNumero(2026)).toBe("2026-002");
  });

  it("contadores independientes por año", () => {
    consumirNumero(2026);
    consumirNumero(2026);
    expect(peekNumero(2025)).toBe("2025-001");
    expect(peekNumero(2026)).toBe("2026-003");
  });
});
