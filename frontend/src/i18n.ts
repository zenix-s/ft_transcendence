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
    User_Email: "User/Email",
    Password: "Password",
    User: "User",
    Email: "Email",
    Repeat_Password: "Repeat Password",
  },
  es: {
    start: "Comenzar",
    game: "Juego",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
    form_login_title: "Iniciar sesión",
    form_login_button: "Iniciar sesión",
    form_register_title: "Registrarse",
    User_Email: "Usuario/Email",
    Password: "Contraseña",
    User: "Usuario",
    Email: "Email",
    Repeat_Password: "Repetir Contraseña",
  },
  fr: {
    start: "Démarrer",
    game: "Jeu",
    title: "ft_transcendence",
    subtitle: "danjimen, isainz-r, serferna",
    form_login_title: "Se connecter",
    form_login_button: "Se connecter",
    form_register_title: "S'inscrire",
    User_Email: "Identifiant/Email",
    Password: "Mot de passe",
    User: "Identifiant",
    Email: "Email",
    Repeat_Password: "Répéter le mot de passe",
  },
};

export let currentLang: Language = "en";

/**
 * The function `setLanguage` sets the current language, saves it to local storage, updates texts, and
 * dispatches an event.
 * @param {Language} lang - The `lang` parameter in the `setLanguage` function is of type `Language`.
 * This parameter is used to specify the language that will be set as the current language for the
 * application.
 */
export function setLanguage(lang: Language) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  updateTexts();
  document.dispatchEvent(new Event("i18n-updated"));
}

/**
 * The function `t` takes a key as input and returns the corresponding translation in the current
 * language, or the key itself if the translation is not found.
 * @param {string} key - The `key` parameter in the `t` function is a string that represents the
 * translation key used to look up the corresponding translation in the `translations` object. If a
 * translation is found for the given key in the current language (`currentLang`), it is returned.
 * Otherwise, the key itself
 * @returns The function `t` is returning the translation for the provided `key` in the current
 * language (`currentLang`). If a translation for the key is found in the `translations` object for the
 * current language, it returns that translation. If a translation is not found, it returns the key
 * itself.
 */
export function t(key: string): string {
  return translations[currentLang][key] || key;
}

/**
 * The function `updateTexts` logs a message indicating the language being updated and then updates the
 * text content of elements with a `data-i18n` attribute using a translation function `t`.
 */
/* export function updateTexts() {
  console.log("🌐 Updating texts for language:", currentLang);

  document.querySelectorAll<HTMLElement>("[data-i18n], [placeholder]").forEach((el) => {
    if (el.hasAttribute("placeholder")) {
      console.log("Updating placeholder for element:", el);
      const placeholderKey = (el as HTMLInputElement).placeholder;
      (el as HTMLInputElement).placeholder = t(placeholderKey);
    } else if (el.dataset.i18n) {
      el.textContent = t(el.dataset.i18n);
    }
  });
} */

export function updateTexts() {
  console.log("🌐 Updating texts for language:", currentLang);
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
    if (el.hasAttribute("placeholder")) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });
}