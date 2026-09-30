// Micro frontend: CATÁLOGO (equipo "Descubrimiento")
// Contrato: window.renderCatalogo(idContenedor) / window.unmountCatalogo(idContenedor)
// Publica: evento 'carrito:agregar' con { id, nombre, precio }
(function () {
  const VERSION = "1.0.0";

  const PLATOS = [
    {
      id: 1,
      nombre: "Chivo guisado",
      precio: 28000,
      categoria: "Plato fuerte",
    },
    {
      id: 2,
      nombre: "Arroz de payaso",
      precio: 22000,
      categoria: "Plato fuerte",
    },
    {
      id: 3,
      nombre: "Sancocho de gallina",
      precio: 25000,
      categoria: "Plato fuerte",
    },
    { id: 4, nombre: "Arepa de huevo", precio: 6000, categoria: "Entrada" },
    { id: 5, nombre: "Carimañola", precio: 4500, categoria: "Entrada" },
    { id: 6, nombre: "Jugo de corozo", precio: 5000, categoria: "Bebida" },
    { id: 7, nombre: "Limonada de panela", precio: 4000, categoria: "Bebida" },
    {
      id: 8,
      nombre: "Dulce de leche cortada",
      precio: 7000,
      categoria: "Postre",
    },
  ];

  const pesos = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

  // Estilos propios con prefijo "cat-" para no chocar con otros equipos
  const CSS = `
    .cat-titulo { color: #0b4f8a; margin: 0 0 4px; }
    .cat-version { font-size: 12px; color: #888; }
    .cat-buscar { width: 100%; padding: 10px; margin: 16px 0; border: 1px solid #bbb; border-radius: 4px; font-size: 15px; }
    .cat-grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; }
    .cat-tarjeta { background: #fff; border: 1px solid #dde3ea; border-radius: 6px; padding: 16px; }
    .cat-categoria { font-size: 12px; color: #3e9f3a; text-transform: uppercase; }
    .cat-nombre { font-size: 17px; margin: 6px 0; }
    .cat-precio { font-weight: bold; margin-bottom: 12px; }
    .cat-boton { background: #3e9f3a; color: #fff; border: 0; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
    .cat-boton:hover { background: #1b7a3e; }
    .cat-vacio { color: #777; }
  `;

  function asegurarEstilos() {
    if (document.getElementById("cat-estilos")) return;
    const style = document.createElement("style");
    style.id = "cat-estilos";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  let filtro = ""; // estado interno: solo le importa a este micro frontend
  let manejadores = null; // para poder retirar los listeners al desmontar

  function tarjetas() {
    const lista = PLATOS.filter((p) =>
      p.nombre.toLowerCase().includes(filtro.toLowerCase()),
    );
    if (lista.length === 0)
      return '<p class="cat-vacio">No hay platos que coincidan.</p>';
    return lista
      .map(
        (p) => `
      <article class="cat-tarjeta">
        <div class="cat-categoria">${p.categoria}</div>
        <div class="cat-nombre">${p.nombre}</div>
        <div class="cat-precio">${pesos.format(p.precio)}</div>
        <button class="cat-boton" data-id="${p.id}">Agregar al carrito</button>
      </article>`,
      )
      .join("");
  }

  window.renderCatalogo = function (idContenedor) {
    asegurarEstilos();
    const raiz = document.getElementById(idContenedor);
    raiz.innerHTML = `
      <h2 class="cat-titulo">Catálogo de platos</h2>
      <span class="cat-version">mfe-catalogo v${VERSION}</span>
      <input class="cat-buscar" placeholder="Buscar un plato..." value="${filtro}">
      <div class="cat-grilla">${tarjetas()}</div>`;

    const grilla = raiz.querySelector(".cat-grilla");
    const buscar = raiz.querySelector(".cat-buscar");

    manejadores = {
      raiz: raiz,
      click: function (e) {
        const boton = e.target.closest(".cat-boton");
        if (!boton) return;
        const plato = PLATOS.find((p) => p.id === Number(boton.dataset.id));
        // Comunicación indirecta: publicamos un evento y NO sabemos quién lo escucha
        window.dispatchEvent(
          new CustomEvent("carrito:agregar", {
            detail: {
              id: plato.id,
              nombre: plato.nombre,
              precio: plato.precio,
            },
          }),
        );
        boton.textContent = "¡Agregado!";
        setTimeout(function () {
          boton.textContent = "Agregar al carrito";
        }, 800);
      },
      input: function (e) {
        filtro = e.target.value;
        grilla.innerHTML = tarjetas();
      },
    };
    raiz.addEventListener("click", manejadores.click);
    buscar.addEventListener("input", manejadores.input);
  };

  window.unmountCatalogo = function (idContenedor) {
    const raiz = document.getElementById(idContenedor);
    if (manejadores) {
      manejadores.raiz.removeEventListener("click", manejadores.click);
      manejadores = null;
    }
    raiz.innerHTML = "";
  };
})();
