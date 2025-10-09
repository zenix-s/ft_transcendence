import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

export function showToast(message: string, type: "success" | "error" = "success", duration = 3000) {
  Toastify({
    text: message,
    duration: duration,
    gravity: "top", // top o bottom
    position: "right", // left, center, right
    close: true, // botón de cerrar
    className: type === "success" ? "toast-success" : "toast-error",
    stopOnFocus: true, // detener el timer si el usuario pasa el ratón
  }).showToast();
}

/* export function showToast(message: string, type: "success" | "error" = "success", duration = 3000) {
  Toastify({
    text: message,
    duration: duration,
    gravity: "top", // top o bottom
    position: "right", // left, center, right
    close: true, // botón de cerrar
    className: type === "success" ? "toast-success" : "toast-error",
    stopOnFocus: true, // detener el timer si el usuario pasa el ratón
    style: {
      background: type === "success" ? "#4ade80" : "#f87171", // verde o rojo
      color: "#000",
    },
    closeClassName: "toastify-close", // Aplica la clase personalizada al botón de cierre
    closeStyle: {
      color: "#131313", // Cambia el color de la "X" de cierre
    },
  }).showToast();
} */