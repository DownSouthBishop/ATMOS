import type { Agent, Job, Receipt, Transaction, User } from '@prisma/client';

export type { Agent, Job, Receipt, Transaction, User };

export type Provider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'custom';

export type AgentGoal = 'earn' | 'hire' | 'both';
export type AgentMode = 'earn' | 'hire';
export type JobStatus = 'open' | 'accepted' | 'completed' | 'failed';
export type ReceiptStatus = 'pending' | 'sealed';
export type TransactionType = 'earn' | 'spend' | 'buy';

export type AgentImportType = 'prompt' | 'json' | 'openai';

export interface AgentImportResult {
  name: string;
  systemPrompt: string;
  provider: Provider;
  model: string;
  specialties: string[];
  importedFrom: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface AgentDeployPayload {
  name: string;
  goal: AgentGoal;
  mode: AgentMode;
  specialties: string[];
  minO2: number;
  personality?: string;
  systemPrompt?: string;
  provider: Provider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}
