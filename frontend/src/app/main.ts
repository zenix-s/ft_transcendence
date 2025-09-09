// import "./styles/style.css";
/* import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./components/counter.ts"; */

import "@/app/styles/global.css";

//import { navigateTo, handlePopState } from "./navigation";
import { navigateTo, handlePopState } from "@/app/navigation";
//import { setupEventListeners } from "./events";
import { setupEventListeners } from "@/app/events";
//import { loadAndRender, loadUserForCode, setupRegisterForm, validateLogin } from "./users";
import { loadAndRender, loadUserForCode } from "@/modules/users";

//import { startGame } from "./game";

// Components
//import { GlitchButton } from "./components/GlitchButton";
import { GlitchButton } from "@/components/GlitchButton";

// i18n
//import { setLanguage, t, currentLang } from "./i18n";
import { setLanguage, t, currentLang } from "@/app/i18n";

// Exponer utilidades al ámbito global
(window as any).loadAndRender = loadAndRender;
(window as any).loadUserForCode = loadUserForCode;
(window as any).GlitchButton = GlitchButton;

console.log("✅ main.ts cargado");

// Detectar la página inicial según la URL actual
const initialPage = location.pathname.replace("/", "") || "home";
navigateTo(initialPage);

// Configurar los eventos
setupEventListeners();
window.addEventListener("popstate", handlePopState);

// Ejecutar el setup del registro tras cada navegación
/* window.addEventListener("DOMContentLoaded", () => {
  if (location.pathname.includes("login")) {
    validateLogin();
    setupRegisterForm();
  }
}); */

// ====================
// 🌙 Toggle dark mode
// ====================
const toggle = document.getElementById("dark_mode_toggle");

console.log("🔍 toggle encontrado:", toggle);

if (toggle) {
  toggle.addEventListener("click", () => {
    console.log("👉 Botón clicado!");
    document.documentElement.classList.toggle("dark");

    // Guardar preferencia
    if (document.documentElement.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
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
document.addEventListener("i18n-updated", () => {
  renderButtons();
});