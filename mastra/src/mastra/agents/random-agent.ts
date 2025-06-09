import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core";

export const randomAgent = new Agent({
  name: "randomAgent",
  description: "An agent that returns a random number between 1 and 100.",
  instructions: "You return a random number between 1 and 100 no matter what.",
  model: anthropic("claude-3-5-haiku-latest"),
});