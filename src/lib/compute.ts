import { O2_RATE_USD } from '@/lib/o2';

export const PLATFORM_FEE = 0.15;

export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514':  { input: 3.00,  output: 15.00 },
  'claude-opus-4-20250514':    { input: 15.00, output: 75.00 },
  'claude-haiku-4-5-20251001': { input: 0.80,  output: 4.00  },
  'gpt-4o':                    { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':               { input: 0.15,  output: 0.60  },
  'gpt-4-turbo':               { input: 10.00, output: 30.00 },
  'gemini-2.0-flash':          { input: 0.10,  output: 0.40  },
  'gemini-1.5-pro':            { input: 1.25,  output: 5.00  },
  'mistral-large-latest':      { input: 2.00,  output: 6.00  },
  'mistral-small-latest':      { input: 0.20,  output: 0.60  },
  'default':                   { input: 3.00,  output: 15.00 },
};

export interface ComputeResult {
  tokensIn: number;
  tokensOut: number;
  computeCostUsd: number;
  platformFeeUsd: number;
  totalUsd: number;
  o2Cost: number;
}

export function calculateCost(model: string, tokensIn: number, tokensOut: number): ComputeResult {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['default'];
  const inputCost = (tokensIn / 1_000_000) * pricing.input;
  const outputCost = (tokensOut / 1_000_000) * pricing.output;
  const computeCostUsd = inputCost + outputCost;
  const platformFeeUsd = computeCostUsd * PLATFORM_FEE;
  const totalUsd = computeCostUsd + platformFeeUsd;
  const o2Cost = totalUsd / O2_RATE_USD;
  return { tokensIn, tokensOut, computeCostUsd, platformFeeUsd, totalUsd, o2Cost };
}

export function estimateMaxCost(model: string, maxTokens = 2048): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['default'];
  const worstCase = (maxTokens / 1_000_000) * pricing.output;
  const withFee = worstCase * (1 + PLATFORM_FEE);
  return withFee / O2_RATE_USD;
}
