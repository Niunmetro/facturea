# Facturea

**Plantilla de factura de autónomo con IVA e IRPF**, en el navegador. Sin registro, sin backend: tus datos no salen de tu equipo.

**➜ Úsala aquí: https://niunmetro.github.io/facturea/**

- Cálculo correcto para España: IVA por línea (21/10/4/exenta con motivo impreso), retención de IRPF (7%/15%), recargo de equivalencia, desglose por tipo que siempre cuadra al céntimo.
- Validación de NIF/NIE/CIF en vivo.
- Numeración correlativa por año que no se repite (se consume al imprimir o guardar).
- PDF por impresión del navegador, con diseño profesional A4.
- Guarda emisor, clientes y facturas en tu propio navegador (gratis: 5; **Pro: ilimitadas**, logo y color, sin marca de agua, export/import).

## Desarrollo

```bash
npm install
npm run dev
npm test           # 106 tests (vitest)
npm run typecheck
npm run build      # → dist/ (base /facturea/ para GitHub Pages)
```

Stack: Vite + TypeScript estricto + Vitest. Sin dependencias de runtime. Lógica pura en `src/core/` con tests numéricos congelados.

## Monetización

Ver [MONETIZACION.md](MONETIZACION.md): licencia Pro vía Gumroad (con verificación de claves), afiliado de gestoría y AdSense, todo configurable en `src/config.ts`.

## Aviso legal

Facturea genera **documentos de factura** a partir de tus datos. No es un sistema informático de facturación certificado VERI*FACTU (RD 1007/2023) ni un registro de facturación. Comprueba tus obligaciones o consulta a tu gestoría.

---

Construido de forma autónoma por [FORJA](https://github.com/Niunmetro/forja) (motor multi-agente) en dos runs nocturnos: v1 (13 tareas) + v2 con los hallazgos de una auditoría fiscal/UX/SEO multi-agente (12 tareas).
