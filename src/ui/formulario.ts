import type { Emisor, Cliente, LineaFactura, IvaPct, RecargoPct, RetencionIrpfPct } from '../core/types';
import { parseDecimalEs } from '../core/formato';
import { validarNif } from '../core/nif';

export interface DatosFormulario {
  emisor: Emisor;
  cliente: Cliente;
  lineas: LineaFactura[];
  retencionIrpfPct: RetencionIrpfPct;
  fechaEmision: string;
  fechaVencimiento: string;
  formaPago?: string;
  fechaOperacion?: string;
}

export interface FormularioAPI {
  leerDatos(): DatosFormulario;
  cargarDatos(d: DatosFormulario): void;
  limpiar(): void;
}

const IVA_OPCIONES: IvaPct[] = [0, 4, 10, 21];
const IRPF_OPCIONES: RetencionIrpfPct[] = [0, 7, 15];
const RECARGO_OPCIONES: RecargoPct[] = [0, 0.5, 1.4, 5.2];

const MOTIVOS_EXENCION_SUGERENCIAS: string[] = [
  'Operación exenta art. 20 LIVA',
  'Inversión del sujeto pasivo art. 84.Uno.2 LIVA',
  'No sujeta art. 69 LIVA — cliente UE',
];

let idCounter = 0;
function siguienteId(prefijo: string): string {
  idCounter += 1;
  return `${prefijo}-${idCounter}`;
}

interface FilaLinea {
  wrapper: HTMLElement;
  concepto: HTMLInputElement;
  cantidad: HTMLInputElement;
  precioUnitario: HTMLInputElement;
  ivaPct: HTMLSelectElement;
  recargoPct: HTMLSelectElement;
  motivoExencion: HTMLInputElement;
  motivoExencionGrupo: HTMLElement;
}

function crearCampoTexto(
  contenedor: HTMLElement,
  etiqueta: string,
  onChange: () => void
): HTMLInputElement {
  const grupo = document.createElement('div');
  grupo.className = 'campo';

  const id = siguienteId('campo');
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = etiqueta;

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;

  grupo.appendChild(label);
  grupo.appendChild(input);
  contenedor.appendChild(grupo);

  input.addEventListener('input', onChange);

  return input;
}

function crearCampoTextoConSugerencias(
  contenedor: HTMLElement,
  etiqueta: string,
  sugerencias: string[],
  onChange: () => void
): { grupo: HTMLElement; input: HTMLInputElement } {
  const grupo = document.createElement('div');
  grupo.className = 'campo';

  const id = siguienteId('campo');
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = etiqueta;

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;

  const listaId = siguienteId('datalist');
  const datalist = document.createElement('datalist');
  datalist.id = listaId;
  for (const sugerencia of sugerencias) {
    const option = document.createElement('option');
    option.value = sugerencia;
    datalist.appendChild(option);
  }
  input.setAttribute('list', listaId);

  grupo.appendChild(label);
  grupo.appendChild(input);
  grupo.appendChild(datalist);
  contenedor.appendChild(grupo);

  input.addEventListener('input', onChange);

  return { grupo, input };
}

function crearCampoNumerico(
  contenedor: HTMLElement,
  etiqueta: string,
  onChange: () => void
): HTMLInputElement {
  const input = crearCampoTexto(contenedor, etiqueta, onChange);
  input.inputMode = 'decimal';
  return input;
}

function crearCampoFecha(
  contenedor: HTMLElement,
  etiqueta: string,
  onChange: () => void
): HTMLInputElement {
  const grupo = document.createElement('div');
  grupo.className = 'campo';

  const id = siguienteId('campo');
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = etiqueta;

  const input = document.createElement('input');
  input.type = 'date';
  input.id = id;

  grupo.appendChild(label);
  grupo.appendChild(input);
  contenedor.appendChild(grupo);

  input.addEventListener('input', onChange);

  return input;
}

function crearSelect<T extends number>(
  contenedor: HTMLElement,
  etiqueta: string,
  opciones: T[],
  sufijo: string,
  onChange: () => void,
  etiquetasPersonalizadas?: Partial<Record<T, string>>
): HTMLSelectElement {
  const grupo = document.createElement('div');
  grupo.className = 'campo';

  const id = siguienteId('campo');
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = etiqueta;

  const select = document.createElement('select');
  select.id = id;

  for (const opcion of opciones) {
    const option = document.createElement('option');
    option.value = String(opcion);
    option.textContent = etiquetasPersonalizadas?.[opcion] ?? `${opcion}${sufijo}`;
    select.appendChild(option);
  }

  grupo.appendChild(label);
  grupo.appendChild(select);
  contenedor.appendChild(grupo);

  select.addEventListener('change', onChange);

  return select;
}

