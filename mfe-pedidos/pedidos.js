// Micro frontend: PEDIDOS — Vue 3 sin compilación.
//
// Contrato: window.renderPedidos(idContenedor) / window.unmountPedidos(idContenedor)
//
// Escucha: 'pedido:confirmado' { id, total, items, version }
// Publica: 'pedido:estado' { id, estado, version }

(function () {

  const VERSION = '1.0.0';

  const ESTADOS = [
    'Recibido',
    'En preparación',
    'En camino',
    'Entregado'
  ];

  let app = null;
  let vistaVue = null;
  let idMontado = null;
  let pedidoActual = null;
  let timer = null;

  function asegurarEstilos() {

    if (document.getElementById('ped-estilos')) return;

    const style = document.createElement('style');

    style.id = 'ped-estilos';

    style.textContent = `

      .ped-titulo {
        color: #0b4f8a;
        margin: 0 0 4px;
      }

      .ped-version {
        font-size: 12px;
        color: #888;
      }

      .ped-card {
        background: #fff;
        border: 1px solid #d9dee5;
        border-radius: 8px;
        padding: 20px;
        margin-top: 16px;
      }

      .ped-estado {
        font-size: 22px;
        font-weight: bold;
        margin: 12px 0;
        color: #0b4f8a;
      }

      .ped-progreso {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 18px 0;
      }

      .ped-paso {
        padding: 10px 8px;
        border-radius: 6px;
        background: #eef1f4;
        color: #333;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
      }

      .ped-paso.activo {
        background: #0b4f8a;
        color: #fff;
        font-weight: bold;
      }

      .ped-total {
        font-weight: bold;
        margin-top: 12px;
      }

      .ped-items {
        margin: 12px 0 0;
        padding-left: 20px;
      }

      .ped-vacio {
        color: #777;
      }

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

    if (!pedidoActual || pedidoActual.estado === 'Entregado') {
      return;
    }

    timer = window.setInterval(function () {

      if (!pedidoActual) {
        window.clearInterval(timer);
        return;
      }

      const indiceActual = ESTADOS.indexOf(pedidoActual.estado);

      if (indiceActual < ESTADOS.length - 1) {

        const siguienteEstado = ESTADOS[indiceActual + 1];

        pedidoActual = {
          id: pedidoActual.id,
          total: pedidoActual.total,
          items: pedidoActual.items,
          version: pedidoActual.version,
          estado: siguienteEstado
        };

        console.log(
          '[mfe-pedidos] Estado actualizado:',
          pedidoActual.estado
        );

        actualizarVista();

        emitirEstado();
      }

      if (pedidoActual.estado === 'Entregado') {

        window.clearInterval(timer);

        console.log(
          '[mfe-pedidos] Pedido entregado'
        );
      }

    }, 4000);
  }

  function actualizarVista() {

    if (vistaVue) {

      vistaVue.pedido = pedidoActual;

    }
  }

  function recibirPedido(e) {

    const data = e.detail || {};

    if (
      !data.id ||
      typeof data.total !== 'number' ||
      !Array.isArray(data.items) ||
      !data.version
    ) {

      console.warn(
        '[mfe-pedidos] pedido:confirmado no cumple el contrato',
        data
      );

      return;
    }

    console.log(
      '[mfe-pedidos] Pedido recibido:',
      data
    );

    pedidoActual = {

      id: data.id,

      total: data.total,

      items: data.items,

      version: data.version,

      estado: ESTADOS[0]

    };

    actualizarVista();

    emitirEstado();

    iniciarAvance();
  }

  // --------------------------------------------------
  // Vue
  // --------------------------------------------------

  function plantillaPedido() {

    return `

      <h2 class="ped-titulo">
        Seguimiento de pedidos
      </h2>

      <span class="ped-version">
        mfe-pedidos v${VERSION} · Vue 3 sin compilación
      </span>

      <section
        v-if="pedido"
        class="ped-card"
      >

        <div>
          <strong>Pedido:</strong>
          {{ pedido.id }}
        </div>

        <div class="ped-estado">
          {{ pedido.estado }}
        </div>

        <div class="ped-progreso">

          <div
            v-for="estado in estados"
            :key="estado"
            class="ped-paso"
            :class="{
              activo:
                estados.indexOf(estado) <=
                estados.indexOf(pedido.estado)
            }"
          >
            {{ estado }}
          </div>

        </div>

        <div class="ped-total">
          Total: {{ formato(pedido.total) }}
        </div>

        <ul class="ped-items">

          <li
            v-for="item in pedido.items"
            :key="item.id"
          >
            {{ item.nombre }} × {{ item.cantidad }}
          </li>

        </ul>

      </section>

      <p
        v-else
        class="ped-vacio"
      >
        No hay un pedido confirmado para mostrar.
      </p>

    `;
  }

  // --------------------------------------------------
  // Escucha de eventos
  // --------------------------------------------------

  // Se registra desde que se carga el bundle.
  // Así puede recibir pedidos aunque Pedidos no esté visible.

  window.addEventListener(
    'pedido:confirmado',
    recibirPedido
  );

  // --------------------------------------------------
  // Montaje
  // --------------------------------------------------

  window.renderPedidos = function (idContenedor) {

    if (!window.Vue) {

      throw new Error(
        'Vue 3 no está disponible. Revise la carga de vue.global.js.'
      );

    }

    asegurarEstilos();

    idMontado = idContenedor;

    const raiz = document.getElementById(idContenedor);

    if (!raiz) {

      throw new Error(
        'Contenedor no encontrado: ' + idContenedor
      );

    }

    app = window.Vue.createApp({

      data: function () {

        return {
          pedido: pedidoActual
        };

      },

      computed: {

        estados: function () {

          return ESTADOS;

        }

      },

      methods: {

        formato: function (valor) {

          return new Intl.NumberFormat(
            'es-CO',
            {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            }
          ).format(valor);

        }

      },

      template: plantillaPedido()

    });

    // Guardamos la instancia reactiva de Vue.
    vistaVue = app.mount(raiz);

    actualizarVista();

  };

  // --------------------------------------------------
  // Desmontaje
  // --------------------------------------------------

  window.unmountPedidos = function (idContenedor) {

    window.clearInterval(timer);

    timer = null;

    if (app) {

      app.unmount();

      app = null;

    }

    vistaVue = null;

    const raiz = document.getElementById(idContenedor);

    if (raiz) {

      raiz.innerHTML = '';

    }

    idMontado = null;

  };

})();