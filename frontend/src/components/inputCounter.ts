export function countInputLenght(inputField: HTMLInputElement | null) {
    if (!inputField) return;

    const base = inputField.name || inputField.id;
    if (!base) {
        console.warn(
            'El input no tiene id ni name, no se puede buscar el contador.'
        );
        return;
    }

    const counter = document.getElementById(`${base}-counter`);
    if (!counter) {
        console.warn(`No se encontró elemento con id "${base}-counter"`);
        return;
    }

    const maxLength = inputField.maxLength;
    if (!maxLength) {
        console.warn('El input no tiene maxLength definido');
        return;
    }

    // Inicializar contador
    counter.textContent = `${inputField.value.length}/${maxLength}`;

    // Actualizar al escribir
    inputField.addEventListener('input', () => {
        counter.textContent = `${inputField.value.length}/${maxLength}`;
    });
}
