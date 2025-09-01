// src/i18n.ts
type Language = "en" | "es" | "fr";

export const translations: Record<Language, Record<string, string>> = {
  en: {
    start: "Start",
    game: "Game",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
  },
  es: {
    start: "Comenzar",
    game: "Juego",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
  },
  fr: {
    start: "Démarrer",
    game: "Jeu",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
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

export function updateTexts() {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
  });
}
