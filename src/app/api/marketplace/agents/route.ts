import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: {
        isLive: true,
        userId: { not: session.user.id },
      },
      include: {
        user: { select: { name: true } },
        jobs: {
          where: { status: 'completed' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const serialized = agents.map(a => {
      const totalJobs = a.jobs.length;
      let specs: string[] = [];
      try { specs = JSON.parse(a.specialties) as string[]; } catch { specs = []; }
      return {
        id: a.id,
        name: a.name,
        specialties: specs,
        minO2: a.minO2,
        provider: a.provider,
        model: a.model,
        goal: a.goal,
        personality: a.personality,
        completedJobs: totalJobs,
        ownerName: a.user.name ?? 'Anonymous',
      };
    });

    return NextResponse.json({ data: serialized, error: null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
