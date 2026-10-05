# CONTRATOS.md — SaborUPC 2.0

## Contrato común de montaje

Cada micro frontend funcional expone en `window` dos funciones públicas:

- `renderX(idContenedor)`: monta el micro frontend dentro del elemento indicado.
- `unmountX(idContenedor)`: desmonta y limpia sus recursos del contenedor.

| Micro frontend | Puerto | Render | Unmount |
|---|---:|---|---|
| Catálogo | 8081 | `renderCatalogo` | `unmountCatalogo` |
| Carrito | 8082 | `renderCarrito` | `unmountCarrito` |
| Perfil | 8083 | `renderPerfil` | `unmountPerfil` |
| Pedidos | 8084 | `renderPedidos` | `unmountPedidos` |

Cada carpeta incluye `contrato.html`, que carga su bundle y verifica automáticamente que ambas funciones existan.

## Eventos públicos

### `carrito:agregar`

**Productor:** MFE-Catálogo  
**Consumidor:** MFE-Carrito

```js
{
  id: number,
  nombre: string,
  precio: number
}
```

### `carrito:actualizado`

**Productor:** MFE-Carrito  
**Consumidor:** Contenedor

```js
{
  cantidad: number,
  total: number
}
```

### `pedido:confirmado`

**Productor:** MFE-Carrito  
**Consumidor:** MFE-Pedidos

Se emite al confirmar el carrito. El contrato incluye la versión del esquema:

```js
{
  id: string,
  total: number,
  items: [
    {
      id: number,
      nombre: string,
      precio: number,
      cantidad: number,
      subtotal: number
    }
  ],
  version: string
}
```

### `pedido:estado`

**Productor:** MFE-Pedidos  
**Consumidor:** Contenedor

Se emite al recibir el pedido y después de cada avance de estado:

```js
{
  id: string,
  estado: "Recibido" | "En preparación" | "En camino" | "Entregado",
  version: string
}
```

El estado avanza automáticamente cada **4 segundos** hasta `Entregado`.

### `usuario:cambio`

**Productor:** MFE-Perfil  
**Consumidor:** Contenedor

```js
{
  nombre: string
}
```

## Versionado

- MFE-Carrito: `2.0.0` para el nuevo contrato `pedido:confirmado`.
- MFE-Pedidos: `1.0.0` (usa Vue 3 global, sin compilación).
- La propiedad `version` viaja dentro de `pedido:confirmado` para permitir evolución del contrato.

## Tokens de diseño

`tokens.css` contiene exclusivamente variables CSS compartidas (`:root`). No contiene JavaScript ni lógica de aplicación. Cada micro frontend dispone de una copia idéntica para poder ejecutarse de forma independiente en su propio puerto.
