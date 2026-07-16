import type { DatosFormulario } from './ui/formulario';
import { montarFormulario } from './ui/formulario';
import { montarHistorial } from './ui/historial';
import { montarPro } from './ui/pro';
import { calcularFactura } from './core/factura';
import { siguienteNumero } from './core/numeracion';
import { renderFacturaHTML } from './ui/factura-vista';
import { guardarFactura, listarFacturas, cargarEmisor, guardarEmisor } from './core/almacen';
import { reintentarVerificacion } from './core/licencia';
import { formatearEuros } from './core/formato';
import type { FacturaGuardada } from './core/types';

function elemento<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Falta el elemento #${id} en el DOM`);
  }
  return el as T;
}

function ocultarSiVacio(anuncio: HTMLElement): void {
  const vacio = anuncio.children.length === 0 && (anuncio.textContent ?? '').trim() === '';
  if (vacio) {
    anuncio.hidden = true;
  }
}

function anioDesdeFecha(fecha: string): number {
  const anio = Number(fecha.slice(0, 4));
  return Number.isFinite(anio) && anio > 0 ? anio : new Date().getFullYear();
}

function datosADatosFormulario(f: FacturaGuardada): DatosFormulario {
  return {
    emisor: f.emisor,
    cliente: f.cliente,
    lineas: f.lineas,
    retencionIrpfPct: f.retencionIrpfPct,
    fechaEmision: f.fechaEmision,
    fechaVencimiento: f.fechaVencimiento,
    ...(f.formaPago !== undefined ? { formaPago: f.formaPago } : {}),
  };
}

function iniciar(): void {
  const zonaFormulario = elemento<HTMLElement>('zona-formulario');
  const zonaVista = elemento<HTMLElement>('zona-vista');
  const zonaHistorial = elemento<HTMLElement>('zona-historial');
  const zonaPro = elemento<HTMLElement>('zona-pro');
  const barraTotal = elemento<HTMLElement>('barra-total');
  const btnGuardar = elemento<HTMLButtonElement>('btn-guardar');
  const btnDescargar = elemento<HTMLButtonElement>('btn-descargar');
  const adTop = elemento<HTMLElement>('ad-top');
  const adBottom = elemento<HTMLElement>('ad-bottom');

  ocultarSiVacio(adTop);
  ocultarSiVacio(adBottom);

  barraTotal.setAttribute('aria-live', 'polite');
  const importeTotal = document.createElement('span');
  importeTotal.className = 'barra-total-importe';
  barraTotal.insertBefore(importeTotal, barraTotal.firstChild);

  let numeroCargado: string | null = null;
  let facturaActual: FacturaGuardada | null = null;

  const proAPI = montarPro(zonaPro, () => actualizarVista());

  const historialAPI = montarHistorial(zonaHistorial, {
    esPro: () => proAPI.esPro(),
    onCargar: (f) => {
      numeroCargado = f.numero;
      formularioAPI.cargarDatos(datosADatosFormulario(f));
      actualizarVista();
    },
    onDuplicar: (f) => {
      numeroCargado = null;
      formularioAPI.cargarDatos(datosADatosFormulario(f));
      actualizarVista();
    },
  });

  function actualizarVista(): void {
    const datos = formularioAPI.leerDatos();
    guardarEmisor(datos.emisor);

    const resultado = calcularFactura(datos.lineas, datos.retencionIrpfPct);
    const numero = numeroCargado ?? siguienteNumero(listarFacturas(), anioDesdeFecha(datos.fechaEmision));

    const factura: FacturaGuardada = {
      numero,
      fechaEmision: datos.fechaEmision,
      fechaVencimiento: datos.fechaVencimiento,
      emisor: datos.emisor,
      cliente: datos.cliente,
      lineas: datos.lineas,
      retencionIrpfPct: datos.retencionIrpfPct,
      ...(datos.formaPago !== undefined ? { formaPago: datos.formaPago } : {}),
    };
    facturaActual = factura;

    zonaVista.innerHTML = renderFacturaHTML(factura, resultado, {
      esPro: proAPI.esPro(),
      colorAcento: proAPI.colorAcento(),
      logoDataUrl: proAPI.logoDataUrl(),
    });

    importeTotal.textContent = `Total: ${formatearEuros(resultado.total)} €`;
  }

  const formularioAPI = montarFormulario(zonaFormulario, () => actualizarVista());

  const emisorGuardado = cargarEmisor();
  if (emisorGuardado) {
    const datos = formularioAPI.leerDatos();
    formularioAPI.cargarDatos({ ...datos, emisor: emisorGuardado });
  }

  btnGuardar.addEventListener('click', () => {
    if (!facturaActual) {
      actualizarVista();
    }
    if (!facturaActual) return;

    const resultado = guardarFactura(facturaActual, proAPI.esPro());
    if (!resultado.ok) {
      if (resultado.motivo === 'limite') {
        historialAPI.refrescar();
        zonaHistorial.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    numeroCargado = facturaActual.numero;
    historialAPI.refrescar();
  });

  btnDescargar.addEventListener('click', () => {
    window.print();
  });

  actualizarVista();

  void reintentarVerificacion();
}

iniciar();

export {};
