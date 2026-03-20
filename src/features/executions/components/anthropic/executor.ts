import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { NodeExecutor } from "@/features/executions/types";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import { ModelId, ANTHROPIC_MODELS } from "./dialog";
import prisma from "@/lib/db";
import { prismaAdapter } from "better-auth/adapters/prisma";

Handlebars.registerHelper("json", (context) => {
	const jsonString = JSON.stringify(context, null, 2);
	const safeString = new Handlebars.SafeString(jsonString);

	return safeString;
});

type AnthropicData = {
	variableName?: string;
	credentialId?: string;
	model?: ModelId;
	systemPrompt?: string;
	userPrompt?: string;
};

export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
	data,
	nodeId,
	context,
	step,
	publish,
}) => {
	await publish(
		anthropicChannel().status({
			nodeId,
			status: "loading",
		}),
	);

	if (!data.variableName) {
		await publish(
			anthropicChannel().status({
				nodeId,
				status: "error",
			}),
		);
		throw new NonRetriableError("Anthropic node: Variable name is missing");
	}

	if (!data.credentialId) {
		await publish(
			anthropicChannel().status({
				nodeId,
				status: "error",
			}),
		);
		throw new NonRetriableError("Anthropic node: Credential is required");
	}

	if (!data.userPrompt) {
		await publish(
			anthropicChannel().status({
				nodeId,
				status: "error",
			}),
		);
		throw new NonRetriableError("Anthropic node: User prompt is missing");
	}

	const systemPrompt = data.systemPrompt
		? Handlebars.compile(data.systemPrompt)(context)
		: "You are a helpful assistant.";
	const userPrompt = Handlebars.compile(data.userPrompt)(context);

	const credential = await step.run("get-credential", async () => {
		return await prisma.credential.findUnique({
			where: {
				id: data.credentialId,
			},
		});
	});

	if (!credential) {
		throw new NonRetriableError("Anthropic node: Credential not found");
	}

	const anthropic = createAnthropic({
		apiKey: credential.value,
	});

	try {
		const { steps } = await step.ai.wrap(
			"anthropic-generate-text",
			generateText,
			{
				model: anthropic(data.model || ANTHROPIC_MODELS[0].value),
				system: systemPrompt,
				prompt: userPrompt,
				experimental_telemetry: {
					isEnabled: true,
					recordInputs: true,
					recordOutputs: true,
				},
			},
		);

		const text =
			steps[0].content[0].type === "text" ? steps[0].content[0].text : "";

		await publish(
			anthropicChannel().status({
				nodeId,
				status: "success",
			}),
		);

		return {
			...context,
			[data.variableName]: {
				text,
			},
		};
	} catch (error) {
		await publish(
			anthropicChannel().status({
				nodeId,
				status: "error",
			}),
		);
		throw error;
	}
};
