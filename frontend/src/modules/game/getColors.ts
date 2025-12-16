import {
    Color3,
    Color4,
    Scene,
    MeshBuilder,
    StandardMaterial,
} from '@babylonjs/core';
import type { Buttons } from './gameHTMLInterfaces';

export function setButtonsColors(buttons: Buttons | undefined) {
    if (buttons === undefined) return;
    const rootStyles = getComputedStyle(document.documentElement);
    let bgColor;
    if (localStorage.getItem('theme') === 'dark')
        bgColor = rootStyles.getPropertyValue('--color-primary').trim();
    else bgColor = rootStyles.getPropertyValue('--color-secondary').trim();
    // Espera formato #RRGGBB
    if (!bgColor || !bgColor.startsWith('#') || bgColor.length !== 7)
        bgColor = '#000000';

    let arrowColor;
    if (localStorage.getItem('theme') === 'dark')
        arrowColor = rootStyles.getPropertyValue('--color-secondary').trim();
    else arrowColor = rootStyles.getPropertyValue('--color-primary').trim();

    // Espera formato #RRGGBB
    if (!arrowColor || !arrowColor.startsWith('#') || arrowColor.length !== 7)
        arrowColor = '#FFFFFF';

    buttons.buttonUp.style.backgroundColor = bgColor;
    buttons.buttonDown.style.backgroundColor = bgColor;
    buttons.buttonUp.style.color = arrowColor;
    buttons.buttonDown.style.color = arrowColor;
}

export function setColors(
    scene: Scene | undefined,
    bgColor: Color3,
    borderColor: Color3
) {
    if (!scene) return;
    scene.clearColor = Color4.FromColor3(bgColor);

    const borders = new StandardMaterial('lineMat');
    borders.disableLighting = true;
    borders.emissiveColor = borderColor;
    const thickness = 0.08;

    const midlineMat = new StandardMaterial('midlineMat', scene);
    midlineMat.disableLighting = true;
    midlineMat.emissiveColor = borderColor;
    midlineMat.alpha = 0.4;

    // BORDE SUPERIOR
    const top = MeshBuilder.CreateBox(
        'lineTop',
        { width: 8.8, depth: thickness, height: 0.21 },
        scene
    );
    top.position.set(0, 0.105, 4.1 - thickness / 2);
    top.material = borders;

    // BORDE INFERIOR
    const bottom = MeshBuilder.CreateBox(
        'lineBottom',
        { width: 8.8, depth: thickness, height: 0.21 },
        scene
    );
    bottom.position.set(0, 0.105, -4.1 + thickness / 2);
    bottom.material = borders;

    // BORDE IZQUIERDO
    const left = MeshBuilder.CreateBox(
        'lineLeft',
        { width: thickness, depth: 8.2, height: 0.21 },
        scene
    );
    left.position.set(-4.4 + thickness / 2, 0.105, 0);
    left.material = borders;

    // BORDE DERECHO
    const right = MeshBuilder.CreateBox(
        'lineRight',
        { width: thickness, depth: 8.2, height: 0.21 },
        scene
    );
    right.position.set(4.4 - thickness / 2, 0.105, 0);
    right.material = borders;

    // LÍNEA DEL CENTRO
    const midline = MeshBuilder.CreateBox(
        'midline',
        { width: 0.1, depth: 8.2, height: 0.21 },
        scene
    );
    midline.position.set(0, 0.105, 0);
    midline.material = midlineMat;
}

export function getColor(color: string): Color3 {
    const rootStyles = getComputedStyle(document.documentElement);
    const value = rootStyles.getPropertyValue(color).trim();

    // Espera formato #RRGGBB
    if (!value || !value.startsWith('#') || value.length !== 7) {
        console.warn('⚠️ Invalid CSS color:', value, 'for color', color);
        return new Color3(1, 1, 1);
    }

    const r = parseInt(value.substring(1, 3), 16) / 255;
    const g = parseInt(value.substring(3, 5), 16) / 255;
    const b = parseInt(value.substring(5, 7), 16) / 255;

    return new Color3(r, g, b);
}
