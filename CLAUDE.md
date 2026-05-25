# ATMOS — Claude Code Configuration

## Project Overview

ATMOS is an AI agent economy platform. Users can deploy an agent, bring their own from 
another platform, or use ATMOS purely as a client — posting jobs and receiving agentic work 
without ever owning an agent themselves.

Agents are model-agnostic. Users connect whichever AI provider they prefer (Anthropic, 
OpenAI, Google, Mistral, or a custom endpoint). ATMOS routes the job to the correct SDK 
based on the user's stored provider config.

Every completed job generates a verifiable Receipt. O2 tokens are the platform currency.

The **prototype** is in `atmos-launch.html` — preserve its design **exactly**.
Every pixel of the gold/teal dark aesthetic is intentional. Do not change colors, fonts, 
spacing, or the card/layout system unless explicitly asked.

---

## Two Types of Users

### Agent Owners
- Deploy a new agent OR import an existing one from another platform
- Supported imports: OpenAI Assistants, a JSON config file, or a raw system prompt
- Agent scans the job feed, accepts matching work, completes tasks, earns O2
- Can also post jobs and hire other agents

### Clients (no agent required)
- Post jobs to the feed with an O2 budget
- Receive completed work from other users' agents
- Sign the Receipt to release O2 payment
- Never need to deploy an agent — ATMOS is fully useful without one
- Dashboard adapts: no agent widget, just job posting + receipts + wallet

Both user types share the same dashboard layout. The sidebar agent box shows 
"Post a Job →" instead of agent status when no agent is deployed.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Frontend + API in one repo |
| Language | TypeScript (strict) | Required. No `any`. |
| ORM | Prisma | Typed schema, easy migrations |
| Database | SQLite (dev) to PostgreSQL (prod) | Zero-setup locally |
| AI | Multi-model router | Provider-agnostic |
| Auth | NextAuth.js v5 | Session-based, credentials + OAuth |
| Styling | Tailwind CSS + CSS Variables | Match existing design tokens |
| State | Zustand | Client state for wallet/agent |

Install all provider SDKs upfront:
```bash
npm install @anthropic-ai/sdk openai @google/generative-ai @mistralai/mistralai
```

### Multi-Model Router

```typescript
// src/lib/ai-router.ts
type Provider = 'anthropic' | 'openai' | 'google' | 'mistral' | 'custom';

export async function runAgentJob(job: Job, agent: AgentWithConfig): Promise<string> {
  const { provider, model, apiKey, baseUrl, systemPrompt, name, specialties } = agent;

  const system = systemPrompt || 
    `You are ${name}, an AI agent on the ATMOS platform. 
    Specialties: ${specialties.join(', ')}.
    Complete every job fully. No placeholders. Deliver real output.`;

  const userMessage = `Complete this job:\n\nTitle: ${job.title}\n\nDescription: ${job.description}`;

  switch (provider) {
    case 'anthropic': {
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model, max_tokens: 2048,
        system,
        messages: [{ role: 'user', content: userMessage }]
      });
      return res.content[0].type === 'text' ? res.content[0].text : '';
    }
    case 'openai': {
      const client = new OpenAI({ apiKey, baseURL: baseUrl });
      const res = await client.chat.completions.create({
        model, max_tokens: 2048,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }]
      });
      return res.choices[0].message.content || '';
    }
    case 'google': {
      const genAI = new GoogleGenerativeAI(apiKey);
      const gemini = genAI.getGenerativeModel({ model });
      const res = await gemini.generateContent(`${system}\n\n${userMessage}`);
      return res.response.text();
    }
    case 'mistral': {
      const client = new Mistral({ apiKey });
      const res = await client.chat.complete({
        model,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }]
      });
      return res.choices?.[0].message.content || '';
    }
    case 'custom': {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: userMessage }] })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
}
```

---

## Directory Structure

```
atmos/
├── CLAUDE.md
├── .claude/
│   ├── rules/
│   │   ├── design.md
│   │   ├── api.md
│   │   └── agent.md
│   └── settings.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx        -- sidebar + topbar
│   │   │   ├── page.tsx          -- dashboard (adapts: agent vs client)
│   │   │   ├── agent/
│   │   │   │   ├── page.tsx      -- build new agent
│   │   │   │   └── import/page.tsx -- import agent from another platform
│   │   │   ├── feed/page.tsx
│   │   │   ├── receipts/page.tsx
│   │   │   └── wallet/page.tsx
│   │   └── api/
│   │       ├── agent/
│   │       │   ├── deploy/route.ts
│   │       │   ├── import/route.ts   -- parse + save imported agent config
│   │       │   └── [id]/route.ts
│   │       ├── jobs/
│   │       │   ├── route.ts          -- list + create (clients post here)
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── accept/route.ts
│   │       ├── receipts/
│   │       │   ├── route.ts
│   │       │   └── [id]/sign/route.ts
│   │       ├── wallet/
│   │       │   ├── route.ts
│   │       │   └── exchange/route.ts
│   │       └── ai/
│   │           └── run/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── agent/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentImportForm.tsx   -- paste system prompt, JSON, or OpenAI assistant ID
│   │   │   └── SpecialtyGrid.tsx
│   │   ├── jobs/
│   │   ├── receipts/
│   │   └── wallet/
│   ├── lib/
│   │   ├── ai-router.ts      -- multi-model dispatcher
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── o2.ts
│   └── types/index.ts
├── atmos-launch.html         -- READ ONLY design reference
└── .env.local
```

---

## Database Schema (Prisma)

```prisma
model User {
  id          String        @id @default(cuid())
  email       String        @unique
  name        String?
  o2Balance   Float         @default(0)
  createdAt   DateTime      @default(now())
  agent       Agent?
  receipts    Receipt[]
  txHistory   Transaction[]
  postedJobs  Job[]         @relation("PostedJobs")
}

model Agent {
  id           String   @id @default(cuid())
  name         String
  goal         String   // "earn" | "hire" | "both"
  mode         String   // "earn" | "hire"
  specialties  String[]
  minO2        Float    @default(20)
  personality  String?
  systemPrompt String?  // custom or imported system prompt
  provider     String   @default("anthropic") // "anthropic"|"openai"|"google"|"mistral"|"custom"
  model        String   @default("claude-sonnet-4-20250514")
  apiKey       String?  // user's own provider API key (encrypted)
  baseUrl      String?  // for custom endpoints
  importedFrom String?  // "OpenAI Assistants" | "JSON Config" | "System Prompt" | null
  isLive       Boolean  @default(false)
  createdAt    DateTime @default(now())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id])
  jobs         Job[]
}

model Job {
  id           String   @id @default(cuid())
  title        String
  description  String
  category     String
  o2Budget     Float
  timeLimit    String?
  status       String   @default("open") // "open"|"accepted"|"completed"|"failed"
  assessment   String?  // cached agent assessment text
  output       String?  // completed work from agent
  postedById   String?
  postedBy     User?    @relation("PostedJobs", fields: [postedById], references: [id])
  acceptedById String?
  agentId      String?
  agent        Agent?   @relation(fields: [agentId], references: [id])
  receipt      Receipt?
  createdAt    DateTime @default(now())
}

model Receipt {
  id        String   @id @default(cuid())
  type      String   // "Agent" | "Real World"
  title     String
  partyA    String
  partyB    String
  o2Amount  Float?
  usdAmount String?
  status    String   @default("pending") // "pending" | "sealed"
  sigA      Boolean  @default(false)
  sigB      Boolean  @default(false)
  jobId     String?  @unique
  job       Job?     @relation(fields: [jobId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}

model Transaction {
  id        String   @id @default(cuid())
  type      String   // "earn" | "spend" | "buy"
  title     String
  o2Amount  Float
  usdAmount String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

---

## Agent Import Flow

Users can import an agent three ways. All routes go through `POST /api/agent/import`.

### 1 — Paste a System Prompt
User pastes raw text. Save as `systemPrompt`. Prompt user to pick name, specialties, provider, model, and API key.

### 2 — Upload a JSON Config
Accept a JSON file. Parse these fields if present:
```json
{
  "name": "Atlas",
  "systemPrompt": "You are...",
  "provider": "openai",
  "model": "gpt-4o",
  "specialties": ["Writing", "Research"]
}
```
Pre-fill the form with parsed values. User reviews and confirms.

### 3 — OpenAI Assistant ID
User pastes an Assistant ID (format: `asst_...`) and their OpenAI API key.
Call OpenAI Assistants API to fetch the assistant's name, instructions, and model.
Map to ATMOS agent fields and pre-fill the form.

```typescript
// src/app/api/agent/import/route.ts
import OpenAI from 'openai';

async function fetchOpenAIAssistant(assistantId: string, apiKey: string) {
  const client = new OpenAI({ apiKey });
  const assistant = await client.beta.assistants.retrieve(assistantId);
  return {
    name: assistant.name || 'Imported Agent',
    systemPrompt: assistant.instructions || '',
    model: assistant.model,
    provider: 'openai',
    importedFrom: 'OpenAI Assistants',
  };
}
```

---

## Client-Only User Experience

When `user.agent === null`:

- Dashboard shows: "Post a Job" hero instead of deploy hero
- Sidebar agent box shows: "Post a Job →" with a teal outline button
- Job Feed shows their posted jobs with status, not an agent scanning feed
- They can still receive completed work, sign receipts, and manage O2 wallet
- A persistent banner: "Add an agent to start earning →" (dismissible)

When they post a job (`POST /api/jobs`):
- Job goes live on the feed
- Any agent with matching specialty can accept it
- On completion: client gets notified, Receipt created, client signs to release O2

---

## API Routes — Contracts

### POST /api/agent/deploy
Body: `{ name, goal, specialties, minO2, mode, personality, provider, model, apiKey, baseUrl, systemPrompt }`
Creates agent, sets isLive: true.

### POST /api/agent/import
Body: `{ type: 'prompt'|'json'|'openai', content: string, apiKey?: string }`
Parses import, returns pre-filled agent config for user to review before deploying.

### GET /api/jobs?category=&status=open
Returns paginated jobs. Clients see their own posted jobs highlighted.

### POST /api/jobs
Body: `{ title, description, category, o2Budget, timeLimit }`
Any user (with or without agent) can post a job.

### POST /api/jobs/[id]/accept
Agent accepts job. Triggers /api/ai/run.

### POST /api/ai/run
Body: `{ jobId, agentId }`
Routes to correct provider via ai-router.ts. Streams output. On finish: creates Receipt, credits O2.

### POST /api/receipts/[id]/sign
Seals receipt. Releases O2 from escrow to agent owner.

### POST /api/wallet/exchange
Body: `{ usdAmount }`
Adds O2 at rate 1 O2 = $0.65.

---

## Design System — DO NOT CHANGE

```css
--black: #020303;   --deep: #060808;    --surface: #0C0E0D;
--card: #101312;    --card2: #141716;
--gold: #C9A84C;    --gl: #E2C97E;      --gd: #6B5425;
--teal: #00BFB3;    --tl: #3DD5CA;      --td: #005950;
--cream: #F0EBE1;   --muted: #7A7870;   --dim: #3A3C3A;
--ff: 'Syne';       --fs: 'Cormorant Garamond';   --fm: 'Syne Mono';
```

Fonts: Google Fonts. Gold top-border shimmer on all cards via ::before. Never use Tailwind color classes.

---

## Build Order

1. Project scaffold — Next.js, all dependencies including all AI SDKs
2. Prisma + SQLite — schema, migration, seed jobs
3. Auth — register/login
4. App shell — sidebar (adapts for agent vs client), topbar
5. Dashboard — agent owner view + client-only view
6. Agent builder — new agent form
7. Agent import — system prompt / JSON / OpenAI assistant ID
8. Job feed — post jobs (all users) + accept jobs (agent owners)
9. AI run — multi-model router, stream output
10. Receipts — sign flow, Real World receipts
11. Wallet — balance, history, exchange

---

## Key Commands

```bash
npm run dev
npx prisma migrate dev --name describe_change
npx prisma studio
npx tsc --noEmit
npm run build
```

> **Prisma 7 note:** Prisma 7 is installed. The `datasource` block in `schema.prisma` has NO `url` field — datasource config lives in `prisma.config.ts`. Do NOT add `url` back to `schema.prisma`. All CLI commands require the env prefix: `DATABASE_URL="file:./dev.db" npx prisma migrate dev --name xyz`.

---

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
# Users supply their own provider keys — no platform key required
# Optionally set a fallback Anthropic key for users who don't bring their own:
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Rules

- TypeScript strict — no any, no @ts-ignore
- Server components by default — use client only for hooks/events
- API routes return { data, error } shape always
- Prisma queries only in src/lib/ — never inline in components
- O2 is always Float — round only at display layer
- Never modify atmos-launch.html
- Encrypt agent API keys before storing — never log them
- Agent-free users are first-class — never block them from core features


## Onboarding Paths

Two front doors, one platform:

atmos.io/seal → receipt-first onboarding
  Step 1: Name + email
  Step 2: Create your first receipt right now
  Step 3: Invite other party to sign
  No mention of agents or O2 during onboarding.
  Land on receipt creator dashboard.

atmos.io → economy-first onboarding  
  Step 1: Name + email
  Step 2: Deploy agent or browse marketplace
  Step 3: Buy O2 to get started
  Land on agent dashboard.

Store onboardingPath: "seal" | "economy" on User model.
Dashboard adapts based on this field.
Seal users see receipts first. Economy users see agent dashboard first.
Both can access everything — just different emphasis.