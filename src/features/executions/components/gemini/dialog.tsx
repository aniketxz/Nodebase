"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";
import { CredentialType } from "@/generated/prisma";
import Image from "next/image";

export const GEMINI_MODELS = [
	"gemini-2.5-flash",
	"gemini-2.5-flash-lite",
	"gemini-2.5-pro",
] as const;

const formSchema = z.object({
	variableName: z
		.string()
		.min(1, { message: "Variable name is required" })
		.regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
			message:
				"Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
		}),
	credentialId: z.string().min(1, "Credential ID is required"),
	model: z.string().min(1, "Model is required"),
	systemPrompt: z.string().optional(),
	userPrompt: z.string().min(1, "User prompt is required"),
});

export type GeminiFormValues = z.infer<typeof formSchema>;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: z.infer<typeof formSchema>) => void;
	defaultValues?: Partial<GeminiFormValues>;
}

export const GeminiDialog = ({
	open,
	onOpenChange,
	onSubmit,
	defaultValues = {},
}: Props) => {
	const { data: credentials, isLoading: isLoadingCredentials } =
		useCredentialsByType(CredentialType.GEMINI);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			credentialId: defaultValues.credentialId || "",
			variableName: defaultValues.variableName || "",
			model: defaultValues.model || GEMINI_MODELS[0],
			systemPrompt: defaultValues.systemPrompt || "",
			userPrompt: defaultValues.userPrompt || "",
		},
	});

	// Reset form values when dialog opens with new defaults
	useEffect(() => {
		if (open) {
			form.reset({
				credentialId: defaultValues.credentialId || "",
				variableName: defaultValues.variableName || "",
				model: defaultValues.model || GEMINI_MODELS[0],
				systemPrompt: defaultValues.systemPrompt || "",
				userPrompt: defaultValues.userPrompt || "",
			});
		}
	}, [open, defaultValues, form]);

	const watchVariableName = form.watch("variableName") || "my_gemini";

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		onSubmit(values);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex flex-col max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Gemini Configuration</DialogTitle>
					<DialogDescription>
						Configure the AI model and prompts for this node.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="gemini-dialog-form"
						onSubmit={form.handleSubmit(handleSubmit)}
						className="scrollbar-thin space-y-8 overflow-y-auto flex-1 px-1 py-4"
					>
						<FormField
							control={form.control}
							name="variableName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Variable Name</FormLabel>
									<FormControl>
										<Input placeholder="my_gemini" {...field} />
									</FormControl>
									<FormDescription>
										Use this name to reference the result in other nodes:{" "}
										{`{{${watchVariableName}.text}}`}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="credentialId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Gemini Credential</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
										disabled={isLoadingCredentials || credentials?.length === 0}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a credential" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{credentials?.map((credential) => (
												<SelectItem key={credential.id} value={credential.id}>
													<div className="flex items-center gap-2">
														<Image
															src="/logos/gemini.svg"
															alt="Gemini"
															width={16}
															height={16}
														/>
														{credential.name}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="model"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Model</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select a model" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{GEMINI_MODELS.map((model) => (
												<SelectItem key={model} value={model}>
													{model}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										Select the Google Gemini model you want to use.
										<br />
										Gemini 2.5 models are available in free tier.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="systemPrompt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>System Prompt (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="You are a helpful assistant."
											className="min-h-[80px] font-mono text-sm"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Sets the behavior of the assistant. Use {"{{variables}}"}{" "}
										for simple values or {"{{json variable}}"} to stringify
										objects
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="userPrompt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>User Prompt</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Summarize this text: {{json httpResponse.data}}"
											className="min-h-[120px] font-mono text-sm"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										The prompt to send to the AI. Use {"{{variables}}"} for
										simple values or {"{{json variable}}"} to stringify objects
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
					<DialogFooter className="pt-4 border-t">
						<Button type="submit" form="gemini-dialog-form">Save</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
