import { t } from "@/app/i18n";
import { showToast } from "./toast";
import { getCurrentUser } from "@/modules/users";

/**
 * Módulo para manejar drag & drop y vista previa de un avatar.
 */

export function setupAvatarUpload() {
  const dropZone = document.getElementById("avatarDropZone") as HTMLElement | null;
  const fileInput = document.getElementById("avatarFileInput") as HTMLInputElement | null;
  const preview = document.getElementById("avatarPreview") as HTMLImageElement | null;
  const updateAvatarBtn = document.getElementById("updateAvatar") as HTMLButtonElement | null;

  if (!dropZone || !fileInput || !preview || !updateAvatarBtn) {
    console.warn(t("avatarElementsNotFound"));
    return;
  }

  // 👉 Clases base y de highlight
  const highlightClasses = [
    "border-blue-500",
    "bg-blue-50",
    "dark:bg-blue-900/30",
    "animate-pulse"
  ];

  // 💡 Arrastrar encima
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add(...highlightClasses);
  });

  // 💡 Sale del área
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove(...highlightClasses);
  });

  // 💡 Soltar archivo
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove(...highlightClasses);

    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  // 💡 Click para abrir el selector
  dropZone.addEventListener("click", () => fileInput.click());

  // 💡 Selección manual de archivo
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) handleFile(file);
  });

  // 👉 Previsualización
  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      showToast(t("selectValidImage"), "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      preview!.src = result;
      preview!.classList.remove("hidden");
      dropZone!.querySelectorAll("p").forEach(p => p.classList.add("hidden"));
    };
    reader.readAsDataURL(file);

    // Guardamos el archivo para su posterior envío
    (window as any).selectedAvatarFile = file;
  }

  // 💾 Subida al backend
  updateAvatarBtn!.addEventListener("click", async () => {
    const file = (window as any).selectedAvatarFile as File | undefined;

    if (!file) {
      showToast(t("selectImageFile"), "error");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch("/api/user-manager/upload-avatar", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
      });

      if (response.ok) {
        // Recuperar la url de la bbdd
        const userResponse = await getCurrentUser();
        if (!userResponse) return; // ❌ si falla, aborta todo

        // Guardar ruta del avatar con la url devuelta por el backend
        const avatarSrc = "https://localhost:3000" + userResponse.user.avatar;

        // ✅ Actualizar avatar en la web
        const avatarElement = document.getElementById("user-avatar");
        if (avatarElement instanceof HTMLImageElement) {
          avatarElement.src = avatarSrc;
        }

        showToast(t("avatarUpdatedSuccessfully"));
      } else {
        const data = await response.json();
        const errorcode = data.error || "errorUploadingAvatar";
        if (errorcode === "InvalidRequest")
          showToast(t("InvalidImageFormat"), "error");
        else
          showToast(t(errorcode), "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t("couldNotConnectToTheServer"), "error");
    }
  });
}