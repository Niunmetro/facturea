import { GUMROAD_PRODUCT_ID } from '../config';

const REGEX_LICENCIA = /^FACT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const CLAVE_STORAGE = 'facturea_licencia_pro';
const ESTADO_STORAGE = 'facturea_licencia_estado';

type EstadoLicencia = 'activa' | 'pendiente';

export function validarFormatoLicencia(clave: string): boolean {
  return REGEX_LICENCIA.test(clave);
}

function guardarLicencia(clave: string, estado: EstadoLicencia): void {
  try {
    localStorage.setItem(CLAVE_STORAGE, clave);
    localStorage.setItem(ESTADO_STORAGE, estado);
  } catch {
    // almacenamiento no disponible: no se persiste, pero no se rompe el flujo
  }
}

async function verificarConGumroad(clave: string): Promise<'aceptada' | 'rechazada' | 'sin_red'> {
  try {
    const respuesta = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: clave,
      }).toString(),
    });
    const datos = await respuesta.json();
    return datos && datos.success === true ? 'aceptada' : 'rechazada';
  } catch {
    return 'sin_red';
  }
}

export async function activarLicencia(clave: string): Promise<boolean> {
  if (!validarFormatoLicencia(clave)) {
    return false;
  }

  if (GUMROAD_PRODUCT_ID === '') {
    guardarLicencia(clave, 'activa');
    return true;
  }

  const resultado = await verificarConGumroad(clave);

  if (resultado === 'aceptada') {
    guardarLicencia(clave, 'activa');
    return true;
  }

  if (resultado === 'sin_red') {
    guardarLicencia(clave, 'pendiente');
    return true;
  }

  return false;
}

export function esProActivo(): boolean {
  try {
    const clave = localStorage.getItem(CLAVE_STORAGE);
    return !!clave && validarFormatoLicencia(clave);
  } catch {
    return false;
  }
}

export function desactivarLicencia(): void {
  try {
    localStorage.removeItem(CLAVE_STORAGE);
    localStorage.removeItem(ESTADO_STORAGE);
  } catch {
    // almacenamiento no disponible: no hay nada que limpiar
  }
}

export async function reintentarVerificacion(): Promise<void> {
  if (GUMROAD_PRODUCT_ID === '') {
    return;
  }

  let clave: string | null;
  let estado: string | null;
  try {
    clave = localStorage.getItem(CLAVE_STORAGE);
    estado = localStorage.getItem(ESTADO_STORAGE);
  } catch {
    return;
  }

  if (!clave || estado !== 'pendiente') {
    return;
  }

  const resultado = await verificarConGumroad(clave);

  if (resultado === 'aceptada') {
    guardarLicencia(clave, 'activa');
  } else if (resultado === 'rechazada') {
    desactivarLicencia();
  }
}
