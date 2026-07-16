import type { FacturaGuardada, ResultadoFactura } from "../core/types";
import { formatearEuros, formatearFechaEs } from "../core/formato";

export interface OpcionesRenderFactura {
  esPro: boolean;
  colorAcento?: string;
  logoDataUrl?: string;
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderFacturaHTML(
  factura: FacturaGuardada,
  resultado: ResultadoFactura,
  opts: OpcionesRenderFactura
): string {
  const acento = opts.colorAcento ? escaparHtml(opts.colorAcento) : "#000000";

  const logoHtml = opts.logoDataUrl
    ? `<img class="factura-logo" src="${escaparHtml(opts.logoDataUrl)}" alt="Logo" />`
    : "";

  const filasLineas = factura.lineas
    .map((linea) => {
      const importe = linea.cantidad * linea.precioUnitario;
      const iva = linea.ivaPct === 0 ? "Exento" : `${linea.ivaPct}%`;
      return `
        <tr>
          <td>${escaparHtml(linea.concepto)}</td>
          <td>${linea.cantidad}</td>
          <td>${formatearEuros(linea.precioUnitario)}</td>
          <td>${iva}</td>
          <td>${formatearEuros(importe)}</td>
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
          <td>${formatearEuros(d.base)}</td>
          <td>${formatearEuros(d.cuota)}</td>
        </tr>`
    )
    .join("");

  const filaRecargo =
    resultado.totalRecargo > 0
      ? `<div class="factura-linea-total"><span>Recargo de equivalencia</span><span>${formatearEuros(resultado.totalRecargo)}</span></div>`
      : "";

  const filaRetencion =
    resultado.retencion > 0
      ? `<div class="factura-linea-total"><span>Retención IRPF (${factura.retencionIrpfPct}%)</span><span>-${formatearEuros(resultado.retencion)}</span></div>`
      : "";

  const filaIban = factura.emisor.iban
    ? `<div class="factura-iban">IBAN: ${escaparHtml(factura.emisor.iban)}</div>`
    : "";

  const filaFormaPago = factura.formaPago
    ? `<div class="factura-forma-pago">Forma de pago: ${escaparHtml(factura.formaPago)}</div>`
    : "";

  const filaFechaOperacion = factura.fechaOperacion
    ? `<p>Fecha de operación: ${escaparHtml(formatearFechaEs(factura.fechaOperacion))}</p>`
    : "";

  const pieMarca = opts.esPro
    ? ""
    : `<footer class="factura-marca">Hecho con Facturea — niunmetro.github.io/facturea</footer>`;

  return `
<article class="factura-print" style="--color-acento: ${acento};">
  <header class="factura-cabecera">
    ${logoHtml}
    <div class="factura-emisor">
      <h2>${escaparHtml(factura.emisor.nombre)}</h2>
      <p>NIF: ${escaparHtml(factura.emisor.nif)}</p>
      <p>${escaparHtml(factura.emisor.direccion)}</p>
    </div>
    <div class="factura-datos">
      <h1>Factura ${escaparHtml(factura.numero)}</h1>
      <p>Fecha de emisión: ${escaparHtml(formatearFechaEs(factura.fechaEmision))}</p>
      <p>Fecha de vencimiento: ${escaparHtml(formatearFechaEs(factura.fechaVencimiento))}</p>
      ${filaFechaOperacion}
    </div>
  </header>

  <section class="factura-cliente">
    <h3>Cliente</h3>
    <p>${escaparHtml(factura.cliente.nombre)}</p>
    <p>NIF: ${escaparHtml(factura.cliente.nif)}</p>
    <p>${escaparHtml(factura.cliente.direccion)}</p>
  </section>

  <table class="factura-lineas">
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Cantidad</th>
        <th>Precio</th>
        <th>IVA</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>${filasLineas}
    </tbody>
  </table>

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

  <section class="factura-totales">
    <div class="factura-linea-total"><span>Base imponible</span><span>${formatearEuros(resultado.baseImponible)}</span></div>
    <div class="factura-linea-total"><span>Total IVA</span><span>${formatearEuros(resultado.totalIva)}</span></div>
    ${filaRecargo}
    ${filaRetencion}
    <div class="factura-total-destacado"><span>TOTAL</span><span>${formatearEuros(resultado.total)}</span></div>
  </section>

  <section class="factura-pago">
    ${filaFormaPago}
    ${filaIban}
  </section>

  ${pieMarca}
</article>
`;
}
