export function updateSliders() {
	// Actualizar valores dinámicos de los sliders
	const pointsRange = document.getElementById("points-range") as HTMLInputElement;
	const pointsValue = document.getElementById("points-value")!;
	pointsValue.textContent = pointsRange.value; // Default value
	pointsRange.addEventListener("input", () => {
		pointsValue.textContent = pointsRange.value;
	});

	const timeRange = document.getElementById("time-range") as HTMLInputElement;
	const timeValue = document.getElementById("time-value")!;
	timeValue.textContent = timeRange.value; // Default value
	timeRange.addEventListener("input", () => {
		timeValue.textContent = timeRange.value;
	});
}