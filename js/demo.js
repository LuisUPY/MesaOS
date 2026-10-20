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
  const images = {
    "Para compartir": [
      "assets/img/demo/papas.png",
      "assets/img/demo/nachos.png"
    ],
    "Aguas naturales": [
      "assets/img/demo/agua-limon.png",
      "assets/img/demo/agua-jamaica.png"
    ],
    "Bebidas rellenables": [
      "assets/img/demo/cafe-olla.png",
      "assets/img/demo/te-helado.png"
    ],
    "Jugos nutritivos": [
      "assets/img/demo/jugo-verde.png",
      "assets/img/demo/jugo-naranja.png"
    ],
    "Cafés": [
      "assets/img/demo/americano.png",
      "assets/img/demo/cappuccino.png"
    ],
    "Sin café": [
      "assets/img/demo/chocolate-caliente.png",
      "assets/img/demo/matcha.png"
    ],
    "Lattes saborizados": [
      "assets/img/demo/latte-vainilla.png",
      "assets/img/demo/latte-caramelo.png"
    ],
    "Lattes Amor": [
      "assets/img/demo/latte-casa.png",
      "assets/img/demo/latte-temporada.png"
    ],
    "Sodas italianas": [
      "assets/img/demo/soda-fresa.png",
      "assets/img/demo/soda-maracuya.png"
    ],
    "Licuados": [
      "assets/img/demo/licuado-platano.png",
      "assets/img/demo/licuado-fresa.png"
    ],
    "Frappés": [
      "assets/img/demo/frappe-cafe.png",
      "assets/img/demo/frappe-chocolate.png"
    ],
    "Malteadas": [
      "assets/img/demo/licuado-platano.png",
      "assets/img/demo/frappe-chocolate.png"
    ],
    "Pastas": [
      "assets/img/demo/pasta-alfredo.png",
      "assets/img/demo/pasta-pesto.png"
    ],
    "Hot cakes": [
      "assets/img/demo/hotcakes.png",
      "assets/img/demo/hotcakes-frutos.png"
    ],
    "Toast": [
      "assets/img/demo/toast-aguacate.png",
      "assets/img/demo/toast-casa.png"
    ],
    "Sándwiches": [
      "assets/img/demo/sandwich-pollo.png",
      "assets/img/demo/sandwich-vegetariano.png"
    ],
    "Croissants": [
      "assets/img/demo/croissant-jamon.png",
      "assets/img/demo/croissant.png"
    ],
    "Huevos y omelettes": [
      "assets/img/demo/omelette.png",
      "assets/img/demo/huevos.png"
    ],
    "Chilaquiles": [
      "assets/img/demo/chilaquiles.png",
      "assets/img/demo/chilaquiles.png"
    ],
    "Enchiladas suizas": [
      "assets/img/demo/enchiladas.png",
      "assets/img/demo/enchiladas.png"
    ],
    "Waffles": [
      "assets/img/demo/waffle.png",
      "assets/img/demo/waffle-frutas.png"
    ],
    "Desayunos del día": [
      "assets/img/demo/desayuno-completo.png",
      "assets/img/demo/desayuno-ligero.png"
    ]
  };
  for (const [macro, subs] of Object.entries(config.menu)) {
    for (const [sub, products] of Object.entries(subs)) {
      products.forEach((p, i) => {
        p.nombre = names[sub]?.[i] || `${sub} ${i + 1}`;
        p.precio = (macro === 'Bebidas' ? 45 : macro === 'Paquetes' ? 155 : 95) + i * 20;
        p.imagen = images[sub]?.[i];
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
    { id: 'demo-brownie', nombre: 'Brownie de chocolate', imagen: 'assets/img/demo/brownie.png', precio: 65, descripcion: 'Brownie de la casa.', opciones: [] },
    { id: 'demo-cheesecake', nombre: 'Cheesecake de frutos rojos', imagen: 'assets/img/demo/cheesecake.png', precio: 85, descripcion: 'Rebanada individual.', opciones: [] }
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
