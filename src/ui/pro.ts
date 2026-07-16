import { activarLicencia, esProActivo, desactivarLicencia } from '../core/licencia';
import { exportarJSON, importarJSON } from '../core/almacen';
import { PRO_URL, AFILIADO_GESTORIA_URL } from '../config';

export interface ProAPI {
  esPro(): boolean;
  colorAcento(): string | undefined;
  logoDataUrl(): string | undefined;
}

const ACENTO_STORAGE = 'facturea:pro:acento';
const LOGO_STORAGE = 'facturea:pro:logo';

function leerAcento(): string | undefined {
  try {
    return localStorage.getItem(ACENTO_STORAGE) ?? undefined;
  } catch {
    return undefined;
  }
}

function guardarAcento(color: string): void {
  try {
    localStorage.setItem(ACENTO_STORAGE, color);
  } catch {
    // almacenamiento no disponible: no se persiste, pero no se rompe el flujo
  }
}

function leerLogo(): string | undefined {
  try {
    return localStorage.getItem(LOGO_STORAGE) ?? undefined;
  } catch {
    return undefined;
  }
}

function guardarLogo(dataUrl: string): void {
  try {
    localStorage.setItem(LOGO_STORAGE, dataUrl);
  } catch {
    // almacenamiento no disponible: no se persiste, pero no se rompe el flujo
  }
}

export function montarPro(root: HTMLElement, onCambio: () => void): ProAPI {
  root.innerHTML = '';

  const contenedor = document.createElement('div');
  contenedor.className = 'seccion-pro';
  root.appendChild(contenedor);

  function render(): void {
    contenedor.innerHTML = '';
    const pro = esProActivo();

    const estado = document.createElement('p');
    estado.className = 'pro-estado';
    estado.textContent = pro ? 'Estado: Pro' : 'Estado: Free';
    contenedor.appendChild(estado);

    if (!pro) {
      const campoClave = document.createElement('input');
      campoClave.type = 'text';
      campoClave.placeholder = 'Clave de licencia (FACT-XXXX-XXXX-XXXX)';
      contenedor.appendChild(campoClave);

      const mensaje = document.createElement('p');
      mensaje.className = 'pro-mensaje';

      const botonActivar = document.createElement('button');
      botonActivar.type = 'button';
      botonActivar.textContent = 'Activar';
      botonActivar.addEventListener('click', () => {
        void (async () => {
          const ok = await activarLicencia(campoClave.value.trim());
          if (ok) {
            render();
            onCambio();
            return;
          }
          mensaje.textContent = 'Clave inválida.';
        })();
      });
      contenedor.appendChild(botonActivar);
      contenedor.appendChild(mensaje);

      const enlaceCompra = document.createElement('a');
      enlaceCompra.href = PRO_URL;
      enlaceCompra.target = '_blank';
      enlaceCompra.rel = 'noopener noreferrer';
      enlaceCompra.textContent = 'Hazte Pro';
      contenedor.appendChild(enlaceCompra);
    } else {
      const botonDesactivar = document.createElement('button');
      botonDesactivar.type = 'button';
      botonDesactivar.textContent = 'Desactivar licencia';
      botonDesactivar.addEventListener('click', () => {
        desactivarLicencia();
        render();
        onCambio();
      });
      contenedor.appendChild(botonDesactivar);

      const grupoAcento = document.createElement('div');
      grupoAcento.className = 'pro-acento';
      const labelAcento = document.createElement('label');
      const idAcento = 'pro-acento-input';
      labelAcento.setAttribute('for', idAcento);
      labelAcento.textContent = 'Color de acento';
      const inputAcento = document.createElement('input');
      inputAcento.type = 'color';
      inputAcento.id = idAcento;
      inputAcento.value = leerAcento() ?? '#2563eb';
      inputAcento.addEventListener('input', () => {
        guardarAcento(inputAcento.value);
        onCambio();
      });
      grupoAcento.appendChild(labelAcento);
      grupoAcento.appendChild(inputAcento);
      contenedor.appendChild(grupoAcento);

      const grupoLogo = document.createElement('div');
      grupoLogo.className = 'pro-logo';
      const labelLogo = document.createElement('label');
      const idLogo = 'pro-logo-input';
      labelLogo.setAttribute('for', idLogo);
      labelLogo.textContent = 'Logo';
      const inputLogo = document.createElement('input');
      inputLogo.type = 'file';
      inputLogo.id = idLogo;
      inputLogo.accept = 'image/*';
      inputLogo.addEventListener('change', () => {
        const archivo = inputLogo.files?.[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
          if (typeof lector.result === 'string') {
            guardarLogo(lector.result);
            onCambio();
          }
        };
        lector.readAsDataURL(archivo);
      });
      grupoLogo.appendChild(labelLogo);
      grupoLogo.appendChild(inputLogo);
      contenedor.appendChild(grupoLogo);

      const seccionDatos = document.createElement('div');
      seccionDatos.className = 'pro-datos';

      const botonExportar = document.createElement('button');
      botonExportar.type = 'button';
      botonExportar.textContent = 'Exportar JSON';
      botonExportar.addEventListener('click', () => {
        const json = exportarJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'facturea-datos.json';
        enlace.click();
        URL.revokeObjectURL(url);
      });
      seccionDatos.appendChild(botonExportar);

      const mensajeImportar = document.createElement('p');
      mensajeImportar.className = 'pro-mensaje';

      const inputImportar = document.createElement('input');
      inputImportar.type = 'file';
      inputImportar.accept = 'application/json';
      inputImportar.addEventListener('change', () => {
        const archivo = inputImportar.files?.[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onload = () => {
          if (typeof lector.result !== 'string') return;
          const resultado = importarJSON(lector.result);
          mensajeImportar.textContent = resultado.ok ? 'Datos importados.' : 'Error al importar el fichero.';
          if (resultado.ok) {
            onCambio();
          }
        };
        lector.readAsText(archivo);
      });
      seccionDatos.appendChild(inputImportar);
      seccionDatos.appendChild(mensajeImportar);

      contenedor.appendChild(seccionDatos);
    }

    const enlaceGestoria = document.createElement('a');
    enlaceGestoria.className = 'pro-afiliado';
    enlaceGestoria.href = AFILIADO_GESTORIA_URL;
    enlaceGestoria.target = '_blank';
    enlaceGestoria.rel = 'noopener noreferrer';
    enlaceGestoria.textContent = '¿Prefieres que facture otro por ti?';
    contenedor.appendChild(enlaceGestoria);
  }

  render();

  return {
    esPro: () => esProActivo(),
    colorAcento: () => leerAcento(),
    logoDataUrl: () => leerLogo(),
  };
}
