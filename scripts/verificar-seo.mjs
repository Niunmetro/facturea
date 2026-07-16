import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, "..");

const html = readFileSync(path.join(raiz, "index.html"), "utf8");
const css = readFileSync(path.join(raiz, "src", "styles.css"), "utf8");

const errores = [];

const idsRequeridos = [
  "app",
  "zona-formulario",
  "zona-vista",
  "zona-historial",
  "zona-pro",
  "barra-total",
  "btn-guardar",
  "btn-descargar",
  "ad-top",
  "ad-bottom",
];

for (const id of idsRequeridos) {
  const patron = new RegExp(`id=["']${id}["']`);
  if (!patron.test(html)) {
    errores.push(`Falta el id "${id}" en index.html`);
  }
}

const canonicalEsperado = "https://niunmetro.github.io/facturea/";
const canonicalMatch = html.match(
  /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/
);
if (!canonicalMatch || canonicalMatch[1] !== canonicalEsperado) {
  errores.push(
    `El canonical debe ser exactamente "${canonicalEsperado}" (encontrado: ${
      canonicalMatch ? canonicalMatch[1] : "ninguno"
    })`
  );
}

const jsonLdMatch = html.match(
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/
);
if (!jsonLdMatch) {
  errores.push("Falta el <script type=\"application/ld+json\"> con el FAQPage");
} else {
  let datos;
  try {
    datos = JSON.parse(jsonLdMatch[1]);
  } catch (e) {
    errores.push(`El JSON-LD no es JSON válido: ${e.message}`);
  }
  if (datos) {
    const preguntas = Array.isArray(datos.mainEntity) ? datos.mainEntity : [];
    const numPreguntas = preguntas.filter((p) => p["@type"] === "Question").length;
    if (numPreguntas !== 6) {
      errores.push(
        `El JSON-LD FAQPage debe tener exactamente 6 Question (encontradas: ${numPreguntas})`
      );
    }
  }
}

if (!css.includes("@media print")) {
  errores.push("styles.css no contiene '@media print'");
}

if (!css.includes(".factura-print")) {
  errores.push("styles.css no contiene la clase '.factura-print'");
}

if (errores.length > 0) {
  console.error("Fallos de verificación SEO:");
  for (const e of errores) {
    console.error(` - ${e}`);
  }
  process.exit(1);
}

console.log("Verificación SEO OK");
process.exit(0);
