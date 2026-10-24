/* Semilla aislada: usa las mismas operaciones de pedidos y caja que la aplicación. */
(() => {
  'use strict';
  if (!globalThis.MesaInstallation?.demo) return;
  try {
    if (localStorage.getItem(AmorStorage.KEY) !== null) return;
    const state = AmorStorage.vacio();
    const now = Date.now();
    const at = minutes => new Date(now - minutes * 60000).toISOString();
    const product = id => AmorPOS.crearPartida(id);
    state.caja = AmorCash.abrirCaja(state.caja, '500', at(1500));
    let previous = AmorOrders.nuevoPedido([product('demo-brownie')], 'Venta de ejemplo', 1, at(1490));
    previous = AmorOrders.marcarPartida(previous, 'todos', 'preparado', at(1485));
    const paid = AmorCash.cobrarPartidas(previous, 'todos', state.caja, 'efectivo', at(1480));
    state.pedidos.push(paid.pedido);
    const closed = AmorCash.cerrarCaja(paid.caja, at(1470), state.pedidos);
    state.historialCortes.push(closed.corte);
    state.caja = AmorCash.abrirCaja(closed.caja, '500', at(60));
    let today = AmorOrders.nuevoPedido([product('demo-cheesecake')], 'Venta del turno', 2, at(50));
    today = AmorOrders.marcarPartida(today, 'todos', 'preparado', at(45));
    const payment = AmorCash.cobrarPartidas(today, 'todos', state.caja, 'tarjeta', at(40));
    state.pedidos.push(payment.pedido);
    state.caja = AmorCash.registrarGasto(payment.caja, '30', 'Hielo · ejemplo', at(35));
    state.caja = AmorCash.registrarPropina(state.caja, '20', 'separado', at(30));
    const food = Object.values(menuDB.Alimentos).flat()[0];
    const drink = Object.values(menuDB.Bebidas).flat()[0];
    state.pedidos.push(AmorOrders.nuevoPedido([product(food.id), product(drink.id)], 'Mesa 1', 3, at(15)));
    const delivery = AmorOrders.nuevoPedido([product('demo-brownie'), product(drink.id)], 'Delivery #1', 4, at(10));
    state.pedidos.push(AmorOrders.marcarPartida(delivery, 'todos', 'preparado', at(5)));
    state.siguienteNumero = 5; state.siguienteDelivery = 2;
    AmorStorage.guardarExpediente(state);
  } catch (error) {
    console.warn('No se pudieron cargar los ejemplos de la demo:', error.message);
  }
})();
