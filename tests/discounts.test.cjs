const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
  const data = new Map();
  const ctx = vm.createContext({ Intl, localStorage: { getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v) } });
  for (const file of ['menuData','orderCore','orders','history','cash','storage']) vm.runInContext(fs.readFileSync(`js/${file}.js`, 'utf8'), ctx);
  return ctx;
}
const fecha = '2026-10-21T16:00:00Z';
test('reparte descuento proporcional al centavo, reemplaza y retira sin alterar precios', () => {
  const { AmorPOS:p, AmorOrders:o } = setup();
  const original = o.nuevoPedido([p.crearExtra('A','0.01'),p.crearExtra('B','0.01'),p.crearExtra('C','0.01')], 'Mesa 1', 1, fecha);
  const ticket = o.aplicarDescuento(original, 'porcentaje', '50');
  assert.equal(original.totalCentavos, 3);
  assert.equal(ticket.totalCentavos, 1);
  assert.deepEqual(Array.from(ticket.partidas, x => x.descuentoCentavos || 0), [1,1,0]);
  assert.equal(o.aplicarDescuento(ticket, 'monto', '0.01').totalCentavos, 2);
  assert.equal(o.aplicarDescuento(ticket, 'monto', '0').totalCentavos, 3);
  for (const value of ['-1','101','NaN','1.001']) assert.throws(() => o.aplicarDescuento(original, 'porcentaje', value));
  assert.throws(() => o.aplicarDescuento(original, 'monto', '0.04'), /superar/);
  assert.throws(() => o.agregarPartidas(ticket,[p.crearExtra('D','1')]), /Quita el descuento/);
  assert.throws(() => o.eliminarPartida(ticket,ticket.partidas[0].id), /Quita el descuento/);
  assert.throws(() => p.totalPedido([{cantidad:1,precioUnitarioCentavos:100,descuentoCentavos:101}]), /Descuento/);
});
test('cobros parciales mixtos, historial, persistencia y cierre usan el importe descontado', () => {
  const { AmorPOS:p, AmorOrders:o, AmorCash:c, AmorHistory:h, AmorStorage:s } = setup();
  let ticket = o.nuevoPedido([p.crearExtra('A','100'),p.crearExtra('B','200')], 'Mesa 1', 1, fecha);
  ticket = o.aplicarDescuento(ticket, 'porcentaje', '10');
  const caja = c.abrirCaja(c.cajaVacia(), '0', fecha);
  let cobro = c.cobrarPartidas(ticket, ticket.partidas[0].id, caja, {efectivoRecibido:'100',montoTarjeta:'0'}, fecha);
  assert.equal(cobro.montoCentavos, 9000);
  assert.equal(cobro.cambioCentavos, 1000);
  assert.throws(() => o.aplicarDescuento(cobro.pedido,'monto','0'), /primer cobro/);
  cobro = c.cobrarPartidas(cobro.pedido, 'todos', cobro.caja, {efectivoRecibido:'80',montoTarjeta:'100'}, fecha);
  assert.equal(cobro.pedido.totalCentavos, 27000);
  assert.equal(c.resumirCaja(cobro.caja,[cobro.pedido]).totalVentasCentavos, 27000);
  assert.equal(h.resumirDia([cobro.pedido], '2026-10-21').totalCentavos,27000);
  const state = s.vacio(); state.pedidos=[cobro.pedido]; state.caja=cobro.caja; state.siguienteNumero=2;
  s.guardarExpediente(state);
  assert.equal(s.cargarExpediente().pedidos[0].totalCentavos,27000);
  const cerrado = c.cerrarCaja(cobro.caja, fecha, [cobro.pedido]);
  assert.equal(cerrado.corte.totalVentasCentavos,27000);
});
test('descuento del 100% liquida la cuenta sin crear ingresos de caja', () => {
  const { AmorPOS:p, AmorOrders:o, AmorCash:c, AmorStorage:s } = setup();
  let ticket = o.nuevoPedido([p.crearExtra('Cortesía','50')], 'Mesa 1', 1, fecha);
  ticket = o.aplicarDescuento(ticket,'porcentaje','100');
  const cobro = c.cobrarPartidas(ticket,'todos',c.abrirCaja(c.cajaVacia(),'0',fecha), {efectivoRecibido:'0',montoTarjeta:'0'}, fecha);
  assert.equal(cobro.pedido.estado,'PAGADO');
  assert.equal(c.resumirCaja(cobro.caja,[cobro.pedido]).totalVentasCentavos,0);
  const state = s.vacio(); state.pedidos=[cobro.pedido]; state.caja=cobro.caja; state.siguienteNumero=2;
  s.guardarExpediente(state);
  assert.equal(s.cargarExpediente().pedidos[0].totalCentavos,0);
});
