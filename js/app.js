(() => {
  'use strict';
  const { catalogo, dinero, centavos, buscar, crearPartida, crearExtra, totalPedido } = AmorPOS;
  const $ = id => document.getElementById(id);
  const state = { macro: Object.hasOwn(menuDB,'Alimentos') ? 'Alimentos' : Object.keys(menuDB)[0] || null, subcategoria: 'todos', busqueda: '', partidas: [], producto: null, preajuste: '', pedidoDestinoId: null };
  let expediente;
  let storageError = '';
  let salesUI = null;
  let cashUI = null;
  let noteLineKey = null;
  try { expediente = AmorStorage.cargarExpediente(); }
  catch (error) { expediente = AmorStorage.vacio(); storageError = error.message; }
  const icons = {
    Entradas: '<path d="M4 10h16v3a8 8 0 0 1-16 0zM2 10h20M7 3v3m5-3v3m5-3v3"/>',
    Bebidas: '<path d="M5 8h12v7a6 6 0 0 1-12 0zM17 9h2a3 3 0 0 1 0 6h-2M3 22h17M8 2v3m5-3v3"/>',
    Alimentos: '<circle cx="12" cy="12" r="7"/><path d="M2 3v6m-1-6v4h2V3M2 9v12M22 3c-3 4-3 8 0 8v10M22 3v8"/>',
    Postres: '<path d="M4 12h16v9H4zM3 12c0-3 3-5 5-5h8c2 0 5 2 5 5M4 17h16M12 3v4"/><path d="M12 1c-2 2-2 3 0 3s2-1 0-3"/>',
    Paquetes: '<path d="m3 7 9-4 9 4-9 4zM3 7v12l9 4 9-4V7M12 11v12M7 5l10 4"/>',
    options: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    write: '<path d="M13 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 3l5 5M9 15l1-5L18 2l4 4-8 8z"/>',
    bag: '<path d="M5 8h14l2 13H3zM8 9V6a4 4 0 0 1 8 0v3"/>'
  };
  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }
  function icon(name) {
    const wrapper = element('span');
    wrapper.setAttribute('aria-hidden', 'true');
    // Solo SVG de la colección fija local, nunca contenido del menú o del usuario.
    wrapper.innerHTML = `<svg viewBox="0 0 24 24">${icons[name] || icons.Alimentos}</svg>`;
    return wrapper.firstElementChild;
  }
  function button(label, className, onClick) {
    const node = element('button', className, label);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }
  let toastTimer;
  let gridColumns = 2;
  function updateGridColumns(amount) {
    gridColumns = Math.max(2, Math.min(5, gridColumns + amount));
    $('product-grid').style.setProperty('--product-columns', gridColumns);
    $('product-grid').dataset.columns = String(gridColumns);
    $('grid-columns').textContent = gridColumns;
    $('grid-columns').setAttribute('aria-label', `${gridColumns} productos por fila`);
    $('grid-less').disabled = gridColumns === 2;
    $('grid-more').disabled = gridColumns === 5;
  }
  $('grid-less').addEventListener('click', () => updateGridColumns(-1));
  $('grid-more').addEventListener('click', () => updateGridColumns(1));
  function notify(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2800);
  }

  function saveDraft() {
    return commit(currentState());
  }
  function etiquetaActual() {
    return state.preajuste ? state.preajuste + ($('order-label').value ? ` · ${$('order-label').value}` : '') : $('order-label').value;
  }
  function restaurarEtiqueta(etiqueta) {
    const match = etiqueta.match(/^(Mesa [1-8]|Mostrador|Delivery)(?: · (.*))?$/s);
    state.preajuste = match ? match[1] : '';
    $('order-label').value = match ? match[2] || '' : etiqueta;
    actualizarPreajustes();
  }
  function actualizarPreajustes() {
    const delivery = `Delivery #${expediente.siguienteDelivery}`;
    for (const preset of $('order-label-presets').children) {
      const etiqueta = preset.dataset.etiqueta;
      preset.setAttribute('aria-pressed', String(etiqueta === state.preajuste));
      preset.textContent = etiqueta === 'Delivery' ? delivery : etiqueta;
      const ocupado = etiqueta.startsWith('Mesa ') ? AmorOrders.pedidoConEtiqueta(expediente.pedidos, etiqueta) : null;
      preset.disabled = !!ocupado;
      const descripcion = ocupado ? `${etiqueta} está ocupada por el pedido N° ${ocupado.numero}. Ábrelo en Pedidos abiertos para añadir productos.` : '';
      preset.title = descripcion;
      if (descripcion) preset.setAttribute('aria-description', descripcion);
      else preset.removeAttribute('aria-description');
    }
    const etiqueta = state.preajuste === 'Delivery' ? delivery : state.preajuste;
    $('order-label').maxLength = etiqueta ? 60 - etiqueta.length - 3 : 60;
  }
  function renderPreajustes() {
    $('order-label-presets').replaceChildren(...[...Array.from({ length: 7 }, (_, i) => `Mesa ${i + 1}`), 'Mostrador', 'Delivery'].map(etiqueta => {
      const preset = button(etiqueta, 'label-preset', () => {
        state.preajuste = etiqueta;
        $('order-label').value = '';
        actualizarPreajustes();
        $('order-label').value = $('order-label').value.slice(0, $('order-label').maxLength);
        saveDraft();
      });
      preset.dataset.etiqueta = etiqueta;
      preset.setAttribute('aria-label', etiqueta);
      return preset;
    }));
    actualizarPreajustes();
  }
  function currentState() {
    const next = JSON.parse(JSON.stringify(expediente));
    if (state.pedidoDestinoId) next.adicion = { pedidoId: state.pedidoDestinoId, partidas: state.partidas };
    else next.borrador = { etiqueta: etiquetaActual(), partidas: state.partidas };
    return JSON.parse(JSON.stringify(next));
  }
  function commit(next) {
    try {
      if (storageError) throw new Error(storageError);
      const saved = AmorStorage.guardarExpediente(next);
      expediente = saved;
      state.pedidoDestinoId = saved.adicion?.pedidoId || null;
      state.partidas = saved.adicion ? saved.adicion.partidas : saved.borrador.partidas;
      if (etiquetaActual() !== saved.borrador.etiqueta) restaurarEtiqueta(saved.borrador.etiqueta);
      $('storage-status').textContent = 'Expediente guardado en este navegador';
      renderOrder(); salesUI?.renderAll(); cashUI?.renderAll();
      return true;
    } catch (error) {
      $('storage-status').textContent = 'No se pudo guardar el expediente';
      notify(`No se guardó: ${error.message}`);
      return false;
    }
  }
  function reloadExpediente() {
    try {
      expediente = AmorStorage.cargarExpediente();
      storageError = '';
      cashUI?.renderAll();
      return true;
    } catch (error) { notify(`No se pudo cargar: ${error.message}`); return false; }
  }
  function restoreDraft() {
      state.partidas = [];
      state.pedidoDestinoId = expediente.adicion?.pedidoId || null;
      let descartadas = 0;
      for (const stored of (expediente.adicion || expediente.borrador).partidas) {
        try {
          const partida = stored.tipo === 'extra' ? crearExtra(stored.nombre, stored.precioUnitarioCentavos / 100, stored.nota) : crearPartida(stored.productoId, stored.opciones, stored.nota);
          const previa = state.partidas.find(item => item.clave === partida.clave);
          if (previa) previa.cantidad = Math.min(99, previa.cantidad + stored.cantidad);
          else state.partidas.push({ ...partida, cantidad: stored.cantidad });
        } catch { descartadas++; }
      }
      restaurarEtiqueta(expediente.borrador.etiqueta);
      if (descartadas) notify('Se omitieron partidas del borrador que ya no son válidas.');
      if (storageError) {
        $('storage-status').textContent = 'No se pudo leer el expediente local';
        notify(`Expediente no disponible: ${storageError}`);
      }
  }

  function macroTabId(macro) { return `tab-category-${Object.keys(menuDB).indexOf(macro)}`; }
  function renderTabs() {
    $('macro-tabs').replaceChildren();
    for (const macro of Object.keys(menuDB)) {
      const tab = button('', 'macro-tab', () => selectMacro(macro));
      tab.append(icon(macro), element('span', '', macro));
      tab.id = macroTabId(macro);
      tab.dataset.macro = macro;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'catalog-panel');
      tab.addEventListener('keydown', event => {
        const macros = Object.keys(menuDB);
        const position = macros.indexOf(macro);
        let next;
        if (event.key === 'ArrowRight') next = (position + 1) % macros.length;
        if (event.key === 'ArrowLeft') next = (position + macros.length - 1) % macros.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = macros.length - 1;
        if (next == null) return;
        event.preventDefault();
        selectMacro(macros[next]);
        $(macroTabId(macros[next])).focus();
      });
      $('macro-tabs').append(tab);
    }
  }
  function selectMacro(macro) {
    state.macro = macro;
    state.subcategoria = 'todos';
    renderNavigation();
    renderProducts();
  }
  function renderNavigation() {
    for (const tab of $('macro-tabs').children) {
      const active = tab.dataset.macro === state.macro;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    if (state.macro) $('catalog-panel').setAttribute('aria-labelledby', macroTabId(state.macro));
    else { $('catalog-panel').removeAttribute('aria-labelledby'); $('catalog-panel').setAttribute('aria-label','Catálogo sin configurar'); }
    $('subcategory-chips').replaceChildren();
    const filters = [{ key: 'todos', label: 'Todos' }, ...Object.keys(menuDB[state.macro] || {}).map(key => ({ key, label: key }))];
    for (const { key, label } of filters) {
      const chip = button(label, 'chip', () => {
        state.subcategoria = key;
        for (const sibling of $('subcategory-chips').children) sibling.setAttribute('aria-pressed', String(sibling.dataset.subcategoria === key));
        renderProducts();
      });
      chip.dataset.subcategoria = key;
      chip.setAttribute('aria-pressed', String(state.subcategoria === key));
      $('subcategory-chips').append(chip);
    }
    $('subcategory-chips').scrollLeft = 0;
  }
  function renderProducts() {
    const query = buscar(state.busqueda.trim());
    const products = catalogo.filter(producto => query ?
      buscar(`${producto.nombre} ${producto.descripcion} ${producto.subCategoria} ${producto.macroCategoria}`).includes(query) :
      producto.macroCategoria === state.macro && (state.subcategoria === 'todos' || producto.subCategoria === state.subcategoria));
    document.querySelector('.catalog').classList.toggle('searching', !!query);
    $('global-search-note').hidden = !query;
    $('catalog-empty').hidden = products.length > 0;
    $('catalog-empty-title').textContent = query ? 'No encontramos productos' : state.macro ? 'Esta categoría aún no tiene productos' : 'Menú sin configurar';
    $('catalog-empty-note').textContent = query ? 'Prueba con otro nombre.' : state.macro ? 'Selecciona otra categoría para continuar.' : 'El proveedor prepara esta plantilla antes de entregarla al restaurante.';
    const cards = products.map(producto => {
      const placeholder = producto.placeholder === true;
      const pending = !Number.isFinite(producto.precio);
      const card = element('article', `product-card${pending ? ' price-pending' : ''}${placeholder ? ' template-product' : ''}`);
      card.dataset.producto = producto.id;
      if (producto.imagen) {
        const preview = element('div', 'product-preview');
        const image = element('img', 'product-image');
        image.src = producto.imagen;
        image.alt = `Imagen representativa de ${producto.nombre}`;
        image.loading = 'lazy';
        image.decoding = 'async';
        image.width = 320;
        image.height = 200;
        image.addEventListener('error', () => { preview.hidden = true; }, { once: true });
        preview.append(image);
        card.append(preview);
      }
      card.append(element('h3', '', producto.nombre));
      const bottom = element('div', 'card-bottom');
      const price = element('span', 'product-price', placeholder ? 'Sin precio' : pending ? 'Precio pendiente' : dinero(producto.precio));
      if (!pending) price.append(element('small', '', globalThis.MesaInstallation?.restaurant.currency || 'MXN'));
      const add = button('+', 'add-button', () => selectProduct(producto));
      add.disabled = pending;
      add.setAttribute('aria-label', pending ? `${producto.nombre}: precio pendiente` : `Agregar ${producto.nombre}`);
      if (pending) card.title = placeholder ? 'Ficha de ejemplo pendiente de completar por el proveedor.' : producto.notaFuente || 'Precio pendiente de confirmar.';
      bottom.append(price, add);
      card.append(bottom);
      return card;
    });
    $('product-grid').replaceChildren(...cards);
  }

  function selectProduct(producto) {
    if (producto.precio == null) return;
    if (!producto.opciones.length) {
      addLine(crearPartida(producto.id));
      return;
    }
    state.producto = producto;
    $('modifier-form').reset();
    $('modifier-title').textContent = producto.nombre;
    $('modifier-description').textContent = producto.descripcion;
    $('modifier-error').hidden = true;
    const fields = producto.opciones.map(grupo => {
      const fieldset = element('fieldset', 'modifier-group');
      fieldset.dataset.grupo = grupo.id;
      const legend = element('legend', '', grupo.nombre);
      legend.append(element('span', grupo.requerido ? 'required-badge' : 'optional-badge', grupo.requerido ? 'REQUERIDO' : 'Opcional'));
      fieldset.append(legend);
      if (grupo.ayuda) fieldset.append(element('p', 'group-help', grupo.ayuda));
      if (grupo.tipo === 'texto') {
        const input = element('input', 'text-option');
        input.type = 'text';
        input.name = grupo.id;
        input.id = `option-${grupo.id}`;
        input.maxLength = grupo.longitudMaxima || 100;
        input.required = grupo.requerido;
        input.setAttribute('aria-label', grupo.nombre);
        input.placeholder = 'Escribe la elección confirmada';
        fieldset.append(input);
      } else {
        for (const valor of grupo.valores) {
          const label = element('label', 'option-choice');
          const input = element('input');
          input.type = grupo.tipo === 'multiple' ? 'checkbox' : 'radio';
          input.name = grupo.id;
          input.value = valor.id;
          input.required = grupo.requerido && grupo.tipo === 'unica';
          label.append(input, element('span', '', valor.nombre), element('span', 'extra-price', valor.precioExtra ? `+${dinero(valor.precioExtra)}` : 'Incluido'));
          fieldset.append(label);
        }
      }
      return fieldset;
    });
    $('modifier-fields').replaceChildren(...fields);
    updateModifierPrice();
    $('modifier-dialog').showModal();
  }
  function modifierSelections() {
    const data = new FormData($('modifier-form'));
    const selections = {};
    for (const grupo of state.producto.opciones) {
      if (grupo.tipo === 'multiple') selections[grupo.id] = data.getAll(grupo.id);
      else selections[grupo.id] = data.get(grupo.id) || '';
    }
    return selections;
  }
  function updateModifierPrice() {
    if (!state.producto) return;
    const selections = modifierSelections();
    let total = centavos(state.producto.precio);
    for (const grupo of state.producto.opciones) {
      const selected = Array.isArray(selections[grupo.id]) ? selections[grupo.id] : [selections[grupo.id]];
      for (const valor of grupo.valores || []) if (selected.includes(valor.id)) total += centavos(valor.precioExtra);
    }
    $('modifier-total').textContent = dinero(total / 100);
  }
  function addLine(line) {
    const previous = state.partidas.find(partida => partida.clave === line.clave);
    if (previous) {
      if (previous.cantidad >= 99) { notify('Máximo de 99 unidades por selección.'); return; }
      previous.cantidad++;
    } else state.partidas.push(line);
    renderOrder();
    if (saveDraft()) notify(`${line.nombre} agregado al pedido`);
  }
  function optionsText(line) {
    return line.selecciones.map(selection => selection.texto ? `${selection.grupoNombre}: ${selection.texto}` :
      `${selection.grupoNombre}: ${selection.valores.map(valor => `${valor.nombre}${valor.precioExtra ? ` (+${dinero(valor.precioExtra)})` : ''}`).join(', ')}`).join(' · ');
  }
  function lineMarkup(line, interactive = true) {
    const item = element('article', 'order-item');
    const heading = element('div', 'line-heading');
    heading.append(element('h3', '', interactive ? line.nombre : `${line.cantidad} × ${line.nombre}`), element('strong', '', dinero(line.precioUnitarioCentavos * line.cantidad / 100)));
    item.append(heading);
    const selected = optionsText(line);
    if (selected) item.append(element('p', 'line-options', selected));
    if (line.nota) item.append(element('p', 'line-note', `Nota: ${line.nota}`));
    if (interactive) {
      const controls = element('div', 'line-controls');
      const quantity = element('div', 'quantity-controls');
      const decrease = button('−', '', () => changeQuantity(line.clave, -1));
      decrease.setAttribute('aria-label', `Quitar una unidad de ${line.nombre}`);
      const increase = button('+', '', () => changeQuantity(line.clave, 1));
      increase.disabled = line.cantidad >= 99;
      increase.setAttribute('aria-label', `Añadir una unidad de ${line.nombre}`);
      quantity.append(decrease, element('span', '', line.cantidad), increase);
      const remove = button('Quitar', 'remove-line', () => {
        state.partidas = state.partidas.filter(partida => partida.clave !== line.clave);
        renderOrder(); saveDraft();
      });
      remove.setAttribute('aria-label', `Quitar ${line.nombre} del pedido`);
      const write = button('', 'line-note-button', () => {
        const actual = state.partidas.find(p => p.clave === line.clave);
        if (!actual) { notify('Este producto ya no está en la selección.'); return; }
        noteLineKey = actual.clave;
        $('line-note-product').textContent = `${actual.cantidad} × ${actual.nombre}`;
        $('line-note-help').textContent = 'La observación se aplica a todas las unidades de esta selección y se imprime junto al producto en su comanda.';
        $('line-note-input').value = actual.nota;
        $('line-note-error').hidden = true;
        $('line-note-dialog').showModal();
        $('line-note-input').focus();
      });
      write.setAttribute('aria-label', `${line.nota ? 'Editar' : 'Añadir'} observación de ${line.nombre}`);
      write.title = line.nota ? 'Editar observación' : 'Añadir observación';
      write.dataset.hasNote = String(!!line.nota);
      write.append(icon('write'));
      controls.append(quantity, element('span', 'line-unit', `${dinero(line.precioUnitario)} c/u`), write, remove);
      item.append(controls);
    } else item.append(element('p', 'line-options', `${dinero(line.precioUnitario)} por unidad`));
    return item;
  }
  function changeQuantity(key, amount) {
    const line = state.partidas.find(partida => partida.clave === key);
    if (!line) return;
    if (line.cantidad + amount > 99) return;
    line.cantidad += amount;
    state.partidas = state.partidas.filter(partida => partida.cantidad > 0);
    renderOrder(); saveDraft();
  }
  function renderOrder() {
    actualizarPreajustes();
    const destino = expediente.pedidos.find(pedido => pedido.id === state.pedidoDestinoId);
    $('order-title').textContent = destino ? `Añadir a ${destino.etiqueta || `pedido N° ${destino.numero}`}` : 'Pedido actual';
    $('order-label-controls').hidden = !!destino;
    $('addition-notice').hidden = !destino;
    $('addition-note').textContent = destino ? `Pedido N° ${destino.numero} · Selecciona los productos nuevos en el menú. Se sumarán al confirmar.` : '';
    $('review-order').textContent = destino ? 'Revisar productos nuevos →' : 'Crear pedido →';
    $('order-total-label').textContent = destino ? 'Total a añadir' : 'Total';
    const cantidad = state.partidas.reduce((total, line) => total + line.cantidad, 0);
    const total = dinero(totalPedido(state.partidas) / 100);
    $('order-count').textContent = cantidad;
    $('order-total').textContent = total;
    $('mobile-order-link').setAttribute('aria-label', `Ver pedido: ${cantidad} productos, ${total}`);
    $('mobile-order-count').textContent = cantidad;
    $('mobile-order-total').textContent = total;
    $('clear-order').disabled = !state.partidas.length;
    $('review-order').disabled = !state.partidas.length;
    if (state.partidas.length) {
      $('order-items').replaceChildren(...state.partidas.map(line => lineMarkup(line)));
    } else {
      const empty = element('div', 'order-empty');
      const picture = element('div', 'empty-icon');
      picture.append(icon('bag'));
      empty.append(picture, element('strong', '', destino ? '¿Algo más para este pedido?' : 'Tu pedido empieza con un antojo'), element('p', '', 'Toca el + de cualquier producto\ny lo agregaremos aquí.'));
      $('order-items').replaceChildren(empty);
    }
  }

  function guardarNota(quitar = false) {
    try {
      if (!noteLineKey) throw new Error('Vuelve a seleccionar el producto.');
      const next = currentState();
      const seleccion = next.adicion || next.borrador;
      seleccion.partidas = AmorPOS.actualizarNota(seleccion.partidas, noteLineKey, quitar ? '' : $('line-note-input').value);
      if (!commit(next)) throw new Error('No se guardó la observación. Intenta de nuevo.');
      $('line-note-dialog').close();
      notify(quitar ? 'Observación retirada' : 'Observación guardada');
    } catch (error) {
      $('line-note-error').textContent = error.message;
      $('line-note-error').hidden = false;
    }
  }
  $('line-note-form').addEventListener('submit', event => { event.preventDefault(); guardarNota(); });
  $('line-note-remove').addEventListener('click', () => guardarNota(true));
  $('line-note-dialog').addEventListener('close', () => { noteLineKey = null; });

  $('product-search').addEventListener('input', event => { state.busqueda = event.target.value; renderProducts(); });
  $('modifier-form').addEventListener('change', updateModifierPrice);
  $('modifier-form').addEventListener('input', updateModifierPrice);
  $('modifier-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const line = crearPartida(state.producto.id, modifierSelections(), $('modifier-note').value);
      addLine(line);
      $('modifier-dialog').close();
    } catch (error) {
      $('modifier-error').textContent = error.message;
      $('modifier-error').hidden = false;
      const fieldset = [...$('modifier-fields').children].find(field => field.dataset.grupo === error.grupoId);
      fieldset?.querySelector('input')?.focus();
    }
  });
  $('modifier-dialog').addEventListener('close', () => { state.producto = null; });
  document.querySelectorAll('[data-close]').forEach(close => close.addEventListener('click', () => close.closest('dialog').close()));
  $('order-label').addEventListener('input', saveDraft);
  $('add-extra').addEventListener('click', () => {
    $('extra-form').reset(); $('extra-error').hidden = true; $('extra-dialog').showModal();
  });
  $('extra-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      addLine(crearExtra($('extra-concept').value, $('extra-amount').value));
      $('extra-dialog').close();
    } catch (error) {
      $('extra-error').textContent = error.message; $('extra-error').hidden = false;
    }
  });
  const drawer = $('mobile-order-dialog');
  const narrowScreen = matchMedia('(max-width: 700px)');
  function syncOrderDrawer() {
    if (drawer.open) drawer.close();
    if (narrowScreen.matches) drawer.append($('order-panel'));
    else document.querySelector('.workspace').append($('order-panel'));
  }
  function showOrderPanel() {
    if (narrowScreen.matches) {
      if (!drawer.open) drawer.showModal();
      $('mobile-order-link').setAttribute('aria-expanded', 'true');
    } else $('order-panel').scrollIntoView({ behavior: 'auto', block: 'start' });
    $('order-title').focus({ preventScroll: true });
  }
  narrowScreen.addEventListener('change', syncOrderDrawer);
  syncOrderDrawer();
  $('mobile-order-link').addEventListener('click', showOrderPanel);
  $('close-order-drawer').addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', event => {
    if (event.target !== drawer) return;
    const bounds = drawer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) drawer.close();
  });
  drawer.addEventListener('close', () => $('mobile-order-link').setAttribute('aria-expanded', 'false'));
  $('clear-order').addEventListener('click', () => $('clear-dialog').showModal());
  $('confirm-clear').addEventListener('click', () => {
    const next = currentState();
    if (state.pedidoDestinoId) next.adicion.partidas = [];
    else next.borrador = { etiqueta: '', partidas: [] };
    if (commit(next)) { $('clear-dialog').close(); notify('Pedido vaciado'); }
  });
  function comenzarAdicion(pedidoId) {
    const next = currentState();
    const pedido = next.pedidos.find(p => p.id === pedidoId);
    if (!pedido || !AmorOrders.estaAbierto(pedido)) { notify('Este pedido ya está cerrado.'); return; }
    try { AmorOrders.validarMesaDisponible(next.pedidos, pedido.etiqueta, pedido.id); }
    catch (error) { notify(error.message); return; }
    if (next.adicion && next.adicion.pedidoId !== pedidoId) { notify('Confirma o cancela primero los productos del otro pedido.'); return; }
    if (!next.adicion) next.adicion = { pedidoId, partidas: [] };
    if (!commit(next)) return;
    $('ticket-dialog').close();
    $('history-dialog').close();
    showOrderPanel();
    notify(`Selecciona productos para ${pedido.etiqueta || `pedido N° ${pedido.numero}`}`);
  }
  function cancelarAdicion() {
    const next = currentState(); next.adicion = null;
    if (commit(next)) { $('cancel-addition-dialog').close(); notify('Selección cancelada'); }
  }
  $('cancel-addition').addEventListener('click', () => {
    if (state.partidas.length) $('cancel-addition-dialog').showModal();
    else cancelarAdicion();
  });
  $('confirm-cancel-addition').addEventListener('click', cancelarAdicion);
  $('review-order').addEventListener('click', () => {
    const destino = expediente.pedidos.find(p => p.id === state.pedidoDestinoId);
    let etiqueta;
    try { etiqueta = destino ? destino.etiqueta : AmorOrders.resolverEtiqueta(etiquetaActual(), expediente.pedidos, expediente.siguienteDelivery); }
    catch (error) { notify(error.message); return; }
    $('review-title').textContent = destino ? 'Revisa los productos nuevos' : 'Revisa tu pedido';
    $('review-label').textContent = destino ? `${destino.etiqueta || 'Sin etiqueta'} · Pedido N° ${destino.numero}` : etiqueta || 'Pedido sin etiqueta';
    $('review-total-label').textContent = destino ? 'Total a añadir' : 'Total del pedido';
    $('review-print-note').textContent = destino ? 'Se sumarán al pedido y se imprimirán comandas solo de estos productos nuevos.' : 'Se guardará en este dispositivo y se abrirá la impresión de comandas para Cocina y Barra.';
    $('confirm-order').textContent = destino ? 'Confirmar adición ✓' : 'Confirmar pedido ✓';
    $('review-items').replaceChildren(...state.partidas.map(line => lineMarkup(line, false)));
    $('review-total').textContent = dinero(totalPedido(state.partidas) / 100);
    $('review-dialog').showModal();
  });
  function printConfirmedOrder(pedido, sources) {
    // Storage has already committed. A visual effect can never undo or block that success.
    let transfer;
    try { transfer = globalThis.MesaOrderEffects?.transfer(pedido, sources); }
    catch { transfer = null; }
    return Promise.resolve(transfer).catch(() => {}).then(() => AmorPrinting.imprimirComandas(pedido));
  }
  $('confirm-order').addEventListener('click', () => {
    let transferSources = [];
    try { transferSources = globalThis.MesaOrderEffects?.capture() || []; } catch {}
    try {
      const next = currentState();
      if (state.pedidoDestinoId) {
        const index = next.pedidos.findIndex(p => p.id === state.pedidoDestinoId);
        if (index < 0) throw new Error('No se encontró el pedido.');
        const anterior = next.pedidos[index];
        const pedido = AmorOrders.agregarPartidas(anterior, state.partidas, next.pedidos);
        const nuevas = pedido.partidas.slice(anterior.partidas.length);
        next.pedidos[index] = pedido;
        next.adicion = null;
        if (commit(next)) {
          $('review-dialog').close(); salesUI.abrirPedido(pedido.id);
          notify(`Productos añadidos a ${pedido.etiqueta || `pedido N° ${pedido.numero}`}`);
          printConfirmedOrder({ ...pedido, partidas: nuevas }, transferSources).catch(error => notify(`Productos guardados. No se abrió la impresión: ${error.message}`));
        }
        return;
      }
      const etiqueta = AmorOrders.resolverEtiqueta(etiquetaActual(), next.pedidos, next.siguienteDelivery);
      const pedido = AmorOrders.nuevoPedido(state.partidas, etiqueta, next.siguienteNumero);
      next.pedidos.push(pedido); next.siguienteNumero++;
      next.borrador = { etiqueta: '', partidas: [] };
      if (commit(next)) {
        $('review-dialog').close(); notify(`Pedido N° ${pedido.numero} guardado`);
        printConfirmedOrder(pedido, transferSources).catch(error => notify(`Pedido guardado. No se abrió la impresión: ${error.message}. Puedes reimprimir sus comandas.`));
      }
    } catch (error) { notify(error.message); }
  });
  globalThis.guardarExpediente = () => {
    const saved = saveDraft();
    if (saved) notify('Expediente guardado en este dispositivo');
    return saved;
  };
  $('save-expediente').addEventListener('click', globalThis.guardarExpediente);
  $('restart-app').addEventListener('click', () => { if (saveDraft()) window.location.reload(); });
  const menus = [...document.querySelectorAll('.options-dropdown')];
  const headerToggle = $('header-menu-toggle');
  const headerControls = $('header-controls');
  function closeHeaderMenu() {
    headerToggle.setAttribute('aria-expanded', 'false');
    for (const menu of menus) menu.open = false;
  }
  headerToggle.addEventListener('click', () => {
    const expanded = headerToggle.getAttribute('aria-expanded') === 'true';
    if (expanded) closeHeaderMenu();
    else headerToggle.setAttribute('aria-expanded', 'true');
  });
  headerControls.addEventListener('click', event => {
    if (!event.target.closest('#cash-tips') && event.target.closest('button:not(:disabled), a')) closeHeaderMenu();
  });
  document.addEventListener('click', event => {
    if (!headerControls.contains(event.target) && !headerToggle.contains(event.target)) closeHeaderMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && headerToggle.getAttribute('aria-expanded') === 'true') {
      closeHeaderMenu(); headerToggle.focus();
    }
  });
  for (const menu of menus) {
    menu.addEventListener('toggle', () => { if (menu.open) for (const other of menus) if (other !== menu) other.open = false; });
    menu.querySelector('nav').addEventListener('click', event => { if (!event.target.closest('#cash-tips') && event.target.closest('button:not(:disabled), a')) menu.open = false; });
  }
  document.addEventListener('click', event => { for (const menu of menus) if (!menu.contains(event.target)) menu.open = false; });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') for (const menu of menus) if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  renderPreajustes();
  cashUI = AmorCashUI.iniciar({ getState: currentState, commit, notify });
  salesUI = AmorSalesUI.iniciar({ getState: currentState, commit, notify, reload: reloadExpediente,
    agregarProductos: comenzarAdicion,
    solicitarCobro: (pedidoId, partidaId) => cashUI.solicitarCobro(pedidoId, partidaId) });
  window.addEventListener('storage', event => {
    if (event.key !== AmorStorage.KEY) return;
    if (reloadExpediente()) {
      restoreDraft(); renderOrder(); salesUI.renderAll();
      if ($('review-dialog').open) $('review-dialog').close();
      notify('Expediente actualizado desde otra pestaña');
    }
  });
  renderTabs(); renderNavigation(); renderProducts(); restoreDraft(); renderOrder();
  salesUI.renderAll();
  cashUI.renderAll();
  if (!expediente.caja.abierta && globalThis.MesaInstallation?.ready !== false) cashUI.ofrecerApertura();
  if (globalThis.MesaInstallation?.ready === false) {
    $('cash-state').textContent = 'Caja no disponible';
    $('cash-expected').textContent = 'Plantilla sin restaurante asignado';
  }
})();
