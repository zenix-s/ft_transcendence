// src/components/tooltip.ts
export class Tooltip {
    private inputs: NodeListOf<HTMLInputElement>;

    constructor() {
        this.inputs = document.querySelectorAll<HTMLInputElement>(
            '[data-tooltip-target]'
        );
    }

    public init(): void {
        this.inputs.forEach((input) => {
            const tooltipId = input.getAttribute('data-tooltip-target');
            if (!tooltipId) return;

            const tooltip = document.querySelector<HTMLDivElement>(
                `[data-tooltip="${tooltipId}"]`
            );
            if (!tooltip) return;

            // Determinar si el elemento es un input
            const isInput =
                input.tagName === 'INPUT' ||
                input.tagName === 'TEXTAREA' ||
                input.tagName === 'SELECT';

            if (isInput) {
                // 🎯 Caso formulario → focus / blur
                input.addEventListener('focus', () =>
                    this.showTooltip(tooltip)
                );
                input.addEventListener('blur', () => this.hideTooltip(tooltip));
            } else {
                // 🎯 Caso general → hover
                input.addEventListener('mouseenter', () =>
                    this.showTooltip(tooltip)
                );
                input.addEventListener('mouseleave', () =>
                    this.hideTooltip(tooltip)
                );
            }
        });
    }

    /** Mostrar tooltip */
    private showTooltip(tooltip: HTMLElement): void {
        tooltip.classList.add('opacity-100', 'scale-100');
        tooltip.classList.remove('pointer-events-none');
    }

    /** Ocultar tooltip */
    private hideTooltip(tooltip: HTMLElement): void {
        tooltip.classList.remove('opacity-100', 'scale-100');
        tooltip.classList.add('pointer-events-none');
    }
}
