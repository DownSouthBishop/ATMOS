import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MarketplaceClient from '@/components/MarketplaceClient';

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [agents, user] = await Promise.all([
    prisma.agent.findMany({
      where: { isLive: true, userId: { not: session.user.id } },
      include: {
        user: { select: { name: true } },
        jobs: { where: { status: 'completed' }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { o2Balance: true },
    }),
  ]);

  if (!user) redirect('/login');

  const serialized = agents.map(a => {
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
      completedJobs: a.jobs.length,
      ownerName: a.user.name ?? 'Anonymous',
    };
  });

  return <MarketplaceClient agents={serialized} o2Balance={user.o2Balance} />;
}
