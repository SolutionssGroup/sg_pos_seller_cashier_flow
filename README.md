# POS Seller / Cashier Flow

Módulo para Odoo 17 que implementa un flujo de trabajo entre **Vendedores** y **Caja**, permitiendo que los vendedores preparen pedidos y los envíen a caja para el cobro, manteniendo el control de las ubicaciones de inventario utilizadas en el despacho.

## Características

### Flujo Vendedor / Caja

- Configuración del Punto de Venta como:
  - Vendedores
  - Caja
- Los vendedores preparan pedidos sin cobrar.
- Los pedidos se envían a Caja.
- Caja recibe únicamente los pedidos pendientes para finalizar el cobro.

---

## Pedidos Pendientes

- Lista de pedidos enviados desde vendedores.
- Muestra:
  - Número de pedido.
  - Nombre del cliente escrito por el vendedor.
- Un pedido solo puede estar abierto en una Caja al mismo tiempo.
- Si el cajero elimina completamente el pedido del carrito, este vuelve automáticamente a la lista de pendientes.

---

## Nombre del Cliente

Los vendedores pueden escribir el nombre del cliente antes de enviar el pedido a Caja.

Este nombre se muestra posteriormente en la lista de pedidos pendientes para facilitar la identificación del cliente.

---

## Manejo de Ubicaciones

Durante la preparación del pedido:

- El vendedor visualiza:
  - Ubicación sugerida.
  - Cantidad disponible.
- Caja no muestra esta información.

Al confirmar la venta:

- El descuento de inventario se realiza exactamente desde la ubicación seleccionada por el vendedor.

---

## Prioridad de Picking POS

Se agrega un campo en las ubicaciones de inventario:

**Prioridad de Picking POS**

Este campo permite indicar cuál ubicación debe utilizarse primero durante el despacho.

Ejemplo:

| Ubicación | Prioridad |
|-----------|----------:|
| DESPACHO | 1 |
| T1 | 10 |
| T2 | 20 |
| T3 | 30 |
| Reserva | 100 |

Mientras menor sea el número, mayor prioridad tendrá la ubicación.

---

## Búsqueda de Productos

El buscador del POS permite localizar productos por:

- Nombre
- Referencia interna
- Código de barras
- Variantes

---

## Configuración

En cada Punto de Venta existe el campo:

**Flujo Vendedores / Caja**

Opciones:

- Vendedores
- Caja

Este parámetro determina el comportamiento del POS.

---

## Compatibilidad

- Odoo 17
- POS
- Inventario

---

## Desarrollado por

**Solutions Group**
