import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptKey } from '@/lib/crypto';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }
  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) return NextResponse.json({ data: null, error: null });
  return NextResponse.json({ data: { ...agent, apiKey: agent.apiKey ? '••••••••' : null }, error: null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }
  const existing = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (existing) {
    return NextResponse.json({ data: null, error: 'Agent already exists. Use PUT to update.' }, { status: 400 });
  }
  const body = await req.json() as {
    name?: string; goal?: string; minO2?: number; specialties?: string[];
    mode?: string; personality?: string; systemPrompt?: string;
    provider?: string; model?: string; apiKey?: string; baseUrl?: string;
  };
  const agent = await prisma.agent.create({
    data: {
      name: body.name || 'Atlas',
      goal: body.goal || 'both',
      minO2: body.minO2 ?? 20,
      specialties: JSON.stringify(body.specialties ?? []),
      mode: body.mode || 'both',
      personality: body.personality,
      systemPrompt: body.systemPrompt,
      provider: body.provider || 'anthropic',
      model: body.model || 'claude-sonnet-4-20250514',
      apiKey: body.apiKey ? encryptKey(body.apiKey) : null,
      baseUrl: body.baseUrl,
      isLive: true,
      userId: session.user.id,
    },
  });
  return NextResponse.json({ data: { ...agent, apiKey: body.apiKey ? '••••••••' : null }, error: null }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }
  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) {
    return NextResponse.json({ data: null, error: 'No agent found.' }, { status: 404 });
  }
  const body = await req.json() as {
    name?: string; goal?: string; minO2?: number; specialties?: string[];
    mode?: string; personality?: string; systemPrompt?: string;
    provider?: string; model?: string; apiKey?: string; baseUrl?: string; isLive?: boolean;
  };
  const updated = await prisma.agent.update({
    where: { id: agent.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.goal !== undefined && { goal: body.goal }),
      ...(body.minO2 !== undefined && { minO2: body.minO2 }),
      ...(body.specialties !== undefined && { specialties: JSON.stringify(body.specialties) }),
      ...(body.mode !== undefined && { mode: body.mode }),
      ...(body.personality !== undefined && { personality: body.personality }),
      ...(body.systemPrompt !== undefined && { systemPrompt: body.systemPrompt }),
      ...(body.provider !== undefined && { provider: body.provider }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.apiKey !== undefined && body.apiKey !== '••••••••' && {
        apiKey: body.apiKey ? encryptKey(body.apiKey) : null,
      }),
      ...(body.baseUrl !== undefined && { baseUrl: body.baseUrl }),
      ...(body.isLive !== undefined && { isLive: body.isLive }),
    },
  });
  return NextResponse.json({ data: { ...updated, apiKey: updated.apiKey ? '••••••••' : null }, error: null });
}
