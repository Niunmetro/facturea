import { validarNif } from "./nif";

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
  const faltas: string[] = [];

  if (e.emisor.nombre.trim() === "") {
    faltas.push("Falta el nombre del emisor");
  }

  if (!validarNif(e.emisor.nif)) {
    faltas.push("El NIF del emisor no es valido");
  }

  if (e.cliente.nombre.trim() === "") {
    faltas.push("Falta el nombre del cliente");
  }

  if (e.fechaEmision.trim() === "") {
    faltas.push("Falta la fecha de emision");
  }

  const tieneLineaValida = e.lineas.some(
    (linea) => linea.concepto.trim() !== "" && linea.precioUnitario > 0
  );
  if (!tieneLineaValida) {
    faltas.push("Anade al menos una linea con concepto y precio");
  }

  return { ok: faltas.length === 0, faltas };
}
