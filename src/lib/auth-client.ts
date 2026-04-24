import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const authClient = createAuthClient({
	// plugins: [polarClient()],
});

const handleSocialSignIn = async (
	provider: "github" | "google",
	router: AppRouterInstance,
) => {
	await authClient.signIn.social(
		{ provider, callbackURL: "/" },
		{
			onSuccess: () => {
				router.push("/");
			},
			onError: (ctx) => {
				toast.error(ctx.error.message || "Something went wrong");
			},
		},
	);
};

export const signInUsingGithub = (router: AppRouterInstance) =>
	handleSocialSignIn("github", router);

export const signInUsingGoogle = (router: AppRouterInstance) =>
	handleSocialSignIn("google", router);
