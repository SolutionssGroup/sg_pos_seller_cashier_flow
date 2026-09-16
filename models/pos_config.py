from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    sg_pos_flow_role = fields.Selection(
        [
            ("seller", "Vendedores"),
            ("cashier", "Caja"),
        ],
        string="Rol flujo POS",
        help="Define si este Punto de Venta funciona como vendedor o como caja.",
    )
    sg_default_partner_id = fields.Many2one(
        "res.partner",
        string="Cliente predeterminado",
        help="Cliente que se asigna automaticamente a cada pedido nuevo al abrir sesion en este Punto de Venta.",
    )
