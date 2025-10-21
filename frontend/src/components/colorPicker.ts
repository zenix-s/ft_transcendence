function getUserKey(key: string) {
  const userId = localStorage.getItem("userId");
  return userId ? `${userId}_${key}` : key;
}

export function applySavedColors() {
  const root = document.documentElement;
  const DEFAULT_PRIMARY = "#ffffff";
  const DEFAULT_SECONDARY = "#131313";

  const userId = localStorage.getItem("userId");

  if (userId) {
    // Si hay usuario, aplicamos solo los colores del usuario (si existen)
    const savedPrimary = localStorage.getItem(`${userId}_color_primary`) || DEFAULT_PRIMARY;
    const savedSecondary = localStorage.getItem(`${userId}_color_secondary`) || DEFAULT_SECONDARY;
    root.style.setProperty("--color-primary", savedPrimary);
    root.style.setProperty("--color-secondary", savedSecondary);
  } else {
    // Sin usuario: forzamos valores por defecto (ignoramos claves globales antiguas)
    root.style.setProperty("--color-primary", DEFAULT_PRIMARY);
    root.style.setProperty("--color-secondary", DEFAULT_SECONDARY);
  }
}

export function setupColorPicker() {
  const root = document.documentElement;
  const colorPrimaryInput = document.getElementById("color_primary") as HTMLInputElement | null;
  const colorSecondaryInput = document.getElementById("color_secondary") as HTMLInputElement | null;
  const colorResetBtn = document.getElementById("color_reset") as HTMLButtonElement | null;

  if (!colorPrimaryInput || !colorSecondaryInput || !colorResetBtn) {
    console.warn("🎨 ColorPicker: elementos no encontrados en el DOM.");
    return;
  }

  // Valores por defecto
  const DEFAULT_PRIMARY = "#ffffff";
  const DEFAULT_SECONDARY = "#131313";

  // Aplicar colores guardados por el usuario actual
  const savedPrimary =
    localStorage.getItem(getUserKey("color_primary")) || DEFAULT_PRIMARY;
  const savedSecondary =
    localStorage.getItem(getUserKey("color_secondary")) || DEFAULT_SECONDARY;

  root.style.setProperty("--color-primary", savedPrimary);
  root.style.setProperty("--color-secondary", savedSecondary);

  colorPrimaryInput.value = savedPrimary;
  colorSecondaryInput.value = savedSecondary;

  // Escuchar cambios en los inputs
  colorPrimaryInput.addEventListener("input", (e) => {
    const newColor = (e.target as HTMLInputElement).value;
    root.style.setProperty("--color-primary", newColor);
    localStorage.setItem(getUserKey("color_primary"), newColor);
  });

  colorSecondaryInput.addEventListener("input", (e) => {
    const newColor = (e.target as HTMLInputElement).value;
    root.style.setProperty("--color-secondary", newColor);
    localStorage.setItem(getUserKey("color_secondary"), newColor);
  });

  // Botón de reset
  colorResetBtn.addEventListener("click", (event) => {
	event.preventDefault();
    root.style.setProperty("--color-primary", DEFAULT_PRIMARY);
    root.style.setProperty("--color-secondary", DEFAULT_SECONDARY);
    localStorage.removeItem(getUserKey("color_primary"));
    localStorage.removeItem(getUserKey("color_secondary"));

    colorPrimaryInput.value = DEFAULT_PRIMARY;
    colorSecondaryInput.value = DEFAULT_SECONDARY;
  });

  console.log("🎨 ColorPicker inicializado correctamente.");
}

/**
 * Si vienen claves globales antiguas (color_primary/color_secondary),
 * las migramos al namespace del usuario (userId_color_primary) y eliminamos las globales.
 * Llamar justo después de setear localStorage.setItem("userId", userId)
 */
export function migrateLegacyColorsToUser(userId: string) {
  if (!userId) return;

  const globalPrimary = localStorage.getItem("color_primary");
  const globalSecondary = localStorage.getItem("color_secondary");

  // Si no hay datos globales, no hacemos nada
  if (!globalPrimary && !globalSecondary) return;

  // Si ya existen claves del usuario, no sobrescribimos (evitamos perder su configuración)
  const userPrimaryKey = `${userId}_color_primary`;
  const userSecondaryKey = `${userId}_color_secondary`;

  if (!localStorage.getItem(userPrimaryKey) && globalPrimary) {
    localStorage.setItem(userPrimaryKey, globalPrimary);
  }
  if (!localStorage.getItem(userSecondaryKey) && globalSecondary) {
    localStorage.setItem(userSecondaryKey, globalSecondary);
  }

  // Borrar las claves globales antiguas para evitar confusión futura
  localStorage.removeItem("color_primary");
  localStorage.removeItem("color_secondary");
}