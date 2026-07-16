export type IvaPct = 0|4|10|21;
export type RecargoPct = 0|0.5|1.4|5.2;
export type RetencionIrpfPct = 0|7|15;

export interface LineaFactura {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  ivaPct: IvaPct;
  recargoPct: RecargoPct;
  motivoExencion?: string;
}

export interface DesgloseIva {
  ivaPct: IvaPct;
  base: number;
  cuota: number;
}

export interface ResultadoFactura {
  baseImponible: number;
  desgloseIva: DesgloseIva[];
  totalIva: number;
  totalRecargo: number;
  retencion: number;
  total: number;
}

export interface Emisor {
  nombre: string;
  nif: string;
  direccion: string;
  iban?: string;
}

export interface Cliente {
  nombre: string;
  nif: string;
  direccion: string;
}

export interface FacturaGuardada {
  numero: string;
  fechaEmision: string;
  fechaVencimiento: string;
  emisor: Emisor;
  cliente: Cliente;
  lineas: LineaFactura[];
  retencionIrpfPct: RetencionIrpfPct;
  formaPago?: string;
  fechaOperacion?: string;
}

export interface DatosApp {
  version: number;
  emisor: Emisor | null;
  clientes: Cliente[];
  facturas: FacturaGuardada[];
}
