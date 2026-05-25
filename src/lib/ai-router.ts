import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Mistral } from '@mistralai/mistralai';
import type { Job, Agent } from '@prisma/client';

export type Provider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'custom';

export interface AgentResult {
  output: string;
  tokensIn: number;
  tokensOut: number;
}

type AgentWithConfig = Agent & { specialtiesParsed?: string[] };

function buildSystemPrompt(agent: AgentWithConfig): string {
  if (agent.systemPrompt) return agent.systemPrompt;
  const specialties = agent.specialtiesParsed ?? (JSON.parse(agent.specialties) as string[]);
  return `You are ${agent.name}, an AI agent deployed on the ATMOS platform.
Specialties: ${specialties.join(', ')}.
${agent.personality ? `Personality: ${agent.personality}` : ''}
You complete freelance tasks and deliver clean, professional output.
Complete every job fully. No placeholders. Deliver real output.`;
}

function buildUserMessage(job: Job): string {
  return `Complete this job:\n\nTitle: ${job.title}\n\nDescription: ${job.description}\n\nDeliver the full output now.`;
}

export async function runAgentJob(job: Job, agent: Agent): Promise<AgentResult> {
  const provider = agent.provider as Provider;
  const apiKey = agent.apiKey ?? '';
  const system = buildSystemPrompt(agent);
  const userMessage = buildUserMessage(job);

  switch (provider) {
    case 'anthropic': {
      const client = new Anthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      });
      const res = await client.messages.create({
        model: agent.model,
        max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: userMessage }],
      });
      return {
        output: res.content[0].type === 'text' ? res.content[0].text : '',
        tokensIn: res.usage.input_tokens,
        tokensOut: res.usage.output_tokens,
      };
    }

    case 'openai': {
      const client = new OpenAI({ apiKey, baseURL: agent.baseUrl ?? undefined });
      const res = await client.chat.completions.create({
        model: agent.model,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      });
      return {
        output: res.choices[0].message.content ?? '',
        tokensIn: res.usage?.prompt_tokens ?? 0,
        tokensOut: res.usage?.completion_tokens ?? 0,
      };
    }

    case 'google': {
      const genAI = new GoogleGenerativeAI(apiKey);
      const gemini = genAI.getGenerativeModel({ model: agent.model });
      const res = await gemini.generateContent(`${system}\n\n${userMessage}`);
      return {
        output: res.response.text(),
        tokensIn: res.response.usageMetadata?.promptTokenCount ?? 0,
        tokensOut: res.response.usageMetadata?.candidatesTokenCount ?? 0,
      };
    }

    case 'mistral': {
      const client = new Mistral({ apiKey });
      const res = await client.chat.complete({
        model: agent.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      });
      const choice = res.choices?.[0];
      const content = choice?.message?.content;
      return {
        output: typeof content === 'string' ? content : '',
        tokensIn: res.usage?.promptTokens ?? 0,
        tokensOut: res.usage?.completionTokens ?? 0,
      };
    }

    case 'custom': {
      if (!agent.baseUrl) throw new Error('Custom provider requires a baseUrl');
      const res = await fetch(`${agent.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Custom provider error: ${res.status}`);
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      return {
        output: data.choices?.[0]?.message?.content ?? '',
        tokensIn: data.usage?.prompt_tokens ?? 0,
        tokensOut: data.usage?.completion_tokens ?? 0,
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function generateAssessment(job: Job, agent: Agent): Promise<string> {
  const specialties = JSON.parse(agent.specialties) as string[];
  const provider = agent.provider as Provider;
  const apiKey = agent.apiKey ?? '';

  const systemMsg = `You are ${agent.name}. Write a 1-sentence assessment of whether to accept this job. Be direct. Mention match quality and O2 value.`;
  const userMsg = `Job: ${job.title}. Budget: ${job.o2Budget} O2. Your specialties: ${specialties.join(', ')}. Min O2: ${agent.minO2}.`;

  switch (provider) {
    case 'anthropic': {
      const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
      const res = await client.messages.create({
        model: agent.model,
        max_tokens: 100,
        system: systemMsg,
        messages: [{ role: 'user', content: userMsg }],
      });
      return res.content[0].type === 'text' ? res.content[0].text : '';
    }
    case 'openai': {
      const client = new OpenAI({ apiKey, baseURL: agent.baseUrl ?? undefined });
      const res = await client.chat.completions.create({
        model: agent.model,
        max_tokens: 100,
        messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
      });
      return res.choices[0].message.content ?? '';
    }
    case 'google': {
      const genAI = new GoogleGenerativeAI(apiKey);
      const gemini = genAI.getGenerativeModel({ model: agent.model });
      const res = await gemini.generateContent(`${systemMsg}\n\n${userMsg}`);
      return res.response.text();
    }
    case 'mistral': {
      const client = new Mistral({ apiKey });
      const res = await client.chat.complete({
        model: agent.model,
        messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
      });
      const content = res.choices?.[0]?.message?.content;
      return typeof content === 'string' ? content : '';
    }
    default:
      return '';
  }
}
