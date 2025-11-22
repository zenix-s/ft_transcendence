import { t, updateTexts } from "@/app/i18n";
import Swal from 'sweetalert2';
import type { SweetAlertIcon } from 'sweetalert2';
import type { GameOptions } from "@/types/gameOptions";

export async function modal({
  type = "logout",
  player1Score,
  player2Score,
  winner,
  gameName,
}: {
  type?: "logout" | "gameFinished" | "gameInvitation" | "setReady" | "gameCreation",
  player1Score?: number,
  player2Score?: number,
  winner?: string,
  gameName?: string
} = {}): Promise<boolean | GameOptions> {
    const isDark = !document.documentElement.classList.contains("dark");

    /* GENERAL AND DEFAULT OPTIONS*/
    let title = "Action completed!";
    let titleText = "Action completed!";
    let text = "Everything went well.";
    let confirmButtonText = "OK";
    let cancelButtonText = "Cancel";
    let showCancelButton = false;
    const iconColor = "#00d3f2";
    const animation = true;
    let icon_msg: SweetAlertIcon | undefined = "success";
    const color_modal = isDark ? "#131313" : "#fff";
    const color_back = isDark ? "#fff" : "#131313";
    const backdrop = "rgba(0,0,0,0.8)"
    let allowOutsideClick = true;
    let allowEscapeKey = true;

    /* Overwrite options */
    if (type === "logout") {
      title = t("modalLogoutTitle");
      titleText = t("modalLogoutTitleText");
      text = t("modalLogoutText");
      confirmButtonText = t("modalLogoutConfirmButtonText");
      showCancelButton = true;
      cancelButtonText = t("modalLogoutCancelButtonText");
      icon_msg = "warning";
    }
    else if (type === "gameFinished") {
      const winnerName = winner;
      const scoreText = `${player1Score ?? 0} - ${player2Score ?? 0}`;

      let Winner = t("Winner");
      if (Winner === "AI_Player")
        Winner = t("AI");
      const Unknown = t("Unknown");
      const FinalScore = t("FinalScore");
      title = t("gameFinished");
      titleText = `🏆 ${Winner}: ${winnerName ?? Unknown}`;
      text = `${FinalScore}: ${scoreText}`;
      confirmButtonText = t("Return");
      icon_msg = undefined;
    }
    else if (type === "setReady")
    {
      title = t("SetReady");
      titleText = t("isReady");
      confirmButtonText = t("Ready");
      text = `${t("ClickReady")}<br><br><b></b>`;
      icon_msg = "question";
      showCancelButton = true;
      cancelButtonText = t("Cancel");
      allowOutsideClick = false;
      allowEscapeKey = false;
    }
    else if (type === "gameInvitation") {
      title = t("modalGameInvitationTitle");
      titleText = t("modalGameInvitationTitleText");
      const nameOfGame = gameName ? gameName : "";
      text = `${winner} ${t("modalGameInvitationText")} ${nameOfGame}`;
      confirmButtonText = `<i class="fa fa-thumbs-up"></i> ${t("modalGameInvitationConfirmButtonText")}`;
      showCancelButton = true;
      cancelButtonText = `<i class="fa fa-thumbs-down"></i> ${t("modalGameInvitationCancelButtonText")}`;
      icon_msg = "question";
      allowOutsideClick = false;
      allowEscapeKey = false;
    }
    else if (type === "gameCreation") {
      title = t("modalGameCreationTitle");
      titleText = t("modalGameCreationTitleText");
      confirmButtonText = `<i class="fa fa-thumbs-up"></i> ${t("modalGameCreationConfirmButtonText")}`;
      showCancelButton = true;
      cancelButtonText = `<i class="fa fa-thumbs-down"></i> ${t("modalGameCreationCancelButtonText")}`;
      icon_msg = undefined;
      allowOutsideClick = true;
      allowEscapeKey = true;
    }

    let timerInterval: ReturnType<typeof setInterval> | null = null;

    /* MAIN LOGIC */
    if (type !== "gameCreation") {
      const result = await Swal.fire({
        title,
        titleText,
        html: text,
        color: color_modal,
        icon: icon_msg,
        iconColor,
        showCancelButton,
        cancelButtonText: cancelButtonText,
        //cancelButtonColor: "#F00",
        confirmButtonText,
        buttonsStyling: false, // to use our own classes
        background: color_back,
        backdrop: backdrop,
        allowOutsideClick: allowOutsideClick,
        allowEscapeKey: allowEscapeKey,
        animation,
        timer: type === "setReady" ? 30000 : undefined,
        timerProgressBar: type === "setReady",
        customClass: {
          actions: "gap-10",
          confirmButton:
            "px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300",
          cancelButton:
            "px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300",
        },
        didOpen: () => {
          if (type === "setReady") {
            const timerEl = Swal.getHtmlContainer()?.querySelector("b");

            timerInterval = setInterval(() => {
              if (timerEl) timerEl.textContent = Math.ceil(Swal.getTimerLeft()! / 1000) + "s";
            }, 200);
          }
        },
        willClose: () => {
          if (timerInterval)
            clearInterval(timerInterval);
        },
      });
      if (result.isConfirmed) {
        if (type === "logout")
        {
          await Swal.fire({
            title: t("modalLogoutIsConfirmedTitle"),
            titleText: t("modalLogoutIsConfirmedTitle"),
            text:
              type === "logout"
                ? t("modalLogoutIsConfirmedText")
                : "Action completed successfully.",
            color: isDark ? "#fff" : "#131313",
            icon: "success",
            iconColor,
            confirmButtonText: t("modalLogoutIsConfirmedConfirmButtonText"),
            background: isDark ? "#131313" : "#ffffff",
            buttonsStyling: false,
            customClass: {
              confirmButton:
                "px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300",
            },
          });
        }
        return true;
      } else {
        return false;
      }
    } else {
      // Caso: gameCreation
      const { value: formValues } = await Swal.fire({
      title,
      titleText,
      color: color_modal,
      icon: undefined,
      showCancelButton,
      cancelButtonText: cancelButtonText,
      //cancelButtonColor: "#F00",
      confirmButtonText,
      buttonsStyling: false, // to use our own classes
      background: color_back,
      backdrop: backdrop,
      allowOutsideClick: allowOutsideClick,
      allowEscapeKey: allowEscapeKey,
      animation,
      customClass: {
        title: "text-balance",
        actions: "gap-10",
        confirmButton:
          "px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300",
        cancelButton:
          "px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300",
      },
      html: `
        <div class="flex flex-col gap-4 text-left">
        
        <!-- Puntos máximos -->
        <div class="flex flex-col gap-2">
          <label for="points-range" class="font-medium" role="tooltip" data-i18n="modalGameCreationmaxPoints">
            Points: <span id="points-value" class="font-semibold">5</span>
          </label>
          <input
            id="points-range"
            type="range"
            class="swal2-range accent-cyan-400"
            min="3" max="15" value="5" step="1"
          >
        </div>

        <!-- Tiempo máximo -->
        <div class="flex flex-col gap-2">
          <label for="time-range" class="font-medium" role="tooltip" data-i18n="modalGameCreationMaxTime">
            Time: <span id="time-value" class="font-semibold">120</span> s
          </label>
          <input
            id="time-range"
            type="range"
            class="swal2-range accent-cyan-400"
            min="30" max="300" value="120" step="30"
          >
        </div>

        <!-- Modo de juego -->
        <div class="flex flex-col gap-2">
          <p class="font-medium" data-i18n="modalGameCreationGameMode">Mode:</p>
          <div class="flex justify-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                id="mode-2D"
                name="mode-radio"
                value="2D"
                class="swal2-radio accent-cyan-400"
                checked
              >
              <span data-i18n="2D">2D</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                id="mode-3D"
                name="mode-radio"
                value="3D"
                class="swal2-radio accent-cyan-400"
              >
              <span data-i18n="3D">3D</span>
            </label>
          </div>
        </div>
      </div>
      `,
      focusConfirm: false,
      didOpen: () => {
        // Traducción después de insertar el HTML
        updateTexts();

        // Actualizar valores dinámicos de los sliders
        const pointsRange = document.getElementById("points-range") as HTMLInputElement;
        const pointsValue = document.getElementById("points-value")!;
        pointsRange.addEventListener("input", () => {
          pointsValue.textContent = pointsRange.value;
        });

        const timeRange = document.getElementById("time-range") as HTMLInputElement;
        const timeValue = document.getElementById("time-value")!;
        timeRange.addEventListener("input", () => {
          timeValue.textContent = timeRange.value;
        });
      },
      preConfirm: (): GameOptions => {
        const pointsInput = document.getElementById("points-range") as HTMLInputElement | null;
        const timeInput = document.getElementById("time-range") as HTMLInputElement | null;

        if (!pointsInput || !timeInput) {
          Swal.showValidationMessage("No se pudieron leer los valores de los sliders.");
          return {} as GameOptions; // devolver objeto vacío temporalmente
        }

        const points = Number(pointsInput.value);
        const time = Number(timeInput.value);
        const modeInput = document.querySelector('input[name="mode-radio"]:checked') as HTMLInputElement;

        const mode = modeInput?.value ?? "2D";

        return { maxPoints: points, maxTime: time, gameMode: mode };
      }
    });
    if (formValues) {
      // opcional: mostrar un resumen
      /* await Swal.fire({
        title: "Selected options",
        html: `<pre>${JSON.stringify(formValues, null, 2)}</pre>`,
        confirmButtonText: "OK"
      }); */
      
      return formValues; // Hay que devolver los datos en lugar de true
    } else
      return false;
  }
};
