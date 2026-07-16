import type { FacturaGuardada } from './types';

export function siguienteNumero(facturas: FacturaGuardada[], anio: number): string {
  const prefijo = `${anio}-`;
  let maxCorrelativo = 0;

  for (const factura of facturas) {
    if (!factura.numero.startsWith(prefijo)) continue;
    const correlativo = parseInt(factura.numero.slice(prefijo.length), 10);
    if (!Number.isNaN(correlativo) && correlativo > maxCorrelativo) {
      maxCorrelativo = correlativo;
    }
  }

  const correlativo = maxCorrelativo + 1;
  return `${anio}-${String(correlativo).padStart(3, '0')}`;
}
