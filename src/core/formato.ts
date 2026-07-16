export function parseDecimalEs(valor: string): number {
  // Quitar espacios
  const trimmed = valor.trim();

  // Si está vacío o no es válido, devolver 0
  if (!trimmed) {
    return 0;
  }

  // Manejar formato español: punto para miles, coma para decimal
  let normalized: string;
  const lastComma = trimmed.lastIndexOf(',');

  if (lastComma !== -1) {
    // Hay coma, es separador decimal
    const beforeComma = trimmed.substring(0, lastComma).replace(/\./g, '');
    const afterComma = trimmed.substring(lastComma + 1);
    normalized = beforeComma + '.' + afterComma;
  } else {
    // No hay coma, puede haber puntos como separadores de miles o como decimal
    // Si el último punto va seguido de 1-2 dígitos y es el final, es decimal
    const lastDot = trimmed.lastIndexOf('.');
    if (lastDot !== -1) {
      const afterDot = trimmed.substring(lastDot + 1);
      if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
        // Probablemente es decimal
        const beforeDot = trimmed.substring(0, lastDot).replace(/\./g, '');
        normalized = beforeDot + '.' + afterDot;
      } else {
        // Eliminar todos los puntos (son separadores de miles)
        normalized = trimmed.replace(/\./g, '');
      }
    } else {
      normalized = trimmed;
    }
  }

  const parsed = parseFloat(normalized);

  // Si el resultado es NaN, devolver 0
  return isNaN(parsed) ? 0 : parsed;
}

export function formatearNumero(n: number, decimales: number = 2): string {
  // Redondear half-up (Math.round hace banker's rounding, necesitamos half-up)
  const factor = Math.pow(10, decimales);
  const rounded = Math.round(n * factor + Number.EPSILON) / factor;

  // Convertir a string con decimales fijados
  const fixed = rounded.toFixed(decimales);
  const parts = fixed.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Agregar separador de miles
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Devolver con coma decimal (solo si hay decimales)
  if (decimales > 0) {
    return `${withThousands},${decimalPart}`;
  } else {
    return withThousands;
  }
}

export function formatearEuros(n: number): string {
  return formatearNumero(n, 2);
}
