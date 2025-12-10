import { t } from '@/app/i18n';
import { Engine } from '@babylonjs/core';
import type { Ball, Player, Score } from './gameBabylonInterfaces';
import { getBabylonElements } from './gameBabylonElements';
import { createGameSocket, getGameSocket } from './gameSocket';
import {  getGameId, getHTMLelements } from './gameHTMLelements';

export function renderValues(
    posPlayerL: number,
    playerL: Player | undefined,
    posPlayerR: number,
    playerR: Player | undefined,
    pointsL: number,
    pointsR: number,
    scores: Score | undefined,
    ballX: number,
    ballY: number,
    ball: Ball | undefined
) {
    if (!ball || !playerL || !playerR || !scores) return;
    ball.ball.position.x = (ballX / 100) * 8 - 4;
    ball.ball.position.z = (ballY / 100) * 7.8 - 3.9;

    playerL.paddle.position.z = (posPlayerL / 100) * 8 - 4;
    playerR.paddle.position.z = (posPlayerR / 100) * 8 - 4;

    scores.pointsLeft = pointsL;
    scores.pointsRight = pointsR;
    scores.scoreLeft.textContent = scores.pointsLeft.toString();
    scores.scoreRight.textContent = scores.pointsRight.toString();
}

export async function initGame3D() {
    const id = getGameId();
    const htmlElements = getHTMLelements();
    if (!htmlElements)
        return;

    /* Comprobar que el ws existe y autenticarlo */
    let ws = getGameSocket();
    if (!ws) {
        /* Si no existe lo crea con la autentificación ya hecha */
        const token = localStorage.getItem('access_token');
        ws = createGameSocket(token, Number(id));
        ws.setAuth();
    }
    ws.authenticate(Number(id));

    // 🔹 Siempre esperar autenticación
    await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
            if (ws.getGameMode() != null || getGameSocket() === null) {
                clearInterval(interval);
                resolve();
            }
        }, 50);

        // Timeout de 15s
        setTimeout(() => {
            clearInterval(interval);
            resolve();
        }, 15000);
    });

    const babylonElements = getBabylonElements(htmlElements, ws);
    if (!babylonElements)
        return;

    ws.initializeGame(
        Number(id),
        htmlElements,
        babylonElements
    );
    ws.play();

    window.addEventListener('resize', () => {
        const canvas = document.getElementById(
            'gameCanvas'
        ) as HTMLCanvasElement;
        if (!canvas) {
            console.warn(t('CanvasNotFound'));
            return;
        }
        adjustCanvasSize(canvas, babylonElements.engine);
    });
}

export function adjustCanvasSize(canvas: HTMLCanvasElement, engine: Engine) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width < height) {
        // Pantalla vertical → el ancho manda
        canvas.style.width = '100vw';
        canvas.style.height = `${width * 0.9}px`; // evita barras
    } else {
        // Pantalla horizontal → el alto manda
        canvas.style.height = '100vh';
        canvas.style.width = `${height * 1.1}px`; // ajusta proporción
    }

    engine.resize();
}
