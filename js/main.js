// =========================================================
// CONOCE CHATGPT - JavaScript
// Menú igual al de la plantilla (abre y cierra con animación),
// "aparecer al bajar" sin ScrollReveal y la mini conversación escrita.
// =========================================================

// ---------- Menú del celular ----------
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

function cambiarBoton(abierto) {
  menuBtn.classList.toggle("is-open", abierto);
  menuBtn.setAttribute("aria-expanded", String(abierto));
  menuBtn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
}

menuBtn.addEventListener("click", () => {
  const abierto = navLinks.classList.contains("open");
  cambiarBoton(!abierto);
  if (abierto) {
    navLinks.classList.add("close");
    navLinks.addEventListener("animationend", () => {
      navLinks.classList.remove("open");
      navLinks.classList.remove("close");
    }, { once: true });
  } else {
    navLinks.classList.add("open");
  }
});

navLinks.addEventListener("click", e => {
  if (!e.target.closest("a")) return;
  navLinks.classList.remove("open");
  cambiarBoton(false);
});

// ---------- Aparecer al bajar (reemplaza a ScrollReveal) ----------
const observador = new IntersectionObserver(entradas => {
  entradas.forEach(entrada => {
    if (entrada.isIntersecting) {
      entrada.target.classList.add("visible");
      observador.unobserve(entrada.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observador.observe(el));

// ---------- Mini conversación que se escribe sola ----------
const respuesta = "Soy un asistente de inteligencia artificial creado por OpenAI. Puedo responder preguntas, explicar temas y ayudarte a escribir.";
const destino = document.getElementById("typing");
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (sinMovimiento) {
  destino.textContent = respuesta;
} else {
  let i = 0;
  function escribir() {
    destino.textContent = respuesta.slice(0, i);
    i++;
    if (i <= respuesta.length) {
      setTimeout(escribir, 28);
    } else {
      // vuelve a empezar después de una pausa
      setTimeout(() => { i = 0; escribir(); }, 6000);
    }
  }
  setTimeout(escribir, 700);
}

// ---------- Cifras con números que giran (como AnimatedNumber) ----------
const cifras = document.querySelectorAll(".stat__num");

function armarContador(el) {
  const valor = el.dataset.value;
  const sufijo = el.dataset.suffix || "";
  el.setAttribute("aria-label", valor + sufijo);
  el.innerHTML = "";
  valor.split("").forEach(() => {
    const digito = document.createElement("span");
    digito.className = "odo__digit";
    digito.setAttribute("aria-hidden", "true");
    const tira = document.createElement("span");
    tira.className = "odo__strip";
    for (let n = 0; n <= 9; n++) {
      const s = document.createElement("span");
      s.textContent = n;
      tira.appendChild(s);
    }
    digito.appendChild(tira);
    el.appendChild(digito);
  });
  if (sufijo) {
    const extra = document.createElement("span");
    extra.className = "odo__suffix";
    extra.setAttribute("aria-hidden", "true");
    extra.textContent = sufijo.trim();
    el.appendChild(extra);
  }
}

function girar(el) {
  const digitos = el.dataset.value.split("").map(Number);
  const tiras = el.querySelectorAll(".odo__strip");
  // primero vuelve todo a 0, sin animación
  tiras.forEach(t => { t.style.transition = "none"; t.style.transform = "translateY(0)"; });
  void el.offsetHeight; // obliga al navegador a aplicar el cambio
  tiras.forEach((t, i) => {
    t.style.transition = "";
    t.style.transitionDelay = `${i * 0.12}s`;
    t.style.transform = `translateY(-${digitos[i] * 1.25}em)`;
  });
  const total = 1100 + tiras.length * 120;
  el.classList.remove("flash");
  setTimeout(() => el.classList.add("flash"), total);
}

if (!sinMovimiento) {
  cifras.forEach(armarContador);

  const vigia = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        girar(entrada.target);
        vigia.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.6 });
  cifras.forEach(c => vigia.observe(c));

  document.querySelectorAll(".stat").forEach(stat => {
    stat.addEventListener("click", () => girar(stat.querySelector(".stat__num")));
  });
}

// ---------- Imagen que se deshace al bajar (como ScrollDissolveReveal) ----------
(function () {
  const pista = document.getElementById("dissolve-track");
  const lienzo = document.getElementById("dissolve-canvas");
  const textoPie = document.getElementById("dissolve-caption");
  const barra = document.getElementById("dissolve-bar");
  if (!pista || !lienzo || sinMovimiento) return;

  const ctx = lienzo.getContext("2d");
  const logo = new Image();
  logo.src = "img/logo-chatgpt.png";

  const CELDA = 12;            // tamaño de cada cuadrito en píxeles de pantalla
  let ancho = 0, alto = 0, escala = 1;
  let azar = [];               // un número al azar por cuadrito: decide cuándo se borra
  let columnas = 0, filas = 0;
  let ultimo = -1;

  function preparar() {
    const caja = lienzo.getBoundingClientRect();
    escala = window.devicePixelRatio || 1;
    ancho = caja.width; alto = caja.height;
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    columnas = Math.ceil(ancho / CELDA);
    filas = Math.ceil(alto / CELDA);
    azar = Array.from({ length: columnas * filas }, (_, k) => {
      // un poco de orden: se deshace más rápido desde los bordes hacia el centro
      const c = k % columnas, f = Math.floor(k / columnas);
      const dx = (c / columnas - .5), dy = (f / filas - .5);
      const borde = Math.min(1, Math.hypot(dx, dy) * 1.4);
      return Math.random() * .7 + (1 - borde) * .3;
    });
    ultimo = -1;
    dibujar(progreso());
  }

  function dibujarFrente() {
    // fondo del panel con un brillo dorado y el logo en el centro
    const g = ctx.createRadialGradient(ancho / 2, alto * .45, 10, ancho / 2, alto * .45, ancho * .6);
    g.addColorStop(0, "#1d4250");
    g.addColorStop(1, "#10303d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ancho, alto);
    if (logo.complete && logo.naturalWidth) {
      const lado = Math.min(ancho, alto) * .7;
      const proporcion = logo.naturalWidth / logo.naturalHeight;
      const w = lado * proporcion, h = lado;
      ctx.drawImage(logo, (ancho - w) / 2, (alto - h) / 2, w, h);
    }
  }

  function dibujar(p) {
    if (Math.abs(p - ultimo) < .002) return;
    ultimo = p;
    ctx.clearRect(0, 0, ancho, alto);
    dibujarFrente();
    // borra los cuadritos cuyo número al azar ya fue alcanzado
    for (let k = 0; k < azar.length; k++) {
      if (azar[k] < p) {
        const c = k % columnas, f = Math.floor(k / columnas);
        ctx.clearRect(c * CELDA, f * CELDA, CELDA, CELDA);
      }
    }
    barra.style.width = `${Math.round(p * 100)}%`;
    textoPie.textContent = p < .5
      ? "Así empezó: un logo y una idea en un laboratorio de investigación de San Francisco."
      : "Hoy: una app que millones de personas usan todos los días en su celular.";
  }

  function progreso() {
    const caja = pista.getBoundingClientRect();
    const recorrido = caja.height - window.innerHeight;
    const avance = Math.min(1, Math.max(0, -caja.top / recorrido));
    // se deshace entre el 15 % y el 85 % del recorrido
    return Math.min(1, Math.max(0, (avance - .15) / .7));
  }

  let pendiente = false;
  window.addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { dibujar(progreso()); pendiente = false; });
  }, { passive: true });
  window.addEventListener("resize", preparar);
  logo.addEventListener("load", () => { ultimo = -1; dibujar(progreso()); });
  preparar();
})();
