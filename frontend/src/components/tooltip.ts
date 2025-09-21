// src/components/tooltip.ts
export class Tooltip {
  private inputs: NodeListOf<HTMLInputElement>;

  constructor() {
    this.inputs = document.querySelectorAll<HTMLInputElement>("[data-tooltip-target]");
  }

  public init(): void {
    this.inputs.forEach((input) => {
      console.log("Tooltip detectado");
      const tooltipId = input.getAttribute("data-tooltip-target");
      if (!tooltipId) return;

      const tooltip = document.querySelector<HTMLDivElement>(`[data-tooltip="${tooltipId}"]`);
      if (!tooltip) return;

      // Mostrar tooltip al enfocar
      input.addEventListener("focus", () => {
        tooltip.classList.add("opacity-100", "scale-100");
        tooltip.classList.remove("pointer-events-none");
      });

      // Ocultar tooltip al perder el foco
      input.addEventListener("blur", () => {
        tooltip.classList.remove("opacity-100", "scale-100");
        tooltip.classList.add("pointer-events-none");
      });
    });
  }
}
