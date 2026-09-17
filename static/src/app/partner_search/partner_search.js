/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { PartnerListScreen } from "@point_of_sale/app/screens/partner_list/partner_list";

// El core de Odoo ya trae una busqueda server-side por name/vat/email/phone/etc.
// (ver PartnerListScreen.searchPartner -> getNewPartners), que se dispara al
// presionar Enter y sí encuentra clientes reales que existen en la base. El
// problema es que lo que se muestra en pantalla (get partners()) depende de un
// filtro local separado (this.pos.db.search_partner), que puede no reconocer
// ese resultado aunque ya haya quedado cacheado localmente. Este patch guarda
// los IDs que devolvio la ultima busqueda al servidor y los mezcla con lo que
// el filtro local ya encontraba, sin depender de que el filtro local los
// reconozca.
patch(PartnerListScreen.prototype, {
    async searchPartner() {
        const result = await super.searchPartner(...arguments);

        this.state.sgSearchWord = (this.state.query || "").trim();
        this.state.sgSearchIds = (result || []).map((partner) => partner.id);

        return result;
    },

    get partners() {
        const original = super.partners;

        const currentQuery = (this.state.query || "").trim();
        if (
            !this.state.sgSearchWord ||
            this.state.sgSearchWord !== currentQuery ||
            !this.state.sgSearchIds ||
            !this.state.sgSearchIds.length
        ) {
            return original;
        }

        const byId = new Map(original.map((partner) => [partner.id, partner]));
        for (const id of this.state.sgSearchIds) {
            if (!byId.has(id)) {
                const partner = this.pos.db.get_partner_by_id(id);
                if (partner) {
                    byId.set(id, partner);
                }
            }
        }

        const merged = Array.from(byId.values());
        merged.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        // Igual que el core: el cliente ya seleccionado se muestra siempre de primero.
        if (this.state.selectedPartner) {
            const indexOfSelectedPartner = merged.findIndex(
                (partner) => partner.id === this.state.selectedPartner.id
            );
            if (indexOfSelectedPartner !== -1) {
                merged.splice(indexOfSelectedPartner, 1);
            }
            merged.unshift(this.state.selectedPartner);
        }

        return merged;
    },
});
