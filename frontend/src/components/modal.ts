import { t } from "@/app/i18n";
import Swal from 'sweetalert2';
import type { SweetAlertIcon } from 'sweetalert2';

export function modal(type: "success" | "logout" | "gameFinished" = "success", player1?: any, player2?: any, winner?: any): Promise<boolean> {
  return new Promise((resolve) => {
    const isDark = !document.documentElement.classList.contains("dark");

    /* GENERAL AND DEFAULT OPTIONS*/
    let title = "Action completed!";
    let titleText = "Action completed!";
    let text = "Everything went well.";
    let confirmButtonText = "OK";
    let showCancelButton = false;
    let iconColor = "#00d3f2";
    let animation = true;
    let icon_msg: SweetAlertIcon | undefined = "success";
    let color_modal = isDark ? "#fff" : "#131313";
    let color_back = isDark ? "#131313" : "#ffffff";

    /* Overwrite options */
    if (type === "logout") {
      title = t("modalLogoutTitle");
      titleText = t("modalLogoutTitleText");
      text = t("modalLogoutText");
      confirmButtonText = t("modalLogoutConfirmButtonText");
      showCancelButton = true;
      icon_msg = "warning";
    }
    else if (type === "gameFinished") {
      const winnerName = winner;
      const scoreText = `${player1.score ?? 0} - ${player2.score ?? 0}`;

      title = "GAME FINISHED";
      titleText = `🏆 Winner: ${winnerName ?? "Unknown"}`;
      text = `Final Score: ${scoreText}`;
      confirmButtonText = "Return";
      icon_msg = undefined;
      color_modal = "#131313";
      color_back = "#ffffff";
    }

    Swal.fire({
      title,
      titleText,
      text,
      color: color_modal,
      icon: icon_msg,
      iconColor,
      showCancelButton,
      cancelButtonText: t("modalLogoutCancelButtonText"),
      //cancelButtonColor: "#F00",
      confirmButtonText,
      buttonsStyling: false, // to use our own classes
      background: color_back,
      animation,
      customClass: {
        actions: "gap-10",
        confirmButton:
          "px-4 py-2 rounded-lg font-medium bg-cyan-300 hover:bg-cyan-500 text-gray-800 ml-2 dark:bg-cyan-700 dark:hover:bg-cyan-900 dark:text-gray-100 transition-all duration-300",
        cancelButton:
          "px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-800 text-primary ml-2 dark:bg-rose-600 dark:hover:bg-rose-800 dark:text-primary transition-all duration-300",
      },
    }).then((result) => {
      if (result.isConfirmed && type != "gameFinished") {
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
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}