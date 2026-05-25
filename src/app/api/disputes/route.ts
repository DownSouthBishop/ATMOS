import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const [myDisputes, juryDisputes, user, sealedCount] = await Promise.all([
      prisma.dispute.findMany({
        where: { userId: session.user.id },
        include: {
          receipt: { select: { title: true, receiptNumber: true } },
          job: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dispute.findMany({
        where: {
          status: 'open',
          userId: { not: session.user.id },
        },
        include: {
          receipt: { select: { title: true, receiptNumber: true } },
          job: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { o2Balance: true },
      }),
      prisma.receipt.count({
        where: {
          ownerId: session.user.id,
          status: 'sealed',
        },
      }),
    ]);

    const juryEligible = (user?.o2Balance ?? 0) >= 100 && sealedCount >= 5;

    const serialize = (d: typeof myDisputes[0]) => ({
      id: d.id,
      reason: d.reason,
      status: d.status,
      resolution: d.resolution,
      votesFor: d.votesFor,
      votesAgainst: d.votesAgainst,
      createdAt: d.createdAt.toISOString(),
      receiptTitle: d.receipt?.title ?? d.job?.title ?? 'Unknown',
      receiptNumber: d.receipt?.receiptNumber ?? null,
    });

    return NextResponse.json({
      data: {
        myDisputes: myDisputes.map(serialize),
        juryDisputes: juryEligible ? juryDisputes.map(serialize) : [],
        juryEligible,
      },
      error: null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as {
      reason?: string;
      receiptId?: string;
      jobId?: string;
    };
    const { reason, receiptId, jobId } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ data: null, error: 'Reason is required' }, { status: 400 });
    }
    if (!receiptId && !jobId) {
      return NextResponse.json({ data: null, error: 'receiptId or jobId required' }, { status: 400 });
    }

    // Verify ownership
    if (receiptId) {
      const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } });
      if (!receipt) return NextResponse.json({ data: null, error: 'Receipt not found' }, { status: 404 });
      const authorized = receipt.ownerId === session.user.id ||
        receipt.partyAId === session.user.id ||
        receipt.partyBId === session.user.id;
      if (!authorized) return NextResponse.json({ data: null, error: 'Not authorized' }, { status: 403 });

      const existing = await prisma.dispute.findUnique({ where: { receiptId } });
      if (existing) return NextResponse.json({ data: null, error: 'Dispute already open' }, { status: 409 });
    }

    const dispute = await prisma.dispute.create({
      data: {
        reason: reason.trim(),
        userId: session.user.id,
        receiptId,
        jobId,
        status: 'open',
      },
    });

    if (receiptId) {
      await prisma.receipt.update({ where: { id: receiptId }, data: { status: 'disputed' } });
    }

    return NextResponse.json({ data: { id: dispute.id }, error: null }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
