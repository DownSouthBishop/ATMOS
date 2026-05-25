import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { runAgentJob } from '@/lib/ai-router';
import { calculateCost } from '@/lib/compute';
import { releaseO2 } from '@/lib/o2-actions';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  let jobId: string;
  try {
    ({ jobId } = (await req.json()) as { jobId: string });
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid request body' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { agent: true },
  });

  if (!job) {
    return NextResponse.json({ data: null, error: 'Job not found' }, { status: 404 });
  }
  if (job.status !== 'open') {
    return NextResponse.json({ data: null, error: 'Job is not open' }, { status: 400 });
  }
  if (!job.agent) {
    return NextResponse.json({ data: null, error: 'No agent assigned to job' }, { status: 400 });
  }

  try {
    const result = await runAgentJob(job, job.agent);
    const compute = calculateCost(job.agent.model, result.tokensIn, result.tokensOut);
    const actualO2Cost = compute.o2Cost;
    const refundO2 = Math.max(0, job.o2Budget - actualO2Cost);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        output: result.output,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        computeCostUsd: compute.computeCostUsd,
        platformFeeUsd: compute.platformFeeUsd,
        o2Cost: actualO2Cost,
        o2Refund: refundO2,
      },
    });

    await releaseO2(jobId, actualO2Cost, refundO2);

    const receiptNumber = 'RCP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    await prisma.receipt.create({
      data: {
        receiptNumber,
        type: 'job_completion',
        title: job.title,
        partyAId: job.agent.userId,
        partyAName: job.agent.name,
        partyBId: job.postedById ?? undefined,
        partyBName: job.postedById ? 'Client' : '',
        settlementCurrency: 'O2',
        settlementAmount: actualO2Cost.toFixed(2),
        paymentNotes: `Compute: $${compute.computeCostUsd.toFixed(4)} + platform fee: $${compute.platformFeeUsd.toFixed(4)}`,
        status: 'pending',
        sigA: true,
        sigB: false,
        jobId,
        ownerId: job.agent.userId,
      },
    });

    return NextResponse.json({
      data: {
        output: result.output,
        compute: {
          tokensIn: result.tokensIn,
          tokensOut: result.tokensOut,
          computeCostUsd: compute.computeCostUsd,
          platformFeeUsd: compute.platformFeeUsd,
          totalUsd: compute.totalUsd,
          o2Cost: actualO2Cost,
          o2Refund: refundO2,
        },
      },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Agent execution failed';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}
