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
import Image from "next/image";
import { CredentialType } from "@/generated/prisma";
import { useCredentialsByType } from "@/features/credentials/hooks/use-credentials";

export const ANTHROPIC_MODELS = [
	{
		value: "claude-opus-4-6",
		label: "Claude Opus 4.6 (Flagship - most intelligent)",
	},
	{
		value: "claude-sonnet-4-6",
		label: "Claude Sonnet 4.6 (Best balance)",
	},
	{
		value: "claude-haiku-4-5",
		label: "Claude Haiku 4.5 (Fastest + cheapest)",
	},
] as const;

export type ModelId = (typeof ANTHROPIC_MODELS)[number]["value"];

const formSchema = z.object({
	variableName: z
		.string()
		.min(1, { message: "Variable name is required" })
		.regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
			message:
				"Variable name must start with a letter or underscore and contain only letters, numbers, and underscores",
		}),
	credentialId: z.string().min(1, "Credential is required"),
	model: z.enum(ANTHROPIC_MODELS.map((m) => m.value)),
	systemPrompt: z.string().optional(),
	userPrompt: z.string().min(1, "User prompt is required"),
});

export type AnthropicFormValues = z.infer<typeof formSchema>;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: z.infer<typeof formSchema>) => void;
	defaultValues?: Partial<AnthropicFormValues>;
}

export const AnthropicDialog = ({
	open,
	onOpenChange,
	onSubmit,
	defaultValues = {},
}: Props) => {
	const { data: credentials, isLoading: isLoadingCredentials } =
		useCredentialsByType(CredentialType.ANTHROPIC);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			credentialId: defaultValues.credentialId || "",
			variableName: defaultValues.variableName || "",
			model: defaultValues.model || ANTHROPIC_MODELS[0].value,
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
				model: defaultValues.model || ANTHROPIC_MODELS[0].value,
				systemPrompt: defaultValues.systemPrompt || "",
				userPrompt: defaultValues.userPrompt || "",
			});
		}
	}, [open, defaultValues, form]);

	const watchVariableName = form.watch("variableName") || "my_anthropic";

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		onSubmit(values);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex flex-col max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Anthropic Configuration</DialogTitle>
					<DialogDescription>
						Configure the AI model and prompts for this node.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="anthropic-dialog-form"
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
										<Input placeholder="my_anthropic" {...field} />
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
									<FormLabel>Anthropic Credential</FormLabel>
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
															src="/logos/anthropic.svg"
															alt="Anthropic"
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
											{ANTHROPIC_MODELS.map((model) => (
												<SelectItem key={model.value} value={model.value}>
													{model.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										The Anthropic model you want to use.
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
						<Button type="submit" form="anthropic-dialog-form">Save</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
