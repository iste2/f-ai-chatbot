import { AgentNetwork } from '@mastra/core/network';
import { anthropic } from '@ai-sdk/anthropic';
import { feliosAgent } from '../agents/random-agent';

export const agentNetwork = new AgentNetwork({
    name: 'agent-network',
    instructions: 'This network handles the creation, management, and interaction of agents within the Mastra ecosystem.',
    model: anthropic('claude-3-5-haiku-latest'),
    agents: [feliosAgent],
});