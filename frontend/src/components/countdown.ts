/*
seconds -> Time in seconds
variant -> Animation type: "start" when match starts, "point" after register a point (except last point)
onFinish -> Callback: what to do when finish
*/
//export function startCountdown(seconds: number, variant: "start" | "point", onFinish: () => void) {
export function startCountdown(seconds: number, variant: "start" | "point") {
	if (variant)
		console.log(variant);
	const div = document.createElement("div");
	div.className = "fixed inset-0 flex items-center justify-center pointer-events-none text-white text-9xl";
	if (variant === "start")
		div.classList.add("animate-ping");
	div.textContent = seconds.toString();
	document.body.appendChild(div);

	// Update the count down every 1 second
	const countdown = setInterval(function() {
	seconds--;

	// If the count down is over
	if (seconds <= 0) {
		clearInterval(countdown);
		div.remove() // Eliminar el elemento del DOM
		//onFinish(); // ejecuta el callback
	}
	
	// Actualizar el DOM si el número es mayor que 0 y existe el elemento
	if (seconds > 0 && div)
	{
		div.innerHTML = "";
		div.innerHTML = seconds.toString();
	}

	}, 1000); // 1 second
}