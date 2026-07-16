export interface EntradaValidacion {
  emisor: { nombre: string; nif: string };
  cliente: { nombre: string };
  fechaEmision: string;
  lineas: { concepto: string; precioUnitario: number }[];
}

export interface ResultadoValidacion {
  ok: boolean;
  faltas: string[];
}

export function validarFacturaParaImprimir(e: EntradaValidacion): ResultadoValidacion {
  throw new Error("validacion no implementada " + e.fechaEmision);
}
