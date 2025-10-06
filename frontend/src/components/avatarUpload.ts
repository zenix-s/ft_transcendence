export function initializeAvatarUpload(): void {
	// Referencias a los elementos del DOM
	const avatarDropZone = document.getElementById('avatarDropZone') as HTMLDivElement | null;
	const avatarFileInput = document.getElementById('avatarFileInput') as HTMLInputElement | null;
	const avatarPreview = document.getElementById('avatarPreview') as HTMLImageElement | null;

	if (avatarDropZone && avatarFileInput && avatarPreview) {
		
		let isDraggingOverDropZone = false;
		const DRAG_CLASS = 'bg-blue-100 dark:bg-blue-900 border-blue-500 dark:border-blue-300';

		// Función para actualizar la previsualización del avatar (se mantiene igual)
		const updateAvatarPreview = (file: File) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target?.result) {
					avatarPreview.src = e.target.result as string;
					avatarPreview.classList.remove('hidden');
					avatarDropZone.querySelector('p')?.classList.add('hidden');
				}
			};
			reader.readAsDataURL(file);
		};

		// 1. Manejar la selección de archivo por click (se mantiene igual)
		avatarDropZone.addEventListener('click', (e: MouseEvent) => {
			// 🛑 CLAVE: Detener la propagación para que el clic no llegue a document.addEventListener("click")
			e.stopPropagation();
			
			avatarFileInput.click();
		});

		avatarFileInput.addEventListener('change', (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (files && files.length > 0) {
				updateAvatarPreview(files[0]);
			}
		});

		// 2. Prevenir el comportamiento por defecto de toda la ventana (KEY)
		window.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault(); 
		});

		window.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault(); 
		});

		// 3. Manejar eventos de arrastre en la zona visible (`avatarDropZone`)

		// dragenter: Inicia el feedback visual
		avatarDropZone.addEventListener('dragenter', (e: DragEvent) => {
			e.preventDefault();
			isDraggingOverDropZone = true;
			avatarDropZone.classList.add(DRAG_CLASS);
		});

		// dragover: Necesario para permitir el drop
		avatarDropZone.addEventListener('dragover', (e: DragEvent) => {
			e.preventDefault(); 
		});
		
		// dragleave: Quita el feedback visual
		avatarDropZone.addEventListener('dragleave', (e: DragEvent) => {
			e.preventDefault();
			// Usamos currentTarget para asegurarnos de que el evento es para el dropZone en sí
			if (e.currentTarget === avatarDropZone && isDraggingOverDropZone) {
				// Nota: Aquí se podría implementar una lógica más robusta para dragleave,
				// pero para una zona simple, dejar que el 'drop' maneje la limpieza final es suficiente.
				// Para evitar parpadeos al pasar sobre elementos internos, a menudo solo se usa dragenter/drop
				// para aplicar/quitar la clase. Pero para ser correcto:
				if (e.relatedTarget && avatarDropZone.contains(e.relatedTarget as Node)) {
					return; // El cursor se movió a un elemento hijo
				}
				isDraggingOverDropZone = false;
				avatarDropZone.classList.remove(DRAG_CLASS);
			}
		});

		// drop: Manejar el archivo (se mantiene igual que la solución anterior)
		avatarDropZone.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault(); 

			// 🛑 CLAVE: Detener la propagación para que otros listeners no interfieran.
			e.stopPropagation(); 

			avatarDropZone.classList.remove(DRAG_CLASS);
			isDraggingOverDropZone = false;
			
			// Asersión de tipo: le decimos al compilador que e.dataTransfer NO será null
			const dataTransfer = e.dataTransfer as DataTransfer;
			const files = dataTransfer.files;

			if (files && files.length > 0) {
				const file = files[0];
				
				if (!file.type.startsWith('image/')) {
					alert('Solo se permiten archivos de imagen.');
					return;
				}

				// Asignar el archivo al input oculto
				const dt = new DataTransfer();
				dt.items.add(file);
				avatarFileInput.files = dt.files;

				// Actualizar la previsualización
				updateAvatarPreview(file);
			}
		});

		// 4. Inicializar con el avatar por defecto (se mantiene igual)
		avatarPreview.classList.remove('hidden');
		avatarDropZone.querySelector('p')?.classList.add('hidden'); 
	} else {
		console.error("No se encontraron todos los elementos DOM necesarios.");
	}
}