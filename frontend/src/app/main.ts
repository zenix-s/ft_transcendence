import "@/app/styles/global.css";

import { navigateTo, handlePopState } from "@/app/navigation";
import { setupEventListeners } from "@/app/events";
import { applySavedColors } from "@/components/colorPicker";

//import { startGame } from "./game";

// Components
//import { GlitchButton } from "./components/GlitchButton";
import { GlitchButton } from "@/components/GlitchButton";
import { loadChart } from "@/components/graph";
import { matchTable, loadMatchHistory } from "@/components/history";
import { tournamentTable, loadTournamentsHistory } from "@/components/tournamentsHistory";
import { updateSliders } from "@/components/updateSliders";

// i18n
//import { setLanguage, t, currentLang } from "./i18n";
import { setLanguage, t, currentLang } from "@/app/i18n";

// Exponer utilidades al ámbito global
declare global {
  interface Window {
    GlitchButton: typeof GlitchButton;
  }
}
(window).GlitchButton = GlitchButton;

// Al cargar toda la SPA, aplica los colores guardados
applySavedColors();

// Detectar la página inicial según la URL actual
const initialPage = location.pathname.replace("/", "") || "home";
navigateTo(initialPage, true);

// 🌐 Inicializar WebSocket Social si hay token
import { createSocialSocket, getSocialSocket } from "@/modules/social/socketInstance";
import { SocialWebSocketClient } from "@/modules/social/socialSocket";


async function initSocialSocket(): Promise<SocialWebSocketClient | null> {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  let ws: SocialWebSocketClient | null = getSocialSocket();

  if (!ws) {
    console.log(`🌐 ${t("InitializingSocialWs")}`);
    ws = createSocialSocket(token);
    // Esperar a que el socket se conecte y autentique antes de continuar
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if ((ws?.getAuthenticated())) {
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
  langSelector.addEventListener("change", (event: Event) => {
    const select = event.target as HTMLSelectElement;
    setLanguage(select.value as "en" | "es" | "fr");
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

  const token = localStorage.getItem("access_token");

  // Reload Game History solo si existe tabla y hay token
  reloadGameHistory(token);

  // Reload Tournaments History solo si existe tabla y hay token
  reloadTournamentsHistory(token);

    updateSliders();
});

export async function reloadGameHistory(token: string | null) {
  if (matchTable && token) {
    const matchTableEl = matchTable.dom;
    const matchHeader = matchTableEl.parentElement?.querySelector<HTMLDivElement>(".datatable-header");
    const matchPerPageSelect = matchHeader?.querySelector<HTMLSelectElement>("select.datatable-selector");

    // 1. Guardar página actual
    const currentPage = matchTable._currentPage ?? 0;

    // 2 Guardar items por página
    const currentPerPage = matchPerPageSelect
    ? parseInt(matchPerPageSelect.value, 10)
    : matchTable.options.perPage; // usa el valor actual de la tabla

    // 3. Destruir tabla
    matchTable.destroy();

    // 4. Volver a cargar historial
    await loadMatchHistory(undefined, currentPerPage);

    // 5. Restaurar página en la que estabas
    if (currentPage > 0)
      matchTable.page(currentPage);
  }
}

export async function reloadTournamentsHistory(token: string | null) {
  if (tournamentTable && token) {
    const tableEl = tournamentTable.dom;
    const headerDiv = tableEl.parentElement?.querySelector<HTMLDivElement>(".datatable-header");
    const tournamentPerPageSelect = headerDiv?.querySelector<HTMLSelectElement>("select.datatable-selector");

    // 1. Guardar página actual
    const currentPage = matchTable._currentPage ?? 0;

    // 2 Guardar items por página
    const currentPerPage = tournamentPerPageSelect
    ? parseInt(tournamentPerPageSelect.value, 10)
    : tournamentTable.options.perPage; // usa el valor actual de la tabla

    // 3. Destruir tabla
    tournamentTable.destroy();

    // 4. Volver a cargar historial
    await loadTournamentsHistory(undefined, currentPerPage);

    // 5. Restaurar página en la que estabas
    if (currentPage > 0)
      tournamentTable.page(currentPage);
  }
}