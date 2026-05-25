import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import FeedClient from '@/components/FeedClient';

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const [jobs, agent] = await Promise.all([
    prisma.job.findMany({
      where: { status: 'open', agentId: null },
      include: { postedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.agent.findUnique({ where: { userId: session.user.id } }),
  ]);

  const serialized = jobs.map(j => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
  }));

  return <FeedClient jobs={serialized} hasAgent={!!agent} />;
}
