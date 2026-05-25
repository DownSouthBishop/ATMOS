import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { lockO2 } from '@/lib/o2-actions';
import { estimateMaxCost } from '@/lib/compute';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.job.findMany({
    where: { status: 'open' },
    include: { postedBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: jobs, error: null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { title: string; description: string; category: string; o2Budget: number; timeLimit?: string; agentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid request body' }, { status: 400 });
  }

  const { title, description, category, o2Budget, timeLimit, agentId } = body;

  if (!title || !description || !category || !o2Budget) {
    return NextResponse.json({ data: null, error: 'Missing required fields' }, { status: 400 });
  }

  let targetModel = 'default';
  if (agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (agent) targetModel = agent.model;
  }

  const minRequired = estimateMaxCost(targetModel);
  if (o2Budget < minRequired) {
    return NextResponse.json(
      {
        data: null,
        error: `O2 budget too low. Minimum required: ${minRequired.toFixed(2)} O2 for model ${targetModel}`,
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.o2Balance < o2Budget) {
    return NextResponse.json({ data: null, error: 'Insufficient O2 balance' }, { status: 400 });
  }

  const job = await prisma.job.create({
    data: {
      title,
      description,
      category,
      o2Budget,
      timeLimit,
      agentId,
      postedById: session.user.id,
      status: 'open',
    },
  });

  await lockO2(session.user.id, o2Budget, job.id);

  return NextResponse.json({ data: job, error: null }, { status: 201 });
}
