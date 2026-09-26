import type { FacturaGuardada } from "../core/types";
import { listarFacturas, borrarFactura, LIMITE_FREE } from "../core/almacen";
import { PRO_URL } from "../config";
import { formatearFechaEs } from "../core/formato";

export interface HistorialAPI {
  refrescar(): void;
}

export interface HistorialDeps {
  esPro: () => boolean;
  onCargar: (f: FacturaGuardada) => void;
  onDuplicar: (f: FacturaGuardada) => void;
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function montarHistorial(root: HTMLElement, deps: HistorialDeps): HistorialAPI {
  function render(): void {
    const facturas = listarFacturas();
    const esPro = deps.esPro();
    const total = facturas.length;
    const enLimite = !esPro && total >= LIMITE_FREE;

    const filas = facturas
      .map((f) => {
        return `
      <li class="historial-item" data-numero="${escaparHtml(f.numero)}">
        <span class="historial-numero">${escaparHtml(f.numero)}</span>
        <span class="historial-cliente">${escaparHtml(f.cliente.nombre)}</span>
        <span class="historial-fecha">${escaparHtml(f.fechaEmision ? formatearFechaEs(f.fechaEmision) : "")}</span>
        <span class="historial-acciones">
          <button type="button" class="historial-cargar" data-accion="cargar" data-numero="${escaparHtml(f.numero)}" aria-label="Cargar factura ${escaparHtml(f.numero)}">Cargar</button>
          <button type="button" class="historial-duplicar" data-accion="duplicar" data-numero="${escaparHtml(f.numero)}" aria-label="Duplicar factura ${escaparHtml(f.numero)}">Duplicar</button>
          <button type="button" class="historial-borrar" data-accion="borrar" data-numero="${escaparHtml(f.numero)}" aria-label="Borrar factura ${escaparHtml(f.numero)}">Borrar</button>
        </span>
      </li>`;
      })
      .join("");

    const porcentaje = Math.min(100, Math.round((total / LIMITE_FREE) * 100));
    const contadorHtml = esPro
      ? ""
      : `<div class="historial-contador"><span>Plan gratuito</span><span><strong>${total}/${LIMITE_FREE}</strong> facturas</span><span class="historial-progreso" role="progressbar" aria-label="Facturas guardadas del plan gratuito" aria-valuemin="0" aria-valuemax="${LIMITE_FREE}" aria-valuenow="${total}"><span style="width: ${porcentaje}%"></span></span></div>`;

    const cta = enLimite
      ? `<a class="historial-cta-pro" href="${escaparHtml(PRO_URL)}">Has llegado a las 5 facturas gratis — Facturea Pro guarda ilimitadas</a>`
      : "";

    const contenido = filas ? filas : '<li class="historial-vacio"><strong>Aún no has guardado ninguna factura</strong>Pulsa «Guardar» y aparecerán aquí para cargarlas o duplicarlas.</li>';

    root.innerHTML = `
      <div class="historial">
        ${contadorHtml}
        <ul class="historial-lista">${contenido}</ul>
        ${cta}
      </div>`;

    root.querySelectorAll<HTMLButtonElement>("button[data-accion]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const numero = boton.getAttribute("data-numero");
        if (numero === null) return;
        const accion = boton.getAttribute("data-accion");
        const factura = listarFacturas().find((f) => f.numero === numero);
        if (!factura) return;

        if (accion === "cargar") {
          deps.onCargar(factura);
        } else if (accion === "duplicar") {
          deps.onDuplicar(factura);
        } else if (accion === "borrar") {
          borrarFactura(numero);
          render();
        }
      });
    });
  }

  render();

  return {
    refrescar: render,
  };
}
