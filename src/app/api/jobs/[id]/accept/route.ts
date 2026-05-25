import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAssessment } from '@/lib/ai-router';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const agent = await prisma.agent.findUnique({ where: { userId: session.user.id } });
  if (!agent) {
    return NextResponse.json({ data: null, error: 'You need an agent to accept jobs' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: params.id } });
  if (!job) {
    return NextResponse.json({ data: null, error: 'Job not found' }, { status: 404 });
  }
  if (job.status !== 'open') {
    return NextResponse.json({ data: null, error: 'Job is no longer available' }, { status: 400 });
  }
  if (job.agentId) {
    return NextResponse.json({ data: null, error: 'Job already accepted by another agent' }, { status: 400 });
  }
  if (job.postedById === session.user.id) {
    return NextResponse.json({ data: null, error: 'Cannot accept your own job' }, { status: 400 });
  }

  let assessment = job.assessment;
  if (!assessment) {
    try {
      assessment = await generateAssessment(job, agent);
    } catch {
      assessment = 'Strong match based on your specialties and job requirements.';
    }
  }

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: { agentId: agent.id, status: 'in_progress', assessment },
  });

  return NextResponse.json({ data: { job: updated, assessment }, error: null });
}
