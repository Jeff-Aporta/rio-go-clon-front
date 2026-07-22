<p align="center">
  <img src="https://api.iconify.design/mdi/hamburger.svg?color=%23f5a623&width=96&height=96" width="96" height="96" alt="RIO GO 24" />
</p>

<h1 align="center">rio-go-clon-front</h1>

<p align="center"><strong>RIO GO 24</strong> — carta digital, carrito y pedidos online (clon storefront).</p>

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f?logo=githubpages&logoColor=white)](https://jeff-aporta.github.io/rio-go-clon-front/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Demo

**https://jeff-aporta.github.io/rio-go-clon-front/**

API: [rio-go-clon.jeffaporta.workers.dev](https://rio-go-clon.jeffaporta.workers.dev) · backend: [`rio-go-clon-back`](https://github.com/Jeff-Aporta/rio-go-clon-back) (privado)

## Qué hace

- Catálogo con categorías, búsqueda y cards
- Carrito + checkout domicilio + pedido por WhatsApp
- Seguimiento de pedido (`?s=` nav state)
- Panel admin (`?v=adm`) — productos e imágenes
- Tema claro/oscuro + marca desde `/api/brand`
- UI **Shoelace** + **Iconify**

## Config

`config.json`:

```json
{
  "apiBase": "https://rio-go-clon.jeffaporta.workers.dev",
  "storagePrefix": "storefront"
}
```

Override en runtime:

```js
localStorage.setItem("storefront:api", "http://127.0.0.1:8805");
```

El catálogo se pide con **`QUERY /api/catalog`** (filtro ISS).

## Desarrollo

```bash
npm ci
npm run build:check
npx serve .   # o Live Server en la raíz del front
```

Push a `main` → workflow **GitHub Pages** construye `_dist` y publica.

## Stack

React 18 · TypeScript · esbuild · Shoelace · GitHub Pages
