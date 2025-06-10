
import { Mastra } from '@mastra/core';
import { agentNetwork } from './networks/agent-network';
import { feliosAgent } from './agents/random-agent';
import { PinoLogger } from "@mastra/loggers";

export const mastra = new Mastra({
    networks: { agentNetwork: agentNetwork },
    agents: { randomAgent: feliosAgent },
    logger: new PinoLogger({
        name: "mastra",
        level: "info",
    }),
});
        