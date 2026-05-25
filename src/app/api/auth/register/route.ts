import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      email?: string;
      name?: string;
      password?: string;
      onboardingPath?: string;
    };
    const { email, name, password, onboardingPath } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const resolvedPath = onboardingPath === 'seal' ? 'seal' : 'economy';

    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name?.trim() || null,
        password: hash,
        onboardingPath: resolvedPath,
      },
    });

    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
