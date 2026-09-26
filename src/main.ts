import type { DatosFormulario } from './ui/formulario';
import { montarFormulario } from './ui/formulario';
import { montarHistorial } from './ui/historial';
import { montarPro } from './ui/pro';
import { calcularFactura } from './core/factura';
import { peekNumero, consumirNumero } from './core/contador';
import { validarFacturaParaImprimir } from './core/validacion';
import { renderFacturaHTML } from './ui/factura-vista';
import { guardarFactura, cargarEmisor, guardarEmisor } from './core/almacen';
import { reintentarVerificacion } from './core/licencia';
import { formatearEuros, formatearFechaEs } from './core/formato';
import { PRO_URL, PRECIO_PRO } from './config';
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

function hoyIso(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
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
    ...(f.fechaOperacion !== undefined ? { fechaOperacion: f.fechaOperacion } : {}),
  };
}

function sumarDias(fechaIso: string, dias: number): string {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  const fecha = new Date(anio ?? 1970, (mes ?? 1) - 1, (dia ?? 1) + dias);
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

/** Datos de demostración para ver la herramienta en acción (no se guardan como factura). */
function datosEjemplo(emisorActual: DatosFormulario['emisor']): DatosFormulario {
  const hoy = hoyIso();
  const emisor =
    emisorActual.nombre.trim() !== ''
      ? emisorActual
      : {
          nombre: 'Laura Martín Ortega',
          nif: '12345678Z',
          direccion: 'C/ Trapería 14, 2.º B · 30001 Murcia',
          iban: 'ES91 2100 0418 4502 0005 1332',
        };
  return {
    emisor,
    cliente: {
      nombre: 'Nortesur Logística S.L.',
      nif: 'B76543214',
      direccion: 'Av. de la Libertad 8 · 30009 Murcia',
    },
    lineas: [
      { concepto: 'Diseño de identidad visual (logotipo y manual de marca)', cantidad: 1, precioUnitario: 1200, ivaPct: 21, recargoPct: 0 },
      { concepto: 'Maquetación de la web corporativa (horas)', cantidad: 12, precioUnitario: 45, ivaPct: 21, recargoPct: 0 },
    ],
    retencionIrpfPct: 15,
    fechaEmision: hoy,
    fechaVencimiento: sumarDias(hoy, 30),
    formaPago: 'Transferencia bancaria a 30 días',
  };
}

const MAPEO_FALTAS: { patron: RegExp; legend: string; label: string }[] = [
  { patron: /nombre del emisor/i, legend: 'Emisor', label: 'Nombre / Razón social' },
  { patron: /NIF del emisor/i, legend: 'Emisor', label: 'NIF' },
  { patron: /nombre del cliente/i, legend: 'Cliente', label: 'Nombre / Razón social' },
  { patron: /fecha de emision/i, legend: 'Datos de la factura', label: 'Fecha de emisión' },
  { patron: /linea con concepto/i, legend: 'Líneas de factura', label: 'Concepto' },
];

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
  const importeEtiqueta = document.createElement('span');
  importeEtiqueta.className = 'barra-total-etiqueta';
  importeEtiqueta.textContent = 'Total';
  const importeCifra = document.createElement('span');
  importeCifra.className = 'barra-total-cifra';
  importeTotal.append(importeEtiqueta, importeCifra);
  barraTotal.insertBefore(importeTotal, barraTotal.firstChild);

  const btnNuevaFactura = document.createElement('button');
  btnNuevaFactura.type = 'button';
  btnNuevaFactura.className = 'btn btn-fantasma';
  btnNuevaFactura.textContent = 'Nueva factura';
  barraTotal.insertBefore(btnNuevaFactura, btnGuardar);

  const contenedorApp = zonaFormulario.parentElement ?? document.body;

  const avisos = document.createElement('div');
  avisos.id = 'avisos';
  avisos.className = 'avisos';
  avisos.setAttribute('aria-live', 'polite');
  avisos.setAttribute('role', 'status');
  avisos.hidden = true;
  contenedorApp.insertBefore(avisos, zonaFormulario);

  const ctaProDescarga = document.createElement('div');
  ctaProDescarga.className = 'cta-pro-descarga';
  ctaProDescarga.hidden = true;
  const ctaProEnlace = document.createElement('a');
  ctaProEnlace.href = PRO_URL;
  ctaProEnlace.target = '_blank';
  ctaProEnlace.rel = 'noopener noreferrer';
  ctaProEnlace.textContent = `Hazte Pro (${PRECIO_PRO}) y elimina la marca de agua`;
  const ctaProCerrar = document.createElement('button');
  ctaProCerrar.type = 'button';
  ctaProCerrar.textContent = '×';
  ctaProCerrar.setAttribute('aria-label', 'Cerrar aviso');
  ctaProCerrar.addEventListener('click', () => {
    ctaProDescarga.hidden = true;
  });
  ctaProDescarga.appendChild(ctaProEnlace);
  ctaProDescarga.appendChild(ctaProCerrar);
  contenedorApp.insertBefore(ctaProDescarga, zonaHistorial);

  function mostrarAviso(mensaje: string): void {
    avisos.innerHTML = '';
    avisos.hidden = false;
    const p = document.createElement('p');
    p.textContent = mensaje;
    avisos.appendChild(p);
  }

  function buscarCampoPorFieldsetYLabel(legendTexto: string, labelTexto: string): HTMLElement | null {
    const fieldsets = Array.from(zonaFormulario.querySelectorAll('fieldset'));
    for (const fieldset of fieldsets) {
      const legend = fieldset.querySelector('legend');
      if (legend?.textContent !== legendTexto) continue;
      const labels = Array.from(fieldset.querySelectorAll('label'));
      for (const label of labels) {
        if (label.textContent === labelTexto) {
          const forId = label.getAttribute('for');
          if (forId) {
            const campo = document.getElementById(forId);
            if (campo) return campo;
          }
        }
      }
    }
    return null;
  }

  function enfocarPrimerCampoConFallo(faltas: string[]): void {
    for (const falta of faltas) {
      const mapeo = MAPEO_FALTAS.find((m) => m.patron.test(falta));
      const campo = mapeo ? buscarCampoPorFieldsetYLabel(mapeo.legend, mapeo.label) : null;
      if (campo) {
        campo.focus();
        return;
      }
    }
  }

  function mostrarFaltas(faltas: string[]): void {
    avisos.innerHTML = '';
    avisos.hidden = false;
    const titulo = document.createElement('p');
    titulo.textContent = 'Antes de imprimir, corrige lo siguiente:';
    avisos.appendChild(titulo);
    const lista = document.createElement('ul');
    for (const falta of faltas) {
      const li = document.createElement('li');
      li.textContent = falta;
      lista.appendChild(li);
    }
    avisos.appendChild(lista);
    enfocarPrimerCampoConFallo(faltas);
  }

  function limpiarAvisos(): void {
    avisos.innerHTML = '';
    avisos.hidden = true;
  }

  function mostrarCtaPro(): void {
    if (proAPI.esPro()) return;
    ctaProDescarga.hidden = false;
  }

  let numeroCargado: string | null = null;
  let numeroConsumido: string | null = null;
  let permitirSobrescritura = false;
  let facturaActual: FacturaGuardada | null = null;

  const proAPI = montarPro(zonaPro, () => actualizarVista());

  const historialAPI = montarHistorial(zonaHistorial, {
    esPro: () => proAPI.esPro(),
    onCargar: (f) => {
      numeroCargado = f.numero;
      numeroConsumido = null;
      permitirSobrescritura = false;
      formularioAPI.cargarDatos(datosADatosFormulario(f));
      limpiarAvisos();
      ctaProDescarga.hidden = true;
      actualizarVista();
    },
    onDuplicar: (f) => {
      numeroCargado = null;
      numeroConsumido = null;
      permitirSobrescritura = false;
      formularioAPI.cargarDatos(datosADatosFormulario(f));
      limpiarAvisos();
      ctaProDescarga.hidden = true;
      actualizarVista();
    },
  });

  function actualizarVista(): void {
    const datos = formularioAPI.leerDatos();
    guardarEmisor(datos.emisor);

    const resultado = calcularFactura(datos.lineas, datos.retencionIrpfPct);
    const anio = anioDesdeFecha(datos.fechaEmision);
    const numero = numeroCargado ?? numeroConsumido ?? peekNumero(anio);

    const factura: FacturaGuardada = {
      numero,
      fechaEmision: datos.fechaEmision,
      fechaVencimiento: datos.fechaVencimiento,
      emisor: datos.emisor,
      cliente: datos.cliente,
      lineas: datos.lineas,
      retencionIrpfPct: datos.retencionIrpfPct,
      ...(datos.formaPago !== undefined ? { formaPago: datos.formaPago } : {}),
      ...(datos.fechaOperacion !== undefined ? { fechaOperacion: datos.fechaOperacion } : {}),
    };
    facturaActual = factura;

    zonaVista.innerHTML = renderFacturaHTML(factura, resultado, {
      esPro: proAPI.esPro(),
      colorAcento: proAPI.colorAcento(),
      logoDataUrl: proAPI.logoDataUrl(),
    });

    importeCifra.textContent = `${formatearEuros(resultado.total)} €`;
  }

  const formularioAPI = montarFormulario(zonaFormulario, () => actualizarVista());

  const datosIniciales = formularioAPI.leerDatos();
  const emisorGuardado = cargarEmisor();
  formularioAPI.cargarDatos({
    ...datosIniciales,
    emisor: emisorGuardado ?? datosIniciales.emisor,
    fechaEmision: hoyIso(),
  });

  btnNuevaFactura.addEventListener('click', () => {
    formularioAPI.limpiar();
    const datos = formularioAPI.leerDatos();
    formularioAPI.cargarDatos({ ...datos, fechaEmision: hoyIso() });
    numeroCargado = null;
    numeroConsumido = null;
    permitirSobrescritura = false;
    limpiarAvisos();
    ctaProDescarga.hidden = true;
    actualizarVista();
  });

  const btnEjemplo = document.getElementById('btn-ejemplo');
  const cargarEjemplo = (): void => {
    formularioAPI.cargarDatos(datosEjemplo(formularioAPI.leerDatos().emisor));
    numeroCargado = null;
    numeroConsumido = null;
    permitirSobrescritura = false;
    limpiarAvisos();
    ctaProDescarga.hidden = true;
    actualizarVista();
  };
  btnEjemplo?.addEventListener('click', cargarEjemplo);

  btnGuardar.addEventListener('click', () => {
    if (!facturaActual) {
      actualizarVista();
    }
    if (!facturaActual) return;

    if (numeroCargado !== null && !permitirSobrescritura) {
      const sobrescribir = window.confirm(
        `La factura ${facturaActual.numero} ya esta en el historial. Aceptar para sobrescribirla, cancelar para guardarla como una factura nueva (duplicada).`
      );
      if (sobrescribir) {
        permitirSobrescritura = true;
      } else {
        const anio = anioDesdeFecha(facturaActual.fechaEmision);
        numeroConsumido = consumirNumero(anio);
        numeroCargado = null;
        actualizarVista();
      }
    }

    if (!facturaActual) return;

    if (numeroCargado === null && numeroConsumido === null) {
      const anio = anioDesdeFecha(facturaActual.fechaEmision);
      numeroConsumido = consumirNumero(anio);
      actualizarVista();
    }

    if (!facturaActual) return;

    const resultado = guardarFactura(facturaActual, proAPI.esPro());
    if (!resultado.ok) {
      if (resultado.motivo === 'limite') {
        mostrarAviso('Has alcanzado el limite de facturas del plan gratuito. Pasa a Pro para guardar mas facturas.');
        historialAPI.refrescar();
        zonaHistorial.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    numeroCargado = facturaActual.numero;
    permitirSobrescritura = true;
    mostrarAviso(`Factura ${facturaActual.numero} guardada (emitida el ${formatearFechaEs(facturaActual.fechaEmision)}).`);
    historialAPI.refrescar();
  });

  btnDescargar.addEventListener('click', () => {
    if (!facturaActual) {
      actualizarVista();
    }
    if (!facturaActual) return;

    const validacion = validarFacturaParaImprimir({
      emisor: { nombre: facturaActual.emisor.nombre, nif: facturaActual.emisor.nif },
      cliente: { nombre: facturaActual.cliente.nombre },
      fechaEmision: facturaActual.fechaEmision,
      lineas: facturaActual.lineas.map((linea) => ({
        concepto: linea.concepto,
        precioUnitario: linea.precioUnitario,
      })),
    });

    if (!validacion.ok) {
      mostrarFaltas(validacion.faltas);
      return;
    }
    limpiarAvisos();

    if (numeroCargado === null && numeroConsumido === null) {
      const anio = anioDesdeFecha(facturaActual.fechaEmision);
      numeroConsumido = consumirNumero(anio);
      actualizarVista();
    }

    window.print();
    mostrarCtaPro();
  });

  window.addEventListener('storage', (evento) => {
    if (evento.key && evento.key.startsWith('facturea:contador:')) {
      if (numeroCargado === null && numeroConsumido === null) {
        actualizarVista();
      }
    }
  });

  actualizarVista();

  // Enlace de demostración (?ejemplo): abre la herramienta con una factura de muestra rellena.
  if (new URLSearchParams(window.location.search).has('ejemplo')) {
    cargarEjemplo();
  }

  void reintentarVerificacion();
}

iniciar();

export {};
