// Contador correlativo por año persistido en localStorage.
//
// Sin backend, no hay forma de serializar el incremento entre dos pestañas
// abiertas a la vez: la unicidad del numero entre pestañas es best-effort
// (depende de que el usuario no consuma en ambas a la vez antes de refrescar).
// La sincronizacion entre pestañas mediante el evento 'storage' se gestiona
// en la capa UI (main.ts), no aqui.

function clave(anio: number): string {
  return "facturea:contador:" + anio;
}

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

function leerUltimo(anio: number): number {
  try {
    const raw = localStorage.getItem(clave(anio));
    if (raw === null) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function escribirUltimo(anio: number, valor: number): void {
  try {
    localStorage.setItem(clave(anio), String(valor));
  } catch {
    // degradar sin lanzar: si no hay localStorage disponible, el contador
    // simplemente no persiste entre recargas.
  }
}

export function peekNumero(anio: number): string {
  const ultimo = leerUltimo(anio);
  return `${anio}-${pad3(ultimo + 1)}`;
}

export function consumirNumero(anio: number): string {
  const siguiente = leerUltimo(anio) + 1;
  escribirUltimo(anio, siguiente);
  return `${anio}-${pad3(siguiente)}`;
}
