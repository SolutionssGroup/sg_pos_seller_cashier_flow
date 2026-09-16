/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { useEffect } from "@odoo/owl";
import { ProductsWidget } from "@point_of_sale/app/screens/product_screen/product_list/product_list";

// El core de Odoo ya trae una búsqueda server-side por name/default_code/barcode
// (ver ProductsWidget.loadProductFromDB), pero solo se dispara al presionar Enter.
// Mientras el usuario escribe, el POS solo filtra sobre el índice local (productos
// ya cacheados en el navegador), por lo que productos con referencia parcial
// (ej. "G8") no aparecen si aún no fueron cargados localmente.
//
// Este patch dispara esa misma búsqueda server-side automáticamente, con un
// pequeño debounce, para que el comportamiento sea equivalente al buscador de
// Inventario > Productos sin que el vendedor/cajero tenga que presionar Enter.
const SG_SEARCH_DEBOUNCE_MS = 400;

patch(ProductsWidget.prototype, {
    setup() {
        super.setup(...arguments);
        this._sgSearchTimeout = null;
        this._sgLastAutoSearchWord = "";

        useEffect(
            () => {
                this.sgScheduleAutoSearch();
                return () => {
                    if (this._sgSearchTimeout) {
                        clearTimeout(this._sgSearchTimeout);
                        this._sgSearchTimeout = null;
                    }
                };
            },
            () => [this.pos.searchProductWord]
        );
    },

    sgScheduleAutoSearch() {
        if (this._sgSearchTimeout) {
            clearTimeout(this._sgSearchTimeout);
            this._sgSearchTimeout = null;
        }

        const searchWord = (this.pos.searchProductWord || "").trim();
        if (!searchWord) {
            this._sgLastAutoSearchWord = "";
            return;
        }

        this._sgSearchTimeout = setTimeout(() => {
            this.sgRunAutoSearch(searchWord);
        }, SG_SEARCH_DEBOUNCE_MS);
    },

    async sgRunAutoSearch(searchWord) {
        // El usuario pudo seguir escribiendo mientras esperábamos el debounce;
        // si la palabra ya cambió, no hacemos nada (el próximo efecto se encarga).
        const currentWord = (this.pos.searchProductWord || "").trim();
        if (currentWord !== searchWord || this._sgLastAutoSearchWord === searchWord) {
            return;
        }
        this._sgLastAutoSearchWord = searchWord;

        // Reiniciamos el offset para que la búsqueda automática siempre traiga,
        // desde el servidor, los resultados de la palabra actual (mismo criterio
        // que usa el buscador de Inventario: name/default_code/barcode ilike).
        this.state.currentOffset = 0;
        this.state.previousSearchWord = searchWord;

        try {
            await this.loadProductFromDB();
        } catch (error) {
            // loadProductFromDB ya maneja sus propios errores de red (popup de
            // desconexión); solo registramos por si acaso para no romper el tipeo.
            console.error("sg_pos_product_search: fallo la búsqueda automática", error);
        }
    },
});
