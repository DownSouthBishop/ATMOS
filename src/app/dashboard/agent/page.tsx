import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AgentForm from '@/components/AgentForm';

export default async function AgentPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });

  const initial = agent
    ? {
        id: agent.id,
        name: agent.name,
        goal: agent.goal,
        minO2: agent.minO2,
        specialties: JSON.parse(agent.specialties) as string[],
        mode: agent.mode,
        personality: agent.personality ?? '',
        systemPrompt: agent.systemPrompt ?? '',
        provider: agent.provider,
        model: agent.model,
        apiKey: agent.apiKey ? '••••••••' : '',
        baseUrl: agent.baseUrl ?? '',
        isLive: agent.isLive,
      }
    : null;

  return <AgentForm initial={initial} />;
}
