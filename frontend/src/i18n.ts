// src/i18n.ts
type Language = "en" | "es" | "fr";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    start: "Start",
    game: "Game",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
    form_login_title: "Login",
    form_login_button: "Login",
    form_register_title: "Register",
  },
  es: {
    start: "Comenzar",
    game: "Juego",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
    form_login_title: "Iniciar sesión",
    form_login_button: "Iniciar sesión",
    form_register_title: "Registrarse",
  },
  fr: {
    start: "Démarrer",
    game: "Jeu",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
    form_login_title: "Se connecter",
    form_login_button: "Se connecter",
    form_register_title: "S'inscrire",
  },
};

export let currentLang: Language = "en";

export function setLanguage(lang: Language) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  updateTexts();
  document.dispatchEvent(new Event("i18n-updated"));
}

export function t(key: string): string {
  return translations[currentLang][key] || key;
}

/**
 * The function `updateTexts` logs a message indicating the language being updated and then updates the
 * text content of elements with a `data-i18n` attribute using a translation function `t`.
 */
export function updateTexts() {
  console.log("🌐 Updating texts for language:", currentLang);
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
  });
}
