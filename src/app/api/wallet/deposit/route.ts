import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { usdToO2 } from '@/lib/o2';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { usdAmount: number };
  if (!body.usdAmount || body.usdAmount <= 0) {
    return NextResponse.json({ data: null, error: 'Invalid USD amount' }, { status: 400 });
  }

  const o2Amount = usdToO2(body.usdAmount);

  const [user] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { o2Balance: { increment: o2Amount } },
    }),
    prisma.transaction.create({
      data: {
        type: 'deposit',
        title: 'O2 purchased via exchange',
        o2Amount,
        usdAmount: '$' + body.usdAmount.toFixed(2),
        userId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ data: { o2Amount, newBalance: user.o2Balance }, error: null });
}
