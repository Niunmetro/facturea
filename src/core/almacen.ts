import type { Cliente, DatosApp, Emisor, FacturaGuardada, LineaFactura } from './types';

export const LIMITE_FREE = 5;

const STORAGE_KEY = 'facturea:datos';
const VERSION_ACTUAL = 1;

function datosVacios(): DatosApp {
  return { version: VERSION_ACTUAL, emisor: null, clientes: [], facturas: [] };
}

function leerRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function escribirRaw(json: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // localStorage bloqueado o lleno: degradar sin lanzar
  }
}

function esFormaDatosApp(obj: unknown): obj is DatosApp {
  if (typeof obj !== 'object' || obj === null) return false;
  const d = obj as Record<string, unknown>;
  if (typeof d.version !== 'number') return false;
  if (d.emisor !== null && typeof d.emisor !== 'object') return false;
  if (!Array.isArray(d.clientes)) return false;
  if (!Array.isArray(d.facturas)) return false;
  return true;
}

function esObjetoPersona(obj: unknown): obj is { nombre: string; nif: string; direccion: string } {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return typeof p.nombre === 'string' && typeof p.nif === 'string' && typeof p.direccion === 'string';
}

function esFormaCliente(obj: unknown): obj is Cliente {
  return esObjetoPersona(obj);
}

function esFormaLinea(obj: unknown): obj is LineaFactura {
  if (typeof obj !== 'object' || obj === null) return false;
  const l = obj as Record<string, unknown>;
  if (typeof l.concepto !== 'string') return false;
  if (typeof l.cantidad !== 'number' || !Number.isFinite(l.cantidad)) return false;
  if (typeof l.precioUnitario !== 'number' || !Number.isFinite(l.precioUnitario)) return false;
  if (typeof l.ivaPct !== 'number') return false;
  if (typeof l.recargoPct !== 'number') return false;
  return true;
}

function esFormaFactura(obj: unknown): obj is FacturaGuardada {
  if (typeof obj !== 'object' || obj === null) return false;
  const f = obj as Record<string, unknown>;
  if (typeof f.numero !== 'string') return false;
  if (typeof f.fechaEmision !== 'string') return false;
  if (typeof f.fechaVencimiento !== 'string') return false;
  if (!esObjetoPersona(f.emisor)) return false;
  if (!esObjetoPersona(f.cliente)) return false;
  if (!Array.isArray(f.lineas) || !f.lineas.every(esFormaLinea)) return false;
  if (typeof f.retencionIrpfPct !== 'number') return false;
  return true;
}

function sanearDatos(datos: DatosApp): DatosApp {
  return {
    ...datos,
    clientes: datos.clientes.filter(esFormaCliente),
    facturas: datos.facturas.filter(esFormaFactura),
  };
}

export function cargarDatos(): DatosApp {
  const raw = leerRaw();
  if (raw === null) return datosVacios();
  try {
    const parsed = JSON.parse(raw);
    if (!esFormaDatosApp(parsed)) return datosVacios();
    return sanearDatos(parsed);
  } catch {
    return datosVacios();
  }
}

function guardarDatos(datos: DatosApp): void {
  try {
    escribirRaw(JSON.stringify(datos));
  } catch {
    // degradar sin lanzar
  }
}

export function cargarEmisor(): Emisor | null {
  return cargarDatos().emisor;
}

export function guardarEmisor(e: Emisor): void {
  const datos = cargarDatos();
  datos.emisor = e;
  guardarDatos(datos);
}

export function listarClientes(): Cliente[] {
  return cargarDatos().clientes;
}

export function recordarCliente(c: Cliente): void {
  const datos = cargarDatos();
  const resto = datos.clientes.filter((cliente) => cliente.nif !== c.nif);
  datos.clientes = [c, ...resto];
  guardarDatos(datos);
}

export function listarFacturas(): FacturaGuardada[] {
  return cargarDatos().facturas;
}

export function guardarFactura(
  f: FacturaGuardada,
  esPro: boolean
): { ok: boolean; motivo?: string } {
  const datos = cargarDatos();
  const idx = datos.facturas.findIndex((factura) => factura.numero === f.numero);
  const esNueva = idx === -1;

  if (esNueva && !esPro && datos.facturas.length >= LIMITE_FREE) {
    return { ok: false, motivo: 'limite' };
  }

  if (esNueva) {
    datos.facturas.push(f);
  } else {
    datos.facturas[idx] = f;
  }

  guardarDatos(datos);
  return { ok: true };
}

export function borrarFactura(numero: string): void {
  const datos = cargarDatos();
  datos.facturas = datos.facturas.filter((factura) => factura.numero !== numero);
  guardarDatos(datos);
}

export function exportarJSON(): string {
  return JSON.stringify(cargarDatos());
}

export function importarJSON(json: string): { ok: boolean; motivo?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, motivo: 'formato' };
  }

  if (!esFormaDatosApp(parsed)) {
    return { ok: false, motivo: 'formato' };
  }

  guardarDatos(sanearDatos(parsed));
  return { ok: true };
}
