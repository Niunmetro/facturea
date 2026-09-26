import type { FacturaGuardada, ResultadoFactura } from "../core/types";
import { formatearEuros, formatearFechaEs } from "../core/formato";

export interface OpcionesRenderFactura {
  esPro: boolean;
  colorAcento?: string;
  logoDataUrl?: string;
}

const ACENTO_POR_DEFECTO = "#4338ca";

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Valor escapado o, si está vacío, un texto guía que solo se ve en pantalla (se oculta al imprimir). */
function valorOGuia(valor: string | undefined, guia: string): string {
  const limpio = (valor ?? "").trim();
  return limpio === "" ? `<span class="factura-vacio">${escaparHtml(guia)}</span>` : escaparHtml(limpio);
}

function euros(valor: number): string {
  return `${formatearEuros(valor)}&nbsp;€`;
}

function fechaOGuia(fecha: string | undefined, guia: string): string {
  return fecha ? escaparHtml(formatearFechaEs(fecha)) : `<span class="factura-vacio">${escaparHtml(guia)}</span>`;
}

export function renderFacturaHTML(
  factura: FacturaGuardada,
  resultado: ResultadoFactura,
  opts: OpcionesRenderFactura
): string {
  const acento = opts.colorAcento ? escaparHtml(opts.colorAcento) : ACENTO_POR_DEFECTO;

  const logoHtml = opts.logoDataUrl
    ? `<img class="factura-logo" src="${escaparHtml(opts.logoDataUrl)}" alt="Logo" />`
    : "";

  const filasLineas = factura.lineas
    .map((linea) => {
      const importe = linea.cantidad * linea.precioUnitario;
      const iva = linea.ivaPct === 0 ? "Exento" : `${linea.ivaPct}%`;
      const cantidad = String(linea.cantidad).replace(".", ",");
      return `
        <tr>
          <td>${valorOGuia(linea.concepto, "Concepto del servicio o producto")}</td>
          <td>${cantidad}</td>
          <td>${euros(linea.precioUnitario)}</td>
          <td>${iva}</td>
          <td>${euros(importe)}</td>
        </tr>`;
    })
    .join("");

  const motivosExencion = factura.lineas
    .filter((linea) => linea.ivaPct === 0 && linea.motivoExencion)
    .map((linea) => `<p class="factura-motivo-exencion">${escaparHtml(linea.motivoExencion!)}</p>`)
    .join("");

  const filasDesglose = resultado.desgloseIva
    .map(
      (d) => `
        <tr>
          <td>${d.ivaPct === 0 ? "Exento" : `${d.ivaPct}%`}</td>
          <td>${euros(d.base)}</td>
          <td>${euros(d.cuota)}</td>
        </tr>`
    )
    .join("");

  const filaRecargo =
    resultado.totalRecargo > 0
      ? `<div class="factura-linea-total"><span>Recargo de equivalencia</span><span>${euros(resultado.totalRecargo)}</span></div>`
      : "";

  const filaRetencion =
    resultado.retencion > 0
      ? `<div class="factura-linea-total"><span>Retención IRPF (${factura.retencionIrpfPct}%)</span><span>-${euros(resultado.retencion)}</span></div>`
      : "";

  const filaIban = factura.emisor.iban
    ? `<div class="factura-iban">IBAN: ${escaparHtml(factura.emisor.iban)}</div>`
    : "";

  const filaFormaPago = factura.formaPago
    ? `<div class="factura-forma-pago">Forma de pago: ${escaparHtml(factura.formaPago)}</div>`
    : "";

  const bloquePago =
    filaIban || filaFormaPago
      ? `<section class="factura-pago">
    <h3>Pago</h3>
    ${filaFormaPago}
    ${filaIban}
  </section>`
      : "";

  const filaFechaOperacion = factura.fechaOperacion
    ? `<p><span>Fecha de operación:</span> ${escaparHtml(formatearFechaEs(factura.fechaOperacion))}</p>`
    : "";

  const pieMarca = opts.esPro
    ? ""
    : `<footer class="factura-marca">Hecho con Facturea — niunmetro.github.io/facturea</footer>`;

  return `
<article class="factura-print" style="--color-acento: ${acento};">
  <header class="factura-cabecera">
    <div class="factura-emisor">
      ${logoHtml}
      <h2>${valorOGuia(factura.emisor.nombre, "Tu nombre o empresa")}</h2>
      <p>NIF: ${valorOGuia(factura.emisor.nif, "—")}</p>
      <p>${valorOGuia(factura.emisor.direccion, "Tu dirección fiscal")}</p>
    </div>
    <div class="factura-datos">
      <h1 class="factura-titulo"><span class="factura-etiqueta">Factura</span> <span class="factura-numero">${escaparHtml(factura.numero)}</span></h1>
      <p><span>Fecha de emisión:</span> ${fechaOGuia(factura.fechaEmision, "—")}</p>
      <p><span>Fecha de vencimiento:</span> ${fechaOGuia(factura.fechaVencimiento, "—")}</p>
      ${filaFechaOperacion}
    </div>
  </header>

  <section class="factura-cliente">
    <h3>Facturar a</h3>
    <p class="factura-cliente-nombre">${valorOGuia(factura.cliente.nombre, "Nombre del cliente")}</p>
    <p>NIF: ${valorOGuia(factura.cliente.nif, "—")}</p>
    <p>${valorOGuia(factura.cliente.direccion, "Dirección del cliente")}</p>
  </section>

  <table class="factura-lineas">
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Cant.</th>
        <th>Precio</th>
        <th>IVA</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>${filasLineas}
    </tbody>
  </table>

  <div class="factura-resumen">
    <div class="factura-resumen-izq">
      <table class="factura-desglose-iva">
        <thead>
          <tr>
            <th>IVA</th>
            <th>Base</th>
            <th>Cuota</th>
          </tr>
        </thead>
        <tbody>${filasDesglose}
        </tbody>
      </table>
      ${motivosExencion}
    </div>

    <section class="factura-totales">
      <div class="factura-linea-total"><span>Base imponible</span><span>${euros(resultado.baseImponible)}</span></div>
      <div class="factura-linea-total"><span>Total IVA</span><span>${euros(resultado.totalIva)}</span></div>
      ${filaRecargo}
      ${filaRetencion}
      <div class="factura-total-destacado"><span>TOTAL</span><span>${euros(resultado.total)}</span></div>
    </section>
  </div>

  ${bloquePago}

  ${pieMarca}
</article>
`;
}
