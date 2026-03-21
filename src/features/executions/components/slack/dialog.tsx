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
import z from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
	variableName: z
		.string()
		.min(1, { message: "Variable name is required" })
		.regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
			message:
				"Variable name must start with a letter or underscore and container only letters, numbers, and underscores",
		}),
	content: z.string().min(1, "Message content is required"),
	webhookUrl: z.string().min(1, "Webhook URL is required"),
});

export type SlackFormValues = z.infer<typeof formSchema>;

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: z.infer<typeof formSchema>) => void;
	defaultValues?: Partial<SlackFormValues>;
}

export const SlackDialog = ({
	open,
	onOpenChange,
	onSubmit,
	defaultValues = {},
}: Props) => {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			variableName: defaultValues.variableName || "",
			content: defaultValues.content || "",
			webhookUrl: defaultValues.webhookUrl || "",
		},
	});

	// Reset form values when dialog opens with new defaults
	useEffect(() => {
		if (open) {
			form.reset({
				variableName: defaultValues.variableName || "",
				content: defaultValues.content || "",
				webhookUrl: defaultValues.webhookUrl || "",
			});
		}
	}, [open, defaultValues, form]);

	const watchVariableName = form.watch("variableName") || "my_slack";

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		onSubmit(values);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex flex-col max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Slack Configuration</DialogTitle>
					<DialogDescription>
						Configure Slack webhook settings for this node.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						id="slack-dialog-form"
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
										<Input placeholder="my_slack" {...field} />
									</FormControl>
									<FormDescription>
										Use this name to reference the result in other nodes:{" "}
										{`{{${watchVariableName}.messageContent}}`}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="webhookUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Webhook URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://hooks.slack.com/triggers/..."
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Get this from Slack: Workspace Settings → Workflows →
										Webhooks
									</FormDescription>
									<FormDescription>
										Make sure you have "key" set to "content" in Slack
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Message Content</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Summary: {{my_gemini.text}}"
											className="min-h-[80px] font-mono text-sm"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										The message to send. Use {"{{variables}}"} for simple values
										or {"{{json variable}}"} to stringify objects
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
					<DialogFooter className="pt-4 border-t">
						<Button type="submit" form="slack-dialog-form">Save</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
