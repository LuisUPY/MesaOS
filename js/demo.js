/* La maestra pública es una demostración operativa con datos ficticios. */
(() => {
  'use strict';
  const source = globalThis.MesaInstallation;
  if (!source || source.ready || source.restaurant.id !== 'mesaos-template') return;
  const config = JSON.parse(JSON.stringify(source));
  config.ready = true;
  config.demo = true;
  Object.assign(config.restaurant, {
    id: 'mesaos-demo', name: 'MesaOS Demo',
    welcome: 'Explora tu restaurante.',
    tagline: 'Demostración interactiva · Datos ficticios',
    logo: 'assets/platform/mesaos-logo-transparent.png'
  });
  const names = {
    'Para compartir': ['Papas para compartir', 'Nachos de la casa'],
    'Aguas naturales': ['Agua de limón', 'Agua de jamaica'],
    'Bebidas rellenables': ['Café de olla', 'Té helado'],
    'Jugos nutritivos': ['Jugo verde', 'Jugo de naranja'],
    'Cafés': ['Americano', 'Cappuccino'],
    'Sin café': ['Chocolate caliente', 'Matcha latte'],
    'Lattes saborizados': ['Latte vainilla', 'Latte caramelo'],
    'Lattes Amor': ['Latte de la casa', 'Latte de temporada'],
    'Sodas italianas': ['Soda de fresa', 'Soda de maracuyá'],
    'Licuados': ['Licuado de plátano', 'Licuado de fresa'],
    'Frappés': ['Frappé de café', 'Frappé de chocolate'],
    'Malteadas': ['Malteada vainilla', 'Malteada chocolate'],
    'Pastas': ['Pasta Alfredo', 'Pasta al pesto'],
    'Hot cakes': ['Hot cakes clásicos', 'Hot cakes con frutos rojos'],
    'Toast': ['Toast de aguacate', 'Toast de champiñones'],
    'Sándwiches': ['Sándwich de pollo', 'Sándwich vegetariano'],
    'Croissants': ['Croissant de jamón y queso', 'Croissant de almendra'],
    'Huevos y omelettes': ['Omelette de queso', 'Huevos al gusto'],
    'Chilaquiles': ['Chilaquiles con pollo', 'Chilaquiles con huevo'],
    'Enchiladas suizas': ['Enchiladas verdes', 'Enchiladas rojas'],
    'Waffles': ['Waffle clásico', 'Waffle con frutas'],
    'Desayunos del día': ['Desayuno completo', 'Desayuno ligero']
  };
  for (const [macro, subs] of Object.entries(config.menu)) {
    for (const [sub, products] of Object.entries(subs)) {
      products.forEach((p, i) => {
        p.nombre = names[sub]?.[i] || `${sub} ${i + 1}`;
        p.precio = (macro === 'Bebidas' ? 45 : macro === 'Paquetes' ? 155 : 95) + i * 20;
        p.descripcion = 'Producto de demostración. Personalízalo y agrégalo a un pedido.';
        delete p.placeholder;
        p.opciones = [{ id: 'extras', nombre: 'Extras', tipo: 'multiple', requerido: false,
          valores: [{ id: 'extra', nombre: macro === 'Bebidas' ? 'Leche vegetal' : 'Queso extra', precioExtra: 15 }] }];
        if (sub === 'Chilaquiles') p.opciones.unshift({ id: 'salsa', nombre: 'Elige tu salsa', tipo: 'unica', requerido: true,
          valores: [{ id: 'verde', nombre: 'Verde', precioExtra: 0 }, { id: 'roja', nombre: 'Roja', precioExtra: 0 }] });
      });
    }
  }
  config.menu.Postres = { 'De la casa': [
    { id: 'demo-brownie', nombre: 'Brownie de chocolate', precio: 65, descripcion: 'Brownie de la casa.', opciones: [] },
    { id: 'demo-cheesecake', nombre: 'Cheesecake de frutos rojos', precio: 85, descripcion: 'Rebanada individual.', opciones: [] }
  ] };
  globalThis.MesaInstallation = config;
  globalThis.menuDB = config.menu;
  document.addEventListener('DOMContentLoaded', () => {
    const notice = document.getElementById('template-notice');
    notice.hidden = false;
    notice.replaceChildren();
    const intro = document.createElement('p');
    intro.textContent = 'DEMO INTERACTIVA · Prueba pedidos, cocina y barra, cobros, caja, propinas e historial. Los cambios se guardan solo en este navegador.';
    notice.append(intro);

  });
})();
