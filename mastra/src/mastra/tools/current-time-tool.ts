import { createTool } from "@mastra/core";
import { z } from "zod";

export const currentTimeTool = createTool({
    id: "current-time-tool",
    description: "Returns the current date and time in ISO 8601 format.",
    outputSchema: z.object({
        currentTime: z.string().describe("The current date and time in ISO 8601 format."),
    }),
    execute: async () => {
        const now = new Date().toISOString();
        return {
            currentTime: now,
        };
    },
});