export function montarFormulario(root: HTMLElement, onChange: () => void): FormularioAPI {
  root.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'formulario-factura';
  form.addEventListener('submit', (e) => e.preventDefault());
  root.appendChild(form);

  // --- Emisor ---
  const seccionEmisor = document.createElement('fieldset');
  const leyendaEmisor = document.createElement('legend');
  leyendaEmisor.textContent = 'Emisor';
  seccionEmisor.appendChild(leyendaEmisor);
  form.appendChild(seccionEmisor);

  const emisorNombre = crearCampoTexto(seccionEmisor, 'Nombre / Razón social', onChange);
  const emisorNif = crearCampoTexto(seccionEmisor, 'NIF', onChange);
  const emisorDireccion = crearCampoTexto(seccionEmisor, 'Dirección', onChange);
  const emisorIban = crearCampoTexto(seccionEmisor, 'IBAN (opcional)', onChange);

  const emisorNifMensaje = document.createElement('p');
  emisorNifMensaje.className = 'nif-mensaje';
  emisorNifMensaje.setAttribute('aria-live', 'polite');
  emisorNif.insertAdjacentElement('afterend', emisorNifMensaje);

  const validarNifEmisorVisual = () => {
    const valor = emisorNif.value.trim();
    emisorNif.classList.remove('nif-valido', 'nif-invalido');
    emisorNif.removeAttribute('aria-invalid');
    emisorNifMensaje.textContent = '';
    if (valor === '') {
      return;
    }
    if (validarNif(valor)) {
      emisorNif.classList.add('nif-valido');
      emisorNif.setAttribute('aria-invalid', 'false');
      emisorNifMensaje.textContent = 'El NIF es válido.';
    } else {
      emisorNif.classList.add('nif-invalido');
      emisorNif.setAttribute('aria-invalid', 'true');
      emisorNifMensaje.textContent = 'El NIF no es válido.';
    }
  };
  emisorNif.addEventListener('input', validarNifEmisorVisual);

  // --- Cliente ---
  const seccionCliente = document.createElement('fieldset');
  const leyendaCliente = document.createElement('legend');
  leyendaCliente.textContent = 'Cliente';
  seccionCliente.appendChild(leyendaCliente);
  form.appendChild(seccionCliente);

  const clienteNombre = crearCampoTexto(seccionCliente, 'Nombre / Razón social', onChange);
  const clienteNif = crearCampoTexto(seccionCliente, 'NIF', onChange);
  const clienteDireccion = crearCampoTexto(seccionCliente, 'Dirección', onChange);

  // --- Fechas y forma de pago ---
  const seccionDatos = document.createElement('fieldset');
  const leyendaDatos = document.createElement('legend');
  leyendaDatos.textContent = 'Datos de la factura';
  seccionDatos.appendChild(leyendaDatos);
  form.appendChild(seccionDatos);

  const fechaEmision = crearCampoFecha(seccionDatos, 'Fecha de emisión', onChange);
  const fechaVencimiento = crearCampoFecha(seccionDatos, 'Fecha de vencimiento', onChange);
  const fechaOperacion = crearCampoFecha(seccionDatos, 'Fecha de operación (opcional)', onChange);
  const formaPago = crearCampoTexto(seccionDatos, 'Forma de pago (opcional)', onChange);
  const retencionIrpf = crearSelect(seccionDatos, 'IRPF', IRPF_OPCIONES, '%', onChange);

  // --- Líneas ---
  const seccionLineas = document.createElement('fieldset');
  const leyendaLineas = document.createElement('legend');
  leyendaLineas.textContent = 'Líneas de factura';
  seccionLineas.appendChild(leyendaLineas);
  form.appendChild(seccionLineas);

  const listaLineas = document.createElement('div');
  listaLineas.className = 'lineas-factura';
  seccionLineas.appendChild(listaLineas);

  const filas: FilaLinea[] = [];

  function crearFilaLinea(): FilaLinea {
    const wrapper = document.createElement('div');
    wrapper.className = 'linea-factura';

    const concepto = crearCampoTexto(wrapper, 'Concepto', onChange);
    const cantidad = crearCampoNumerico(wrapper, 'Cantidad', onChange);
    const precioUnitario = crearCampoNumerico(wrapper, 'Precio unitario', onChange);
    const ivaPct = crearSelect(wrapper, 'IVA', IVA_OPCIONES, '%', onChange, { 0: 'Exenta/No sujeta' });
    // El caso comun del autonomo es el 21%: una linea nueva NO debe nacer "Exenta" (ademas
    // dispararia el campo de motivo de exencion sin que el usuario haya elegido nada).
    ivaPct.value = '21';
    const recargoPct = crearSelect(wrapper, 'Recargo de equivalencia', RECARGO_OPCIONES, '%', onChange);

    const { grupo: motivoExencionGrupo, input: motivoExencion } = crearCampoTextoConSugerencias(
      wrapper,
      'Motivo de exención',
      MOTIVOS_EXENCION_SUGERENCIAS,
      onChange
    );

    const actualizarVisibilidadMotivoExencion = () => {
      motivoExencionGrupo.style.display = ivaPct.value === '0' ? '' : 'none';
    };
    ivaPct.addEventListener('change', actualizarVisibilidadMotivoExencion);
    actualizarVisibilidadMotivoExencion();

    const botonQuitar = document.createElement('button');
    botonQuitar.type = 'button';
    botonQuitar.textContent = 'Quitar línea';
    botonQuitar.addEventListener('click', () => {
      const idx = filas.findIndex((f) => f.wrapper === wrapper);
      if (idx !== -1) {
        filas.splice(idx, 1);
      }
      wrapper.remove();
      onChange();
    });
    wrapper.appendChild(botonQuitar);

    listaLineas.appendChild(wrapper);

    return { wrapper, concepto, cantidad, precioUnitario, ivaPct, recargoPct, motivoExencion, motivoExencionGrupo };
  }

  function anadirLinea(): void {
    filas.push(crearFilaLinea());
  }

  const botonAnadir = document.createElement('button');
  botonAnadir.type = 'button';
  botonAnadir.textContent = 'Añadir línea';
  botonAnadir.addEventListener('click', () => {
    anadirLinea();
    onChange();
  });
  seccionLineas.appendChild(botonAnadir);

  anadirLinea();

  function leerDatos(): DatosFormulario {
    const lineas: LineaFactura[] = filas.map((f) => {
      const ivaPct = Number(f.ivaPct.value) as IvaPct;
      const linea: LineaFactura = {
        concepto: f.concepto.value,
        cantidad: parseDecimalEs(f.cantidad.value),
        precioUnitario: parseDecimalEs(f.precioUnitario.value),
        ivaPct,
        recargoPct: Number(f.recargoPct.value) as RecargoPct,
      };
      if (ivaPct === 0) {
        linea.motivoExencion = f.motivoExencion.value;
      }
      return linea;
    });

    const emisor: Emisor = {
      nombre: emisorNombre.value,
      nif: emisorNif.value,
      direccion: emisorDireccion.value,
      ...(emisorIban.value.trim() !== '' ? { iban: emisorIban.value } : {}),
    };

    const cliente: Cliente = {
      nombre: clienteNombre.value,
      nif: clienteNif.value,
      direccion: clienteDireccion.value,
    };

    const datos: DatosFormulario = {
      emisor,
      cliente,
      lineas,
      retencionIrpfPct: Number(retencionIrpf.value) as RetencionIrpfPct,
      fechaEmision: fechaEmision.value,
      fechaVencimiento: fechaVencimiento.value,
    };

    if (formaPago.value.trim() !== '') {
      datos.formaPago = formaPago.value;
    }

    if (fechaOperacion.value.trim() !== '') {
      datos.fechaOperacion = fechaOperacion.value;
    }

    return datos;
  }

  function cargarDatos(d: DatosFormulario): void {
    emisorNombre.value = d.emisor.nombre;
    emisorNif.value = d.emisor.nif;
    emisorDireccion.value = d.emisor.direccion;
    emisorIban.value = d.emisor.iban ?? '';
    validarNifEmisorVisual();

    clienteNombre.value = d.cliente.nombre;
    clienteNif.value = d.cliente.nif;
    clienteDireccion.value = d.cliente.direccion;

    fechaEmision.value = d.fechaEmision;
    fechaVencimiento.value = d.fechaVencimiento;
    fechaOperacion.value = d.fechaOperacion ?? '';
    formaPago.value = d.formaPago ?? '';
    retencionIrpf.value = String(d.retencionIrpfPct);

    listaLineas.innerHTML = '';
    filas.length = 0;

    for (const linea of d.lineas) {
      const fila = crearFilaLinea();
      fila.concepto.value = linea.concepto;
      fila.cantidad.value = String(linea.cantidad);
      fila.precioUnitario.value = String(linea.precioUnitario);
      fila.ivaPct.value = String(linea.ivaPct);
      fila.recargoPct.value = String(linea.recargoPct);
      fila.motivoExencion.value = linea.motivoExencion ?? '';
      fila.motivoExencionGrupo.style.display = linea.ivaPct === 0 ? '' : 'none';
      filas.push(fila);
    }
    if (filas.length === 0) {
      anadirLinea();
    }
  }

  function limpiar(): void {
    emisorNombre.value = '';
    emisorNif.value = '';
    emisorDireccion.value = '';
    emisorIban.value = '';
    validarNifEmisorVisual();

    clienteNombre.value = '';
    clienteNif.value = '';
    clienteDireccion.value = '';

    fechaEmision.value = '';
    fechaVencimiento.value = '';
    fechaOperacion.value = '';
    formaPago.value = '';
    retencionIrpf.value = String(IRPF_OPCIONES[0]);

    listaLineas.innerHTML = '';
    filas.length = 0;
    anadirLinea();
  }

  return { leerDatos, cargarDatos, limpiar };
}
