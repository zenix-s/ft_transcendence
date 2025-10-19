import { t } from "@/app/i18n";
import { navigateTo } from "@/app/navigation";
import { showToast } from "@/components/toast";
import type { User } from "@/types/user";

export async function addFriend(user: User, friendUsername: string): Promise<boolean> {
	if (!friendUsername || !friendUsername.trim())
	{
		showToast(t("fillAllFields"), "error");
		return false;
	}

	if (user.username === friendUsername)
	{
		showToast(t("YourOwnFriend"), "error");
		return false;
	}

	try {
		const token = localStorage.getItem("access_token");
		if (!token) {
			console.warn(t("NoTokenFound"));
			showToast(t("NoTokenFound"), "error");
			navigateTo("login");
			return false;
		}

		const response = await fetch("/api/friendship", {
			method: "POST",
			headers: {
				"Content-type": "application/json",
				"Authorization": `Bearer ${token}`,
			},
			body: JSON.stringify({ friendUsername }),
		});

		const data = await response.json();
		console.log("data = " + data);

		if (!response.ok) {
			const errorcode = data.error || "UserNotFound";
			showToast(t(errorcode), "error");
			return false;
		}

		showToast(t("FriendAddedSuccessfully"));
		return true;

	} catch (error) {
		showToast(t("NetworkOrServerError"), "error");
		return false;
	}
}