import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import type { Buttons, HTMLelements } from "./gameHTMLInterfaces";

/*
	Check the URL and get the game ID
*/
export function getGameId() {
	const params = new URLSearchParams(window.location.search);
	const id = params.get('id');
	if (!id) {
		console.warn(t('URLNotCorrect'));
		navigateTo('dashboard', false, true);
		return;
	}
	return (id);
}

/*
	Check and return canvas
*/
function getCanvas() {
	const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
	if (!canvas) {
		console.warn(t('CanvasNotFound'));
		navigateTo('dashboard', false, true);
		return;
	}
	return (canvas);
}

/*
	Check and return buttons
*/
function getButtons() {
	const buttonUp = document.getElementById('button-up') as HTMLButtonElement;
	const buttonDown = document.getElementById(
		'button-down'
	) as HTMLButtonElement;
	if (!buttonUp || !buttonDown) {
		console.warn(t('ButtonsNotFound'));
		navigateTo('dashboard', false, true);
		return;
	}
	const buttons : Buttons = {
		buttonUp: buttonUp,
		buttonDown: buttonDown,
	};

	const rootStyles = getComputedStyle(document.documentElement);
	let bgColor;
	if (localStorage.getItem('theme') === 'dark')
		bgColor = rootStyles.getPropertyValue('--color-primary').trim();
	else
		bgColor = rootStyles.getPropertyValue('--color-secondary').trim();
	
	let arrowColor;
	if (localStorage.getItem('theme') === 'dark')
		arrowColor = rootStyles.getPropertyValue('--color-secondary').trim();
	else
		arrowColor = rootStyles.getPropertyValue('--color-primary').trim();
	
	// Espera formato #RRGGBB
	if (!arrowColor || !arrowColor.startsWith('#') || arrowColor.length !== 7)
		arrowColor = '#FFFFFF';

	buttonUp.style.backgroundColor = bgColor;
	buttonDown.style.backgroundColor = bgColor;
	buttonUp.style.color = arrowColor;
	buttonDown.style.color = arrowColor;
	return (buttons);
}

/*
	Check the buttons and the timer exists in the html
*/
function getTimer() {

	const timer = document.getElementById('timer') as HTMLElement;
	if (!timer) {
		console.warn(t('TimerNotFound'));
		navigateTo('dashboard', false, true);
		return;
	}
	return (timer);
}

export function getHTMLelements() {
	const canvas = getCanvas();
	if (!canvas)
		return;
	const buttons: Buttons | undefined = getButtons();
	if (!buttons)
		return ;
	const timer = getTimer();
	if (!timer)
		return;
	const htmlElements: HTMLelements = {
		canvas: canvas,
		buttons: buttons,
		timer: timer,
	};
	return (htmlElements);
}