import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core";
import { randomTool } from "../tools/random-tool";
import { databaseSchemaDescriptionTool, sqlTool } from "../tools/sql-tool";
import { shiftViewerTool } from "../tools/shift-viewer-tool";

export const randomAgent = new Agent({
  name: "randomAgent",
  description: "An agent that returns a random number between 1 and 100.",
  instructions: "You return a random number between 1 and 100.",
  model: anthropic("claude-3-5-haiku-latest"),
  tools: { 
    randomTool: randomTool, 
    databaseSchemaDescriptionTool: databaseSchemaDescriptionTool, 
    sqlTool: sqlTool,
    shiftViewerTool: shiftViewerTool,
 },
});