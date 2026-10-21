const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
function setup() {
 const ctx=vm.createContext({Intl});
 for (const file of ['menuData','orderCore','orders']) vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'),ctx);
 return ctx;
}
test('notas distinguen productos iguales y se pueden quitar sin perder cantidades o precios',()=>{
 const {AmorPOS:p}=setup();
 const base=p.crearPartida('hot-cakes-clasicos');
 let lines=[base];
 const before=JSON.stringify(lines);
 lines=p.actualizarNota(lines,base.clave,'  Sin miel  ');
 assert.equal(JSON.stringify([base]),before);
 assert.equal(lines[0].nota,'Sin miel');
 assert.notEqual(lines[0].clave,base.clave);
 lines.push(p.crearPartida('hot-cakes-clasicos'));
 assert.equal(lines.length,2);
 const total=p.totalPedido(lines);
 lines=p.actualizarNota(lines,lines[0].clave,'');
 assert.equal(lines.length,1); assert.equal(lines[0].cantidad,2);
 assert.equal(p.totalPedido(lines),total);
 assert.throws(()=>p.actualizarNota(lines,lines[0].clave,'x'.repeat(201)),/200/);
 assert.throws(()=>p.actualizarNota(lines,'inexistente','Sin sal'),/ya no/);
});
test('notas conservan extras, opciones y límites de cantidad',()=>{
 const {AmorPOS:p,AmorOrders:o}=setup();
 const extra=p.crearExtra('Extra','15.50');
 const updated=p.actualizarNota([extra],extra.clave,'Servir aparte')[0];
 assert.equal(updated.precioUnitarioCentavos,1550);
 assert.equal(p.crearExtra(updated.nombre,updated.precioUnitario,updated.nota).clave,updated.clave);
 const coffee=p.crearPartida('cafe-americano',{extras:['leche-deslactosada']});
 const noted=p.actualizarNota([coffee],coffee.clave,'Muy caliente')[0];
 assert.equal(JSON.stringify(noted.selecciones),JSON.stringify(coffee.selecciones));
 assert.equal(noted.precioUnitarioCentavos,coffee.precioUnitarioCentavos);
 const order=o.nuevoPedido([noted,updated],'Mesa 1',1);
 assert.equal(order.partidas[0].nota,'Muy caliente');
 assert.equal(order.partidas[1].nota,'Servir aparte');
 const max={...coffee,cantidad:99};
 assert.throws(()=>p.actualizarNota([max,noted],noted.clave,''),/99/);
});
