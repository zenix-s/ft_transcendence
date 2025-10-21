import "@/app/styles/global.css";

import { navigateTo, handlePopState } from "@/app/navigation";
import { setupEventListeners } from "@/app/events";
import { loadAndRender, loadUserForCode } from "@/modules/users";
import { applySavedColors } from "@/components/colorPicker";

//import { startGame } from "./game";

// Components
//import { GlitchButton } from "./components/GlitchButton";
import { GlitchButton } from "@/components/GlitchButton";
import { loadChart } from "@/components/graph";
import { matchTable, loadMatchHistory } from "@/components/history";

// i18n
//import { setLanguage, t, currentLang } from "./i18n";
import { setLanguage, t, currentLang } from "@/app/i18n";

// Exponer utilidades al ámbito global
(window as any).loadAndRender = loadAndRender;
(window as any).loadUserForCode = loadUserForCode;
(window as any).GlitchButton = GlitchButton;

// Al cargar toda la SPA, aplica los colores guardados
applySavedColors();

// Detectar la página inicial según la URL actual
const initialPage = location.pathname.replace("/", "") || "home";
navigateTo(initialPage, true);

// 🌐 Inicializar WebSocket Social si hay token
import { createSocialSocket, getSocialSocket } from "@/modules/social/socketInstance";

async function initSocialSocket() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  let ws = getSocialSocket();
  if (!ws) {
    console.log("🌐 Inicializando WebSocket Social desde main.ts");
    ws = createSocialSocket(token);
    // Esperar a que el socket se conecte y autentique antes de continuar
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if ((ws as any).isAuthenticated) { // marca pública o usa un getter
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  return ws;
}

// Inicializa el WebSocket al cargar
initSocialSocket();

// Configurar los eventos
setupEventListeners();
window.addEventListener("popstate", handlePopState);

// ====================
// 🌙 Toggle dark mode
// ====================
const toggle = document.getElementById("dark_mode_toggle");

// console.log("🔍 toggle encontrado:", toggle); // DB

if (toggle) {
  toggle.addEventListener("click", () => {
    // console.log("👉 Botón clicado!"); // DB
    document.documentElement.classList.toggle("dark");

    // Guardar preferencia
    if (document.documentElement.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }

    //Reload doughnut
    // Obtener el canvas
    const ctx = document.getElementById("donutChart") as HTMLCanvasElement | null;
    if (ctx) { loadChart(); }
  });
}

// Aplicar preferencia previa al cargar
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// ====================
// 🌐 Languajes
// ====================
const savedLang = (localStorage.getItem("lang") as "en" | "es" | "fr" | null);
if (savedLang) {
  setLanguage(savedLang);
} else {
  setLanguage("en");
}

// 👇 Aquí forzamos render inicial de botones
renderButtons();

// Conectar selector del DOM
const langSelector = document.getElementById("lang_selector") as HTMLSelectElement | null;
if (langSelector) {
  langSelector.value = savedLang || currentLang;
  langSelector.addEventListener("change", (e) => {
    setLanguage((e.target as HTMLSelectElement).value as any);
  });
}

// ====================
// 🕹️ Translated buttons
// ====================
export function renderButtons() {
  document.querySelectorAll<HTMLElement>("[data-button]").forEach((container) => {
    const key = container.dataset.button!;   // ejemplo: "start", "game"
    const page = container.dataset.page || "";

    container.innerHTML = "";
    container.appendChild(GlitchButton(t(key), "", page));
  });
}

// Render inicial
renderButtons();

// Cuando cambie idioma, vuelve a renderizar
document.addEventListener("i18n-updated", async () => {
  renderButtons();
  //Reload doughnut
  // Obtener el canvas
  const ctx = document.getElementById("donutChart") as HTMLCanvasElement | null;
  if (ctx) { loadChart(); }

  // Reload History solo si existe tabla y hay token
  const token = localStorage.getItem("access_token");
  const perPageSelect = document.querySelector<HTMLSelectElement>(".datatable-selector");
  if (perPageSelect && matchTable && token) {
    const currentPerPage = parseInt(perPageSelect.value, 10);
    matchTable.destroy();
    await loadMatchHistory(undefined, currentPerPage);
  }
});