/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { useEffect } from "@odoo/owl";
import { ProductsWidget } from "@point_of_sale/app/screens/product_screen/product_list/product_list";

// El core de Odoo ya trae una busqueda server-side por name/default_code/barcode
// (ver ProductsWidget.loadProductFromDB), pero solo se dispara al presionar Enter.
// Mientras el usuario escribe, el POS solo filtra sobre el indice local (productos
// ya cacheados en el navegador) usando un algoritmo simple que no siempre coincide
// con lo que el servidor si encuentra (ej. frases de varias palabras en distinto
// orden al nombre real del producto, como "tornillo g8 5/8 x 3" contra
// "TORNILLO HEX 5/8 X 3 G8"). Este patch dispara la busqueda server-side
// automaticamente (con debounce) y muestra directamente los productos que el
// servidor encontro, sin depender de que el filtro local los reconozca.
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

    get productsToDisplay() {
        const original = super.productsToDisplay;

        const currentWord = (this.pos.searchProductWord || "").trim();
        if (
            !this.state.sgAutoSearchWord ||
            this.state.sgAutoSearchWord !== currentWord ||
            !this.state.sgAutoSearchIds ||
            !this.state.sgAutoSearchIds.length
        ) {
            return original;
        }

        const byId = new Map(original.map((p) => [p.id, p]));
        for (const id of this.state.sgAutoSearchIds) {
            if (!byId.has(id)) {
                const product = this.pos.db.get_product_by_id(id);
                if (product) {
                    byId.set(id, product);
                }
            }
        }

        return Array.from(byId.values()).sort((a, b) =>
            a.display_name.localeCompare(b.display_name)
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
        const currentWord = (this.pos.searchProductWord || "").trim();
        if (currentWord !== searchWord || this._sgLastAutoSearchWord === searchWord) {
            return;
        }
        this._sgLastAutoSearchWord = searchWord;

        this.state.currentOffset = 0;
        this.state.previousSearchWord = searchWord;

        try {
            const ids = await this.loadProductFromDB();
            this.state.sgAutoSearchWord = searchWord;
            this.state.sgAutoSearchIds = ids || [];
        } catch (error) {
            console.error("sg_pos_product_search: fallo la busqueda automatica", error);
        }
    },
});
