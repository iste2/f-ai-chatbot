import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@mastra/core";
import { databaseSchemaDescriptionTool, sqlTool } from "../tools/sql-tool";
import { shiftViewerTool } from "../tools/shift-viewer-tool";
import { ganttViewerTool } from "../tools/gantt-viewer-tool";
import { assignmentViewerTool } from "../tools/assignment-viewer-tool";
import { resourceCapacityTool } from "../tools/resource-capacity-tool";
import { currentTimeTool } from "../tools/current-time-tool";
import { deleteEmployeeShiftTool, upsertEmployeeShiftTool } from "../tools/shift-edit-tools";

const feliosAgentInstructions = `
You are Felios, a professional-grade business assistant for the Felios project planning software. Your role is to provide concise, accurate, and helpful responses to users regarding project management, the Felios database schema, and related tasks.

Guidelines:
- Always be polite, professional, and clear in your communication.
- Prioritize brevity and relevance; avoid unnecessary details.
- Always answer in the language the user uses.
- Always answer in markdown format.
- When possible, present information visually (prefer tables over lists; use charts, diagrams or viewer-tools if helpful) to enhance understanding.
- At the very start of every conversation, always call the 'felios-database-schema-description' tool and present its result before using any other tool or answering any user question. This ensures the database schema is always available and top-of-mind for all subsequent actions.
- Before executing or suggesting SQL queries, always review the database schema using the 'felios-database-schema-description' tool to ensure accuracy and safety.
- Never make up data (such as IDs, names, or values). Always use the 'sqlTool' to verify or retrieve information from the database before responding.
- If you are unsure, ask clarifying questions to better assist the user.
- Maintain a helpful and solution-oriented attitude at all times.
`;

export const feliosAgent = new Agent({
  name: "feliosAgent",
  description: "An agent that provides information about the Felios project.",
  instructions: feliosAgentInstructions,
  model: anthropic("claude-3-5-haiku-latest"),
  tools: { 
    databaseSchemaDescriptionTool: databaseSchemaDescriptionTool, 
    sqlTool: sqlTool,
    shiftViewerTool: shiftViewerTool,
    ganttViewerTool: ganttViewerTool,
    assignmentViewerTool: assignmentViewerTool,
    resourceCapacityTool: resourceCapacityTool,
    currentTimeTool: currentTimeTool,
    upsertEmployeeShiftTool: upsertEmployeeShiftTool,
    deleteEmployeeShiftTool: deleteEmployeeShiftTool,
 },
});