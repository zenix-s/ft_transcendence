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
    currentPassword: "Current Password",
    newPassword: "New Password",
    score: "SCORE",
    played_games: "games",
    logout: "logout",
    logout_confirm: "Are you sure you want to logout?",
    token_removed: "Token removed",
    invalidCredentialsError: "Invalid email or password",
    passwordDoNotMatch: "The passwords do not match",
    fillAllFields: "Please fill in all the fields",
    ErrorCreatingUser: "Error creating user",
    UserCreatedSuccessfully: "User created successfully",
    NetworkOrServerError: "Network or server error",
    welcome: "Welcome",
    ErrorTryingToLogIn: "Error trying to log in",
    NoTokenFound: "No token found. The user has probably not logged in",
    SessionExpiredOrInvalid: "Session expired or invalid. Please log in again",
    ErrorRetrievingProfile: "Error retrieving profile: ",
    UserNotFound: "User not found",
    pageNotFound: "Page not found",
    goBack: "Go back",
    settings: "Settings",
    statistics: "Statistics",
    dashboard: "Dashboard",
    onePlayerGame: "1 player game",
    playBot: "play against a bot",
    multiplayer: "multiplayer",
    playOthers: "play with others",
    invalidUsername: "Invalid username:\n  - It must be between 3 and 20 characters long.\n  - It can only contain letters, numbers, hyphens, and underscores.",
    invalidEmail: "Invalid email:\n  - Correct format: user@domain.TLD",
    invalidPassword: "Incorrect password:\n  - Minimum 8 characters.\n  - At least one uppercase letter.\n  - At least one lowercase letter.\n  - At least one digit.",
    toolTipUsername: "- It must be between 3 and 20 characters long.\n  - It can only contain letters, numbers, hyphens, and underscores.<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    toolTipEmail: "- Correct format: user@domain.TLD<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    toolTipPassword: "- Minimum 8 characters.\n  - At least one uppercase letter.\n  - At least one lowercase letter.\n  - At least one digit.<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    win: "Win",
    lose: "Lose",
    gameHistory: "Game history",
    opponent: "Opponent",
    result: "Result",
    winner: "Winner",
    date: "Date",
    search: "Search…",
    perPage: "per page",
    noGames: "No games recorded",
    showing: "Showing",
    to: "to",
    of: "of",
    games: "games",
    userSettings: "User Settings",
    gameSettings: "Game Settings",
    update: "Update",
    player1: "PLAYER",
    AI: "AI",
    maxPoints: "Max Points:",
    difficultyAI: "AI Difficulty:",
    avatarSelection: "Avatar selection",
    updateAvatar: "Update Avatar",
    updateUserName: "Update User Name",
    updatePassword: "Update Password",
    dragAndDrop: "Drag and drop your avatar here",
    clickToSelect: "(Or click to select)",
    avatarElementsNotFound: "❌ Uploader avatar elements not found in the DOM",
    selectValidImage: "Please select a valid image.",
    selectImageFile: "First select an image file.",
    avatarUpdatedSuccessfully: "✅ Avatar updated successfully",
    errorUploadingAvatar: "❌ Error uploading avatar",
    couldNotConnectToTheServer: "⚠️ Could not connect to the server",
    userName: "User name",
    newUserName: "New user name",
    userNameElementsNotFound: "❌ User loader elements not found in the DOM",
    UserNameUpdatedSuccessfully: "User name updated successfully",
    ErrorUpdatingUserName: "Error updating user name",
    ErrorUpdatingPassword: "Error updating password",
    passwordUpdatedSuccessfully: "Password updated successfully",
    redirectingToHome: "Redirecting to home",
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
    currentPassword: "Contraseña Actual",
    newPassword: "Nueva Contraseña",
    score: "PUNTOS",
    played_games: "partidas",
    logout: "cerrar sesión",
    logout_confirm: "¿Seguro que quieres cerrar sesión?",
    token_removed: "Token eliminado",
    invalidCredentialsError: "E-mail o contraseña inválidos",
    passwordDoNotMatch: "Las contraseñas no coinciden",
    fillAllFields: "Por favor, rellena todos los campos",
    ErrorCreatingUser: "Error al crear usuario",
    UserCreatedSuccessfully: "Usuario creado correctamente",
    NetworkOrServerError: "Error de red o servidor",
    welcome: "Bienvenido",
    ErrorTryingToLogIn: "Error al intentar iniciar sesión",
    NoTokenFound: "No se encontró ningún token. Probablemente el usuario no haya iniciado sesión",
    SessionExpiredOrInvalid: "Sesión expirada o inválida. Por favor, inicia sesión nuevamente",
    ErrorRetrievingProfile: "Error al obtener el perfil: ",
    UserNotFound: "Usuario no encontrado",
    pageNotFound: "Página no encontrada",
    goBack: "Volver",
    settings: "Configuración",
    statistics: "Estadísticas",
    dashboard: "Panel de control",
    onePlayerGame: "1 jugador/a",
    playBot: "jugar contra un bot",
    multiplayer: "multijugador",
    playOthers: "jugar con otros/as",
    invalidUsername: "Nombre de usuario inválido:\n  - Debe tener entre 3 y 20 caracteres.\n  - Solo puede contener letras, números, guiones y guiones bajos.",
    invalidEmail: "Correo electrónico inválido:\n  - Formato correcto: usuario@dominio.TLD",
    invalidPassword: "Contraseña incorrecta:\n  - Mínimo 8 caracteres.\n  - Al menos una letra mayúscula.\n  - Al menos una letra minúscula.\n  - Al menos un dígito.",
    toolTipUsername: "- Debe tener entre 3 y 20 caracteres.\n  - Solo puede contener letras, números, guiones y guiones bajos.<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    toolTipEmail: "- Formato correcto: usuario@dominio.TLD<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    toolTipPassword: "- Mínimo 8 caracteres.\n  - Al menos una letra mayúscula.\n  - Al menos una letra minúscula.\n  - Al menos un dígito.<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    win: "Victórias",
    lose: "Derrotas",
    gameHistory: "Historial de partidas",
    opponent: "Oponente",
    result: "Resultado",
    winner: "Ganador",
    date: "Fecha",
    search: "Buscar...",
    perPage: "por página",
    noGames: "No hay partidas registradas",
    showing: "Mostrando",
    to: "a",
    of: "de",
    games: "partidas",
    userSettings: "Configuración de usuario",
    gameSettings: "Configuración del juego",
    update: "Actualizar",
    player1: "JUGADOR",
    AI: "IA",
    maxPoints: "Puntos Máximos:",
    difficultyAI: "Dificultad de la IA:",
    avatarSelection: "Selección de avatar",
    updateAvatar: "Actualizar Avatar",
    updateUserName: "Actualizar Nombre de Usuario",
    updatePassword: "Actializar Contraseña",
    dragAndDrop: "Arrastra y suelta tu avatar aquí",
    clickToSelect: "(O haz click para seleccionar)",
    avatarElementsNotFound: "❌ Elementos del cargador de avatar no encontrados en el DOM",
    selectValidImage: "Por favor selecciona una imagen válida.",
    selectImageFile: "Primero selecciona un archivo de imagen.",
    avatarUpdatedSuccessfully: "✅ Avatar actualizado correctamente",
    errorUploadingAvatar: "❌ Error al subir el avatar",
    couldNotConnectToTheServer: "⚠️ No se pudo conectar con el servidor",
    userName: "Nombre de usuario",
    newUserName: "Nuevo nombre de usuario",
    userNameElementsNotFound: "❌ Elementos del cargador de usuario no encontrados en el DOM",
    UserNameUpdatedSuccessfully: "Nombre de usuario actualizado correctamente",
    ErrorUpdatingUserName: "Error al actualizar el nombre de usuario",
    ErrorUpdatingPassword: "Error al actualizar la contraseña",
    passwordUpdatedSuccessfully: "Contraseña actualizada correctamente",
    redirectingToHome: "Redirigiendo al inicio",
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
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    score: "POINTS",
    played_games: "jeux",
    logout: "se déconnecter",
    logout_confirm: "Êtes-vous sûr de vouloir vous déconnecter ?",
    token_removed: "Jeton supprimé",
    invalidCredentialsError: "E-mail ou mot de passe invalide",
    passwordDoNotMatch: "Les mots de passe ne correspondent pas",
    fillAllFields: "Veuillez remplir tous les champs",
    ErrorCreatingUser: "Erreur lors de la création de l'utilisateur",
    UserCreatedSuccessfully: "Utilisateur créé avec succès",
    NetworkOrServerError: "Erreur de réseau ou de serveur",
    welcome: "Bienvenue",
    ErrorTryingToLogIn: "Erreur lors de la tentative de connexion",
    NoTokenFound: "Aucun jeton trouvé. L'utilisateur ne s'est probablement pas connecté",
    SessionExpiredOrInvalid: "Session expirée ou invalide. Veuillez vous reconnecter",
    ErrorRetrievingProfile: "Erreur lors de la récupération du profil: ",
    UserNotFound: "Utilisateur non trouvé",
    pageNotFound: "Page non trouvée",
    goBack: "Retour",
    settings: "Paramètres",
    statistics: "Statistiques",
    dashboard: "Tableau de bord",
    onePlayerGame: "1 joueur",
    playBot: "jouer contre un bot",
    multiplayer: "multijoueur",
    playOthers: "jouer avec les autres",
    invalidUsername: "Nom d'utilisateur invalide:\n  - Il doit contenir entre 3 et 20 caractères.\n  - Il peut uniquement contenir des lettres, des chiffres, des tirets et des tirets bas.",
    invalidEmail: "Email invalide:\n  - Format correct : utilisateur@domaine.TLD",
    invalidPassword: "Mot de passe incorrect:\n  - Minimum 8 caractères.\n  - Au moins une lettre majuscule.\n  - Au moins une lettre minuscule.\n  - Au moins un chiffre.",
    toolTipUsername: "- Il doit contenir entre 3 et 20 caractères.\n  - Il peut uniquement contenir des lettres, des chiffres, des tirets et des tirets bas.<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    toolTipEmail: "- Format correct : utilisateur@domaine.TLD<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    toolTipPassword: "- Minimum 8 caractères.\n  - Au moins une lettre majuscule.\n  - Au moins une lettre minuscule.\n  - Au moins un chiffre.<div class='absolute left-1/2 -bottom-1 w-2 h-2 bg-secondary dark:bg-primary rotate-45 -translate-x-1/2'></div>",
    win: "Victoires",
    lose: "Défaites",
    gameHistory: "Historique des parties",
    opponent: "Adversaire",
    result: "Résultat",
    winner: "Gagnant",
    date: "Date",
    search: "Rechercher...",
    perPage: "par page",
    noGames: "Aucune partie enregistrée",
    showing: "Affichage de",
    to: "à",
    of: "sur",
    games: "parties",
    userSettings: "Paramètres utilisateur",
    gameSettings: "Paramètres du jeu",
    update: "Actualiser",
    player1: "JOUEUR",
    AI: "AI",
    maxPoints: "Points Maximum:",
    difficultyAI: "Difficulté de l'IA:",
    avatarSelection: "Sélection d'avatar",
    updateAvatar: "Actualiser l'avatar",
    updateUserName: "Actualiser le nom d'utilisateur",
    updatePassword: "Actualiser le mot de passe",
    dragAndDrop: "Faites glisser et déposez votre avatar ici",
    clickToSelect: "(Ou cliquez pour sélectionner)",
    avatarElementsNotFound: "❌ Éléments du chargeur d'avatar introuvables dans le DOM",
    selectValidImage: "Veuillez sélectionner une image valide.",
    selectImageFile: "Sélectionnez d’abord un fichier image.",
    avatarUpdatedSuccessfully: "✅ Avatar mis à jour avec succès",
    errorUploadingAvatar: "❌ Erreur lors du téléchargement de l'avatar",
    couldNotConnectToTheServer: "⚠️ Impossible de se connecter au serveur",
    userName: "Nom d'utilisateur",
    newUserName: "Nouveau nom d'utilisateur",
    userNameElementsNotFound: "❌ Éléments du chargeur utilisateur introuvables dans le DOM",
    UserNameUpdatedSuccessfully: "Nom d'utilisateur mis à jour avec succès",
    ErrorUpdatingUserName: "Erreur lors de la mise à jour du nom d'utilisateur",
    ErrorUpdatingPassword: "Erreur lors de la mise à jour du mot de passe",
    passwordUpdatedSuccessfully: "Mot de passe mis à jour avec succès",
    redirectingToHome: "Redirection vers l’accueil",
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
    const translated = t(key); // Traducción obtenida

    if (el.hasAttribute("data-label")) {
      // 🔹 Si el elemento tiene data-label, SOLO se traduce ese atributo
      el.setAttribute("data-label", translated);
    } else if (el.getAttribute("role") === "tooltip") {
      el.innerHTML = translated; // Permite HTML en tooltips
    } else {
      // 🔹 Si NO tiene data-label, se traduce el contenido visible
      el.textContent = translated;
    }

    // Caso adicional: placeholder (inputs, textareas, etc.)
    if (el.hasAttribute("placeholder")) {
      (el as HTMLInputElement).placeholder = translated;
    }
  });
}

/* export function updateTexts() {
  console.log("🌐 Updating texts for language:", currentLang);
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n!;
    el.textContent = t(key);
    if (el.hasAttribute("placeholder")) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });
} */