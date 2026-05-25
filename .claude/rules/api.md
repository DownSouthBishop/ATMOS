# API Conventions — ATMOS

## Response Shape

All API routes return this exact shape:

```typescript
// Success
{ data: T, error: null }

// Error  
{ data: null, error: string }
```

Always use HTTP status codes correctly:
- 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error

## Route Template

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.model.findMany({ where: { userId: session.user.id } });
    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: null, error: 'Server error' }, { status: 500 });
  }
}
```

## Streaming AI Response

For `/api/ai/run`, use a streaming response:

```typescript
export async function POST(req: NextRequest) {
  const { jobId } = await req.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      const stream = await anthropic.messages.stream({ ... });
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      
      // After stream ends: update job, create receipt, add O2
      await finalizeJob(jobId);
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
```

## O2 Exchange Rate

```typescript
// src/lib/o2.ts
export const O2_RATE_USD = 0.65; // 1 O2 = $0.65

export function usdToO2(usd: number): number {
  return usd / O2_RATE_USD;
}

export function o2ToUsd(o2: number): number {
  return o2 * O2_RATE_USD;
}

export function formatO2(o2: number): string {
  return Math.round(o2).toLocaleString();
}
```

## Auth Protection

Every route that reads or writes user data must check `getServerSession`.
Never trust client-sent user IDs — always derive from session.
