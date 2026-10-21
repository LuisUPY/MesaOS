/* Pedidos confirmados: copias de precios y categorías al momento de vender. */
globalThis.AmorOrders = (() => {
  'use strict';
  const copia = value => JSON.parse(JSON.stringify(value));
  const textoEtiqueta = etiqueta => String(etiqueta).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
  function numeroDelivery(etiqueta) {
    const match = textoEtiqueta(etiqueta).match(/^delivery\s*#\s*(\d+)(?=$|\s|·)/);
    const numero = match ? Number(match[1]) : null;
    return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
  }
  function claveEtiqueta(etiqueta) {
    const texto = textoEtiqueta(etiqueta);
    if (!texto) return '';
    // El detalle del cliente no cambia la ocupación de una mesa.
    const mesa = texto.match(/^mesa\s*0*([1-8])(?=$|[^\p{L}\p{N}])/u);
    if (mesa) return `mesa:${mesa[1]}`;
    const delivery = numeroDelivery(etiqueta);
    return delivery === null ? `etiqueta:${texto}` : `delivery:${delivery}`;
  }
  function pedidoConEtiqueta(pedidos, etiqueta, ignorarId = null) {
    const clave = claveEtiqueta(etiqueta);
    return clave ? pedidos.find(pedido => pedido.id !== ignorarId &&
      (clave.startsWith('mesa:') ? cuentaPendiente(pedido) : estaAbierto(pedido)) && claveEtiqueta(pedido.etiqueta) === clave) || null : null;
  }
  function siguienteDelivery(pedidos, minimo = 1) {
    if (!Number.isSafeInteger(minimo) || minimo < 1) throw new Error('Numeración de delivery inválida.');
    let siguiente = minimo;
    for (const pedido of pedidos) {
      const numero = numeroDelivery(pedido.etiqueta);
      if (numero !== null) siguiente = Math.max(siguiente, numero + 1);
    }
    if (!Number.isSafeInteger(siguiente)) throw new Error('Se agotó la numeración de delivery.');
    return siguiente;
  }
  function resolverEtiqueta(etiqueta, pedidos, minimoDelivery = 1) {
    let resultado = etiqueta.trim();
    if (/^delivery(?:\s*#\s*\d+)?(?:\s*·.*)?$/.test(textoEtiqueta(resultado))) {
      const separador = resultado.indexOf('·');
      const detalle = separador < 0 ? '' : resultado.slice(separador + 1).trim();
      resultado = `Delivery #${siguienteDelivery(pedidos, minimoDelivery)}${detalle ? ` · ${detalle}` : ''}`;
    }
    resultado = resultado.slice(0, 60);
    const ocupado = pedidoConEtiqueta(pedidos, resultado);
    if (ocupado) throw new Error(`${resultado || 'Esta etiqueta'} ya tiene un pedido abierto (N° ${ocupado.numero}). Ábrelo en Pedidos abiertos para añadir productos.`);
    return resultado;
  }
  function nuevoPedido(partidas, etiqueta, numero, fecha = new Date().toISOString()) {
    if (!partidas.length) throw new Error('Agrega productos al pedido.');
    if (!Number.isSafeInteger(numero) || numero < 1) throw new Error('Número de pedido inválido.');
    AmorPOS.totalPedido(partidas);
    return {
      id: `pedido-${numero}`, numero, etiqueta: etiqueta.trim().slice(0, 60), creadoEn: fecha,
      estado: 'ABIERTO', totalCentavos: AmorPOS.totalPedido(partidas),
      partidas: copia(partidas).map((partida, index) => ({ ...partida, id: `partida-${numero}-${index + 1}`,
        preparado: false, pagado: false, preparadoEn: null, pagadoEn: null }))
    };
  }
  function estadoPedido(pedido) {
    if (!pedido.partidas.length) return 'CANCELADO';
    if (pedido.partidas.every(partida => partida.pagado)) return 'PAGADO';
    if (pedido.partidas.every(partida => partida.preparado)) return 'PREPARADO';
    return 'ABIERTO';
  }
  function estaAbierto(pedido) {
    return pedido.partidas.some(partida => !partida.pagado || !partida.preparado);
  }
  function cuentaPendiente(pedido) {
    return pedido.partidas.some(partida => !partida.pagado);
  }
  function validarMesaDisponible(pedidos, etiqueta, ignorarId = null) {
    if (!claveEtiqueta(etiqueta).startsWith('mesa:')) return;
    const ocupado = pedidoConEtiqueta(pedidos, etiqueta, ignorarId);
    if (ocupado) throw new Error(`${etiqueta} ya tiene una cuenta pendiente (N° ${ocupado.numero}). Añade los productos a esa cuenta.`);
  }
  function agregarPartidas(pedido, partidas, pedidos = []) {
    if (pedido.partidas.some(p => p.descuentoCentavos)) throw new Error('Quita el descuento antes de modificar los productos de la cuenta.');
    if (!estaAbierto(pedido)) throw new Error('Este pedido ya está cerrado. Crea un pedido nuevo.');
    validarMesaDisponible(pedidos, pedido.etiqueta, pedido.id);
    if (!partidas.length) throw new Error('Agrega productos al pedido.');
    AmorPOS.totalPedido(partidas);
    const resultado = copia(pedido);
    const ids = new Set([...resultado.partidas, ...(resultado.partidasEliminadas || [])].map(partida => partida.id));
    let numeroPartida = resultado.partidas.length + 1;
    for (const partida of copia(partidas)) {
      let id;
      do { id = `partida-${pedido.numero}-${numeroPartida++}`; } while (ids.has(id));
      ids.add(id);
      // Cada adición mantiene su propio estado, aunque repita un producto ya pagado.
      resultado.partidas.push({ ...partida, id, preparado: false, pagado: false, preparadoEn: null, pagadoEn: null });
    }
    resultado.totalCentavos = AmorPOS.totalPedido(resultado.partidas);
    resultado.estado = estadoPedido(resultado);
    return resultado;
  }
  function eliminarPartida(pedido, partidaId, fecha = new Date().toISOString()) {
    if (pedido.partidas.some(p => p.descuentoCentavos)) throw new Error('Quita el descuento antes de modificar los productos de la cuenta.');
    const partida = pedido.partidas.find(item => item.id === partidaId);
    if (!partida) throw new Error('Este producto ya no está en el pedido.');
    if (partida.pagado) throw new Error('No se pueden eliminar productos ya cobrados.');
    if (!estaAbierto(pedido)) throw new Error('Este pedido ya está cerrado.');
    if (typeof fecha !== 'string' || !Number.isFinite(Date.parse(fecha)) || Date.parse(fecha) < Date.parse(pedido.creadoEn) ||
      (partida.preparado && Date.parse(fecha) < Date.parse(partida.preparadoEn))) throw new Error('La fecha de eliminación no es válida.');
    const resultado = copia(pedido);
    resultado.partidas = resultado.partidas.filter(item => item.id !== partidaId);
    resultado.partidasEliminadas = [...(resultado.partidasEliminadas || []), { ...copia(partida), eliminadoEn: fecha }];
    resultado.totalCentavos = AmorPOS.totalPedido(resultado.partidas);
    resultado.estado = estadoPedido(resultado);
    return resultado;
  }
  function aplicarDescuento(pedido, tipo, valor) {
    if (!pedido.partidas.length || pedido.partidas.some(p => p.pagado)) throw new Error('El descuento solo se puede cambiar antes del primer cobro.');
    const resultado = copia(pedido);
    const bases = resultado.partidas.map(p => { delete p.descuentoCentavos; return AmorPOS.importePartida(p); });
    const subtotal = AmorPOS.totalPedido(resultado.partidas);
    const texto = String(valor).trim().replace(',', '.');
    if (!['monto', 'porcentaje'].includes(tipo) || !/^\d+(?:\.\d{1,2})?$/.test(texto)) throw new Error('Escribe un descuento válido con hasta dos decimales.');
    const unidades = Math.round(Number(texto) * 100);
    if (!Number.isSafeInteger(unidades) || unidades < 0 || (tipo === 'porcentaje' && unidades > 10000)) throw new Error('El porcentaje debe estar entre 0 y 100.');
    const descuento = tipo === 'monto' ? unidades : Number((BigInt(subtotal) * BigInt(unidades) + 5000n) / 10000n);
    if (descuento > subtotal) throw new Error('El descuento no puede superar el subtotal de la cuenta.');
    // Reparte al centavo para que los cobros por producto y los cortes sumen el neto.
    const cuotas = bases.map((base, index) => {
      const producto = BigInt(base) * BigInt(descuento);
      return { index, monto: subtotal ? Number(producto / BigInt(subtotal)) : 0, resto: subtotal ? producto % BigInt(subtotal) : 0n };
    });
    const faltantes = descuento - cuotas.reduce((sum, c) => sum + c.monto, 0);
    const prioridad = [...cuotas].sort((a,b) => a.resto === b.resto ? a.index-b.index : a.resto > b.resto ? -1 : 1);
    for (let i=0; i<faltantes; i++) prioridad[i].monto++;
    for (const cuota of cuotas) if (cuota.monto) resultado.partidas[cuota.index].descuentoCentavos = cuota.monto;
    resultado.totalCentavos = AmorPOS.totalPedido(resultado.partidas);
    return resultado;
  }
  function marcarPartida(pedido, partidaId, accion, fecha = new Date().toISOString()) {
    if (!['preparado', 'pagado'].includes(accion)) throw new Error('Acción inválida.');
    const resultado = copia(pedido);
    const partidas = partidaId === 'todos' ? resultado.partidas : resultado.partidas.filter(partida => partida.id === partidaId);
    if (!partidas.length) throw new Error('Producto del pedido no encontrado.');
    for (const partida of partidas) {
      // Repetir un toque nunca cambia la fecha de un pago ya registrado.
      if (!partida[accion]) {
        partida[accion] = true;
        partida[`${accion}En`] = fecha;
      }
    }
    resultado.estado = estadoPedido(resultado);
    return resultado;
  }
  return Object.freeze({ nuevoPedido, aplicarDescuento, estadoPedido, estaAbierto, marcarPartida, agregarPartidas, eliminarPartida,
    cuentaPendiente, validarMesaDisponible, claveEtiqueta, pedidoConEtiqueta, numeroDelivery, siguienteDelivery, resolverEtiqueta });
})();
