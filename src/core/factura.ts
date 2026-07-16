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

  const desgloseIva: DesgloseIva[] = ivaPcts.map((ivaPct) => {
    const baseRaw = basesPorIva.get(ivaPct)!;
    const cuotaRaw = (baseRaw * ivaPct) / 100;
    return {
      ivaPct,
      base: round2(baseRaw),
      cuota: round2(cuotaRaw),
    };
  });

  const totalIva = round2(desgloseIva.reduce((acc, d) => acc + d.cuota, 0));

  let totalRecargoRaw = 0;
  for (const linea of lineas) {
    const importeLinea = linea.cantidad * linea.precioUnitario;
    totalRecargoRaw += (importeLinea * linea.recargoPct) / 100;
  }

  const baseImponible = round2(baseImponibleRaw);
  const totalRecargo = round2(totalRecargoRaw);
  const retencionRaw = (baseImponibleRaw * retencionIrpfPct) / 100;
  const retencion = round2(retencionRaw);
  const total = round2(baseImponible + totalIva + totalRecargo - retencion);

  return {
    baseImponible,
    desgloseIva,
    totalIva,
    totalRecargo,
    retencion,
    total,
  };
}
