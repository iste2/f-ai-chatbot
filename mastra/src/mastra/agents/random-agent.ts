import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core";
import { databaseSchemaDescriptionTool, sqlTool } from "../tools/sql-tool";
import { shiftViewerTool } from "../tools/shift-viewer-tool";
import { ganttViewerTool } from "../tools/gantt-viewer-tool";
import { assignmentViewerTool } from "../tools/assignment-viewer-tool";

export const feliosAgent = new Agent({
  name: "feliosAgent",
  description: "An agent that provides information about the Felios project.",
  instructions: "You are a helpful assistant for the Felios project planning software. You can answer questions about the project, its database schema, and provide insights into project management tasks. Be concise and clear in your responses. Prefer visualizing data when possible, such as using charts, tables, or diagrams. Before sending SQL queries, make shure to check the database schema using the 'felios-database-schema-description' tool.",
  model: anthropic("claude-3-5-haiku-latest"),
  tools: { 
    databaseSchemaDescriptionTool: databaseSchemaDescriptionTool, 
    sqlTool: sqlTool,
    shiftViewerTool: shiftViewerTool,
    ganttViewerTool: ganttViewerTool,
    assignmentViewerTool: assignmentViewerTool,
 },
});