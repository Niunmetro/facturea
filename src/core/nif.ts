const TABLA_LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE';

const LETRAS_CIF_CONTROL_LETRA = 'KPQSNW'; // organizaciones cuyo control es siempre letra
const LETRAS_CIF_CONTROL_DIGITO = 'ABEH'; // organizaciones cuyo control es siempre dígito
const LETRAS_CIF_CONTROL_TABLA = 'JABCDEFGHI'; // índice -> letra de control cuando corresponde letra

export function normalizarNif(valor: string): string {
  return valor.replace(/\s/g, '').toUpperCase();
}

export function tipoNif(valor: string): 'DNI' | 'NIE' | 'CIF' | null {
  const nif = normalizarNif(valor);

  if (/^\d{8}[A-Z]$/.test(nif)) {
    return 'DNI';
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(nif)) {
    return 'NIE';
  }

  if (/^[A-HJ-NP-SUVW]\d{7}[0-9A-J]$/.test(nif)) {
    return 'CIF';
  }

  return null;
}

function validarDni(nif: string): boolean {
  const numero = parseInt(nif.substring(0, 8), 10);
  const letra = nif.charAt(8);
  return TABLA_LETRAS[numero % 23] === letra;
}

function validarNie(nif: string): boolean {
  const prefijos: Record<string, string> = { X: '0', Y: '1', Z: '2' };
  const numeroStr = prefijos[nif.charAt(0)] + nif.substring(1, 8);
  const numero = parseInt(numeroStr, 10);
  const letra = nif.charAt(8);
  return TABLA_LETRAS[numero % 23] === letra;
}

function validarCif(nif: string): boolean {
  const letraOrg = nif.charAt(0);
  const digitos = nif.substring(1, 8);
  const control = nif.charAt(8);

  let sumaPar = 0;
  let sumaImpar = 0;

  for (let i = 0; i < digitos.length; i++) {
    const digito = parseInt(digitos[i], 10);
    // Posiciones 1,3,5,7 (índice 0,2,4,6) son impares -> se multiplican por 2
    if (i % 2 === 0) {
      const doble = digito * 2;
      sumaImpar += doble >= 10 ? Math.floor(doble / 10) + (doble % 10) : doble;
    } else {
      sumaPar += digito;
    }
  }

  const sumaTotal = sumaPar + sumaImpar;
  const unidad = sumaTotal % 10;
  const digitoControl = unidad === 0 ? 0 : 10 - unidad;
  const letraControl = LETRAS_CIF_CONTROL_TABLA[digitoControl];

  if (LETRAS_CIF_CONTROL_LETRA.includes(letraOrg)) {
    return control === letraControl;
  }

  if (LETRAS_CIF_CONTROL_DIGITO.includes(letraOrg)) {
    return control === String(digitoControl);
  }

  // El resto de organizaciones aceptan tanto dígito como letra
  return control === String(digitoControl) || control === letraControl;
}

export function validarNif(valor: string): boolean {
  const nif = normalizarNif(valor);
  const tipo = tipoNif(nif);

  if (tipo === 'DNI') {
    return validarDni(nif);
  }

  if (tipo === 'NIE') {
    return validarNie(nif);
  }

  if (tipo === 'CIF') {
    return validarCif(nif);
  }

  return false;
}
