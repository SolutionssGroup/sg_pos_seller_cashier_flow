/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { PosStore } from "@point_of_sale/app/store/pos_store";

// Si el Punto de Venta tiene un cliente predeterminado configurado
// (sg_default_partner_id), se lo asignamos automaticamente a cada pedido
// nuevo que se crea (al abrir sesion, al iniciar una venta nueva, etc.),
// sin sobrescribir el cliente si el pedido ya tiene uno asignado.
patch(PosStore.prototype, {
    add_new_order() {
        const order = super.add_new_order(...arguments);

        const defaultPartnerId = this.config.sg_default_partner_id;
        if (defaultPartnerId && order && !order.get_partner()) {
            const partner = this.db.get_partner_by_id(defaultPartnerId);
            if (partner) {
                order.set_partner(partner);
            }
        }

        return order;
    },
});
