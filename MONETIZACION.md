# Facturea — Guía de monetización (20 min de tu tiempo, luego pasivo)

Modelo freemium: la app es gratis (5 facturas guardadas) y **Pro se desbloquea con una clave de licencia** que se vende en Gumroad. Todo el gating ya está programado.

## 1. Crear el producto Pro en Gumroad — ~15 min (el paso que da dinero)
1. Entra en https://gumroad.com con tu cuenta (o créala) → New product → tipo "Digital product".
2. Nombre: "Facturea Pro — licencia anual". Precio sugerido: **29 €/año** (ya es el precio ancla que muestra la web; si lo cambias, actualiza `PRECIO_PRO` en `src/config.ts`).
3. En la configuración del producto activa **"Generate a unique license key per sale"** (Gumroad las genera y valida él solo).
4. Copia la URL del producto → pégala en `src/config.ts` como `PRO_URL`.
5. Copia el **product ID** de Gumroad → pégalo en `GUMROAD_PRODUCT_ID` (la app verificará las claves contra la API de Gumroad; sin ID, acepta claves con formato válido).
6. Commit + push → el deploy es automático al reconstruir la rama `gh-pages`.

El comprador recibe su clave de Gumroad, la pega en la sección Pro de la web y queda desbloqueado. Sin backend tuyo, sin soporte.

## 2. Afiliado de gestoría — ~5 min
El CTA "¿Prefieres que facture otro por ti?" apunta a `AFILIADO_GESTORIA_URL` en `src/config.ts`. Programas que pagan bien en España: **Declarando** (afiliación propia), **TaxDown**, **Xolo** — o cualquier gestoría online con programa en Awin. Un alta referida paga 20-80 €.

## 3. AdSense (opcional, ingresos por visitas)
Huecos `#ad-top` y `#ad-bottom` en `index.html` (ocultos hasta pegar el snippet). Con el SEO de "plantilla factura autónomo" el tráfico crece solo.

## 4. SEO — 5 min
Alta en Google Search Console y enviar `https://niunmetro.github.io/facturea/sitemap.xml`. Dominio propio opcional (facturea.es, ~10 €/año) → cambiar `base` en `vite.config.ts` a "/" y el canonical en index.html.

## ⚖️ Nota legal importante (ya resuelta en el producto)
Facturea se posiciona como **generador de plantillas/documentos**, NO como sistema de facturación certificado VERI*FACTU (RD 1007/2023). El aviso legal está visible en la web. **No cambies el copy hacia "software de facturación certificado"** sin implementar los requisitos del reglamento (hash encadenado, QR AEAT): venderlo como tal sin serlo acarrea sanciones al productor.

## Dónde está todo
- Config: `src/config.ts` (PRO_URL, GUMROAD_PRODUCT_ID, PRECIO_PRO, AFILIADO_GESTORIA_URL).
- Deploy: rama `gh-pages` (build de `dist/` con `npm run build`).
