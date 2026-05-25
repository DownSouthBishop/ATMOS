// Direct Anthropic client — kept for convenience.
// All multi-model job execution goes through @/lib/ai-router.
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export { runAgentJob, generateAssessment } from '@/lib/ai-router';
