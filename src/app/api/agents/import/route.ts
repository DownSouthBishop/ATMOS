import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptKey } from '@/lib/crypto';
import OpenAI from 'openai';

type ImportMode = 'systemPrompt' | 'json' | 'openai';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as {
    mode: ImportMode;
    systemPrompt?: string;
    json?: string;
    assistantId?: string;
    apiKey?: string;
    name?: string;
  };

  let agentData: {
    name: string;
    systemPrompt?: string;
    specialties?: string[];
    provider?: string;
    model?: string;
    importedFrom?: string;
  };

  switch (body.mode) {
    case 'systemPrompt': {
      if (!body.systemPrompt?.trim()) {
        return NextResponse.json({ data: null, error: 'System prompt is required' }, { status: 400 });
      }
      agentData = {
        name: body.name?.trim() || 'Imported Agent',
        systemPrompt: body.systemPrompt,
        importedFrom: 'system_prompt',
      };
      break;
    }

    case 'json': {
      if (!body.json?.trim()) {
        return NextResponse.json({ data: null, error: 'JSON config is required' }, { status: 400 });
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(body.json) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ data: null, error: 'Invalid JSON' }, { status: 400 });
      }
      agentData = {
        name: typeof parsed.name === 'string' ? parsed.name : (body.name || 'Imported Agent'),
        systemPrompt: typeof parsed.systemPrompt === 'string' ? parsed.systemPrompt : undefined,
        specialties: Array.isArray(parsed.specialties) ? parsed.specialties as string[] : undefined,
        provider: typeof parsed.provider === 'string' ? parsed.provider : undefined,
        model: typeof parsed.model === 'string' ? parsed.model : undefined,
        importedFrom: 'json',
      };
      break;
    }

    case 'openai': {
      if (!body.assistantId?.trim() || !body.apiKey?.trim()) {
        return NextResponse.json({ data: null, error: 'Assistant ID and API key required' }, { status: 400 });
      }
      try {
        const client = new OpenAI({ apiKey: body.apiKey });
        const assistant = await client.beta.assistants.retrieve(body.assistantId);
        const instructions = 'instructions' in assistant ? (assistant.instructions as string | undefined) : undefined;
        agentData = {
          name: assistant.name || body.name || 'OpenAI Agent',
          systemPrompt: instructions ?? undefined,
          provider: 'openai',
          model: assistant.model,
          importedFrom: `openai:${body.assistantId}`,
        };
      } catch {
        return NextResponse.json({ data: null, error: 'Failed to fetch OpenAI assistant' }, { status: 400 });
      }
      break;
    }

    default:
      return NextResponse.json({ data: null, error: 'Invalid import mode' }, { status: 400 });
  }

  const existing = await prisma.agent.findUnique({ where: { userId: session.user.id } });

  if (existing) {
    const updated = await prisma.agent.update({
      where: { id: existing.id },
      data: {
        name: agentData.name,
        ...(agentData.systemPrompt !== undefined && { systemPrompt: agentData.systemPrompt }),
        ...(agentData.specialties !== undefined && { specialties: JSON.stringify(agentData.specialties) }),
        ...(agentData.provider !== undefined && { provider: agentData.provider }),
        ...(agentData.model !== undefined && { model: agentData.model }),
        ...(agentData.importedFrom !== undefined && { importedFrom: agentData.importedFrom }),
        ...(body.mode === 'openai' && body.apiKey && { apiKey: encryptKey(body.apiKey) }),
      },
    });
    return NextResponse.json({ data: { ...updated, apiKey: updated.apiKey ? '••••••••' : null }, error: null });
  }

  const created = await prisma.agent.create({
    data: {
      name: agentData.name,
      goal: 'both',
      minO2: 20,
      specialties: JSON.stringify(agentData.specialties ?? []),
      mode: 'both',
      systemPrompt: agentData.systemPrompt,
      provider: agentData.provider || 'anthropic',
      model: agentData.model || 'claude-sonnet-4-20250514',
      apiKey: body.mode === 'openai' && body.apiKey ? encryptKey(body.apiKey) : null,
      importedFrom: agentData.importedFrom,
      isLive: true,
      userId: session.user.id,
    },
  });
  return NextResponse.json({ data: { ...created, apiKey: created.apiKey ? '••••••••' : null }, error: null }, { status: 201 });
}
