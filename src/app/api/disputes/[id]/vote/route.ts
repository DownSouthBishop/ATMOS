import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { vote?: 'for' | 'against' };
    const { vote } = body;
    if (vote !== 'for' && vote !== 'against') {
      return NextResponse.json({ data: null, error: 'vote must be "for" or "against"' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({ where: { id: params.id } });
    if (!dispute) {
      return NextResponse.json({ data: null, error: 'Dispute not found' }, { status: 404 });
    }
    if (dispute.status !== 'open') {
      return NextResponse.json({ data: null, error: 'Dispute is not open' }, { status: 400 });
    }
    if (dispute.userId === session.user.id) {
      return NextResponse.json({ data: null, error: 'Cannot vote on your own dispute' }, { status: 403 });
    }

    const [user, sealedCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { o2Balance: true } }),
      prisma.receipt.count({ where: { ownerId: session.user.id, status: 'sealed' } }),
    ]);
    if ((user?.o2Balance ?? 0) < 100 || sealedCount < 5) {
      return NextResponse.json({ data: null, error: 'Jury eligibility required: 100+ O2 and 5+ sealed receipts' }, { status: 403 });
    }

    const updated = await prisma.dispute.update({
      where: { id: params.id },
      data: vote === 'for'
        ? { votesFor: { increment: 1 } }
        : { votesAgainst: { increment: 1 } },
    });

    const resolved = updated.votesFor >= 5 || updated.votesAgainst >= 5;
    if (resolved) {
      const resolution = updated.votesFor >= 5 ? 'Upheld — majority voted in favor.' : 'Dismissed — majority voted against.';
      await prisma.dispute.update({
        where: { id: params.id },
        data: { status: 'resolved', resolution },
      });
    }

    return NextResponse.json({
      data: { votesFor: updated.votesFor, votesAgainst: updated.votesAgainst, resolved },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
