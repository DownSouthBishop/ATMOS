import { prisma } from '@/lib/prisma';

export async function lockO2(userId: string, amount: number, jobId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { o2Balance: { decrement: amount } },
    }),
    prisma.transaction.create({
      data: { type: 'escrow', title: 'O2 locked for job', o2Amount: amount, jobId, userId },
    }),
  ]);
}

export async function releaseO2(
  jobId: string,
  actualO2Cost: number,
  refundO2: number
): Promise<void> {
  const escrow = await prisma.transaction.findFirst({
    where: { jobId, type: 'escrow' },
  });
  if (!escrow) return;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { agent: { include: { user: true } } },
  });
  if (!job?.agent) throw new Error('Job or agent not found: ' + jobId);

  const agentUserId = job.agent.userId;
  const clientUserId = job.postedById;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
    prisma.user.update({
      where: { id: agentUserId },
      data: { o2Balance: { increment: actualO2Cost } },
    }),
    prisma.transaction.create({
      data: {
        type: 'earned',
        title: 'O2 earned from job',
        o2Amount: actualO2Cost,
        jobId,
        userId: agentUserId,
      },
    }),
    prisma.transaction.delete({ where: { id: escrow.id } }),
  ];

  if (refundO2 > 0 && clientUserId) {
    ops.push(
      prisma.user.update({
        where: { id: clientUserId },
        data: { o2Balance: { increment: refundO2 } },
      }),
      prisma.transaction.create({
        data: {
          type: 'refund',
          title: 'O2 refund from job',
          o2Amount: refundO2,
          jobId,
          userId: clientUserId,
        },
      })
    );
  }

  await prisma.$transaction(ops);
}
