// Micro frontend: PEDIDOS — Vue 3 sin compilación.
// Contrato: window.renderPedidos(idContenedor) / window.unmountPedidos(idContenedor)
// Escucha: 'pedido:confirmado' { id, total, items, version }
// Publica: 'pedido:estado' { id, estado, version }

(function () {
  const VERSION = '1.0.0';
  const ESTADOS = ['Recibido', 'En preparación', 'En camino', 'Entregado'];
  let app = null;
  let idMontado = null;
  let pedidoActual = null;
  let timer = null;

  function asegurarEstilos() {
    if (document.getElementById('ped-estilos')) return;
    const style = document.createElement('style');
    style.id = 'ped-estilos';
    style.textContent = `
      .ped-titulo { color: var(--color-primary); margin: 0 0 4px; }
      .ped-version { font-size: 12px; color: var(--color-muted); }
      .ped-card { background: var(--color-surface); border: 1px solid var(--color-border);
        border-radius: var(--radius-md); padding: var(--space-5); margin-top: var(--space-4); }
      .ped-estado { font-size: 22px; font-weight: bold; margin: 12px 0; }
      .ped-progreso { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 18px 0; }
      .ped-paso { padding: 8px; border-radius: var(--radius-sm); background: #eef1f4;
        text-align: center; font-size: 13px; }
      .ped-paso.activo { background: var(--color-primary); color: #fff; }
      .ped-total { font-weight: bold; }
      .ped-items { margin: 12px 0 0; padding-left: 20px; }
      .ped-vacio { color: var(--color-muted); }
    `;
    document.head.appendChild(style);
  }

  function emitirEstado() {
    if (!pedidoActual) return;
    window.dispatchEvent(new CustomEvent('pedido:estado', {
      detail: {
        id: pedidoActual.id,
        estado: pedidoActual.estado,
        version: pedidoActual.version
      }
    }));
  }

  function iniciarAvance() {
    window.clearInterval(timer);
    if (!pedidoActual || pedidoActual.estado === 'Entregado') return;

    timer = window.setInterval(function () {
      if (!pedidoActual) return;
      const indice = ESTADOS.indexOf(pedidoActual.estado);
      if (indice < ESTADOS.length - 1) {
        pedidoActual.estado = ESTADOS[indice + 1];
        emitirEstado();
        actualizarVista();
      }
      if (pedidoActual.estado === 'Entregado') {
        window.clearInterval(timer);
      }
    }, 4000);
  }

  const estadoVue = { pedido: null };

  function plantillaPedido() {
    return `
      <h2 class="ped-titulo">Seguimiento de pedidos</h2>
      <span class="ped-version">mfe-pedidos v${VERSION} · Vue 3 sin compilación</span>
      <section v-if="pedido" class="ped-card">
        <div><strong>Pedido:</strong> {{ pedido.id }}</div>
        <div class="ped-estado">{{ pedido.estado }}</div>
        <div class="ped-progreso">
          <div v-for="estado in estados" :key="estado"
               class="ped-paso" :class="{ activo: estados.indexOf(estado) <= estados.indexOf(pedido.estado) }">
            {{ estado }}
          </div>
        </div>
        <div class="ped-total">Total: {{ formato(pedido.total) }}</div>
        <ul class="ped-items">
          <li v-for="item in pedido.items" :key="item.id">
            {{ item.nombre }} × {{ item.cantidad }}
          </li>
        </ul>
      </section>
      <p v-else class="ped-vacio">No hay un pedido confirmado para mostrar.</p>
    `;
  }

  function actualizarVista() {
    estadoVue.pedido = pedidoActual;
  }

  function recibirPedido(e) {
    const data = e.detail || {};
    if (!data.id || typeof data.total !== 'number' || !Array.isArray(data.items) || !data.version) {
      console.warn('[mfe-pedidos] pedido:confirmado no cumple el contrato', data);
      return;
    }

    pedidoActual = {
      id: data.id,
      total: data.total,
      items: data.items,
      version: data.version,
      estado: ESTADOS[0]
    };

    emitirEstado();
    iniciarAvance();
    actualizarVista();
  }

  // Se registra al cargar el bundle para no perder pedidos aunque el MFE no esté en pantalla.
  window.addEventListener('pedido:confirmado', recibirPedido);

  window.renderPedidos = function (idContenedor) {
    if (!window.Vue) {
      throw new Error('Vue 3 no está disponible. Revise la carga de vue.global.js.');
    }
    asegurarEstilos();
    idMontado = idContenedor;

    const raiz = document.getElementById(idContenedor);
    if (!raiz) throw new Error('Contenedor no encontrado: ' + idContenedor);

    // Vue 3 se usa directamente desde vue.global.js, sin Vite, Webpack ni compilación.
    app = window.Vue.createApp({
      data: function () {
        return estadoVue;
      },
      computed: {
        estados: function () { return ESTADOS; }
      },
      methods: {
        formato: function (valor) {
          return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0
          }).format(valor);
        }
      },
      template: plantillaPedido()
    });
    app.mount(raiz);
    actualizarVista();
  };

  window.unmountPedidos = function (idContenedor) {
    // El seguimiento es estado del micro frontend y continúa aunque no esté en pantalla.
    if (app) {
      app.unmount();
      app = null;
    }
    const raiz = document.getElementById(idContenedor);
    if (raiz) raiz.innerHTML = '';
    idMontado = null;
  };

})();
