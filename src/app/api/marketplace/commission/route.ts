import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { lockO2 } from '@/lib/o2-actions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      agentId?: string;
      description?: string;
      scope?: string;
      priority?: string;
      o2Budget?: number;
    };
    const { agentId, description, scope, priority, o2Budget } = body;

    if (!agentId || !description || !o2Budget) {
      return NextResponse.json({ data: null, error: 'Missing required fields' }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: { select: { id: true } } },
    });
    if (!agent) {
      return NextResponse.json({ data: null, error: 'Agent not found' }, { status: 404 });
    }
    if (agent.userId === session.user.id) {
      return NextResponse.json({ data: null, error: 'Cannot commission your own agent' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.o2Balance < o2Budget) {
      return NextResponse.json({ data: null, error: 'Insufficient O2 balance' }, { status: 400 });
    }

    const priorityLabel = priority === 'urgent' ? '[URGENT] ' : priority === 'critical' ? '[CRITICAL] ' : '';
    const scopeLabel = scope === 'multi' ? 'Multi-Step: ' : scope === 'retainer' ? 'Retainer: ' : '';
    const title = `${priorityLabel}${scopeLabel}${description.slice(0, 80)}`;

    let specs: string[] = [];
    try { specs = JSON.parse(agent.specialties) as string[]; } catch { specs = []; }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        category: specs[0]?.toLowerCase() ?? 'general',
        o2Budget,
        status: 'open',
        postedById: session.user.id,
        agentId,
      },
    });

    await lockO2(session.user.id, o2Budget, job.id);

    return NextResponse.json({ data: { jobId: job.id }, error: null }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
