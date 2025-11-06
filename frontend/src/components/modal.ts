import { t } from "@/app/i18n";
import Swal from 'sweetalert2';
import type { SweetAlertIcon } from 'sweetalert2';

export function modal(type: "logout" | "gameFinished" | "gameInvitation" = "logout", player1Score?: number, player2Score?: number, winner?: string, gameName?: string): Promise<boolean> {
  return new Promise((resolve) => {
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

      // INÉS, tienes que incluir las traducciones de texto en i18n.ts
      title = "GAME FINISHED";
      titleText = `🏆 Winner: ${winnerName ?? "Unknown"}`;
      text = `Final Score: ${scoreText}`;
      confirmButtonText = "Return";
      icon_msg = undefined;
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

    Swal.fire({
      title,
      titleText,
      text,
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
      customClass: {
        actions: "gap-10",
        confirmButton:
          "px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300",
        cancelButton:
          "px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        if (type === "logout")
        {
          Swal.fire({
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
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}