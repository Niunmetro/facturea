import type { FacturaGuardada } from "../core/types";
import { listarFacturas, borrarFactura, LIMITE_FREE } from "../core/almacen";
import { PRO_URL } from "../config";

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
        <span class="historial-fecha">${escaparHtml(f.fechaEmision)}</span>
        <button type="button" class="historial-cargar" data-accion="cargar" data-numero="${escaparHtml(f.numero)}">Cargar</button>
        <button type="button" class="historial-duplicar" data-accion="duplicar" data-numero="${escaparHtml(f.numero)}">Duplicar</button>
        <button type="button" class="historial-borrar" data-accion="borrar" data-numero="${escaparHtml(f.numero)}">Borrar</button>
      </li>`;
      })
      .join("");

    const cta = enLimite
      ? `<a class="historial-cta-pro" href="${escaparHtml(PRO_URL)}">Pasa a Pro para guardar más facturas</a>`
      : "";

    root.innerHTML = `
      <div class="historial">
        <div class="historial-contador">${total}/${LIMITE_FREE}</div>
        <ul class="historial-lista">${filas}</ul>
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
