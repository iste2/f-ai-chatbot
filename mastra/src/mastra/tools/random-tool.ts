import { createTool } from "@mastra/core";
import { z } from "zod";

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getRandomColorCode = (): string => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor.padStart(6, '0')}`;
}

export const randomTool = createTool({
    id: 'random-tool',
    description: 'A tool that returns a random number between 1 and 100, or a random color code.',
    inputSchema: z.object({
        min: z.number().default(1).describe('Minimum value for random number generation'),
        max: z.number().default(100).describe('Maximum value for random number generation'),
    }),
    outputSchema: z.object({
        number: z.number().describe('A random number between the specified min and max values'),
        color: z.string().describe('A random color code in hexadecimal format'),
    }),
    execute: async ({ context: { min, max } }) => {
        const randomNumber = getRandomNumber(min, max);
        const randomColorCode = getRandomColorCode();
        return {
            number: randomNumber,
            color: randomColorCode,
        };
    },
});