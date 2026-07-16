import type { LineaFactura, ResultadoFactura, RetencionIrpfPct, IvaPct, DesgloseIva } from './types';

function round2(n: number): number {
  const factor = 100;
  const eps = 1e-9;
  return Math.round(n * factor + (n >= 0 ? eps : -eps)) / factor;
}

export function calcularFactura(
  lineas: LineaFactura[],
  retencionIrpfPct: RetencionIrpfPct
): ResultadoFactura {
  let baseImponibleRaw = 0;
  const basesPorIva = new Map<IvaPct, number>();

  for (const linea of lineas) {
    const importeLinea = linea.cantidad * linea.precioUnitario;
    baseImponibleRaw += importeLinea;
    basesPorIva.set(linea.ivaPct, (basesPorIva.get(linea.ivaPct) ?? 0) + importeLinea);
  }

  const ivaPcts = Array.from(basesPorIva.keys()).sort((a, b) => a - b);

  let totalIvaRaw = 0;
  const desgloseIva: DesgloseIva[] = ivaPcts.map((ivaPct) => {
    const baseRaw = basesPorIva.get(ivaPct)!;
    const cuotaRaw = (baseRaw * ivaPct) / 100;
    totalIvaRaw += cuotaRaw;
    return {
      ivaPct,
      base: round2(baseRaw),
      cuota: round2(cuotaRaw),
    };
  });

  let totalRecargoRaw = 0;
  for (const linea of lineas) {
    const importeLinea = linea.cantidad * linea.precioUnitario;
    totalRecargoRaw += (importeLinea * linea.recargoPct) / 100;
  }

  const retencionRaw = (baseImponibleRaw * retencionIrpfPct) / 100;
  const totalRaw = baseImponibleRaw + totalIvaRaw + totalRecargoRaw - retencionRaw;

  return {
    baseImponible: round2(baseImponibleRaw),
    desgloseIva,
    totalIva: round2(totalIvaRaw),
    totalRecargo: round2(totalRecargoRaw),
    retencion: round2(retencionRaw),
    total: round2(totalRaw),
  };
}
