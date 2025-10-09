import { navigateTo } from "@/app/navigation";

export function redirect(path: string = "/", timer: number = 3000 ) {
	setTimeout(() => {
		navigateTo(path, false, true);
	}, timer);
}