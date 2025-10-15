import { t } from "@/app/i18n";
import Swal from 'sweetalert2'
//import Swal from 'sweetalert2/dist/sweetalert2.js'
//import 'sweetalert2/src/sweetalert2.scss'

export function modal(type: "success" | "logout" = "success"): Promise<boolean> {
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

    /* Overwrite options */
    if (type === "logout") {
      title = t("modalLogoutTitle");
      titleText = t("modalLogoutTitleText");
      text = t("modalLogoutText");
      confirmButtonText = t("modalLogoutConfirmButtonText");
      showCancelButton = true;
    } /* else if (type === "success") {
      title = "Action completed!";
      text = "Everything went well.";
      confirmButtonText = "OK";
    } */

    Swal.fire({
      title,
      titleText,
      text,
      color: isDark ? "#fff" : "#131313",
      icon: type === "success" ? "success" : "warning",
      iconColor,
      showCancelButton,
      cancelButtonText: t("modalLogoutCancelButtonText"),
      //cancelButtonColor: "#F00",
      confirmButtonText,
      buttonsStyling: false, // to use our own classes
      background: isDark ? "#131313" : "#ffffff",
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