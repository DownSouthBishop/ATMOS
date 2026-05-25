# ATMOS Setup Guide

Everything you need to go from zero to running with Claude Code.

---

## Step 1 — Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Then authenticate:
```bash
claude
```
Follow the OAuth flow in your browser. You'll need an Anthropic account.

---

## Step 2 — Copy the Config Files Into Your Project

From this folder, copy the scaffold into your new project directory:

```bash
# Create your project folder
mkdir atmos && cd atmos

# Copy the Claude Code config
cp -r /path/to/this-folder/.claude ./.claude
cp /path/to/this-folder/CLAUDE.md ./CLAUDE.md

# Copy the prototype (READ ONLY reference)
cp /path/to/atmos-launch.html ./atmos-launch.html
```

---

## Step 3 — Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)
4. Keep it — you'll need it in Step 6

---

## Step 4 — Let Claude Code Scaffold the App

```bash
# From your atmos/ directory
claude
```

Then paste this first prompt:

```
Read CLAUDE.md and all files in .claude/rules/ carefully.

Then scaffold the full Next.js 14 project:
- Run: npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
- Install: npm install @prisma/client prisma next-auth @anthropic-ai/sdk zustand
- Install dev: npm install -D @types/node

After installing, create:
1. prisma/schema.prisma with the full schema from CLAUDE.md
2. src/lib/prisma.ts — Prisma singleton
3. src/lib/anthropic.ts — Anthropic client + runAgentJob function
4. src/lib/o2.ts — O2 math helpers
5. src/app/layout.tsx — Google Fonts (Syne, Cormorant Garamond, Syne Mono) + CSS variables from design.md
6. Run: npx prisma migrate dev --name init

Do not build any pages yet. Confirm when done.
```

---

## Step 5 — Build the Shell

Once scaffold is confirmed, send:

```
Now build the app shell — the persistent layout that wraps all dashboard pages.

Reference atmos-launch.html carefully for the sidebar and topbar.

Build:
- src/app/dashboard/layout.tsx — sidebar (220px) + topbar (54px) + content area
- src/components/ui/NavItem.tsx
- src/components/ui/Card.tsx  
- src/components/ui/Button.tsx (variants: gold, teal, outline, sm, xs, lg, full)
- src/components/ui/Tag.tsx (variants: gold, teal, green, amber, muted)
- src/components/ui/Modal.tsx

Use CSS variables throughout. Match the prototype pixel-for-pixel.
The sidebar wallet widget and agent status box should be client components with Zustand state.
```

---

## Step 6 — Add Secrets

```bash
# Create .env.local
cat > .env.local << 'EOF'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"
EOF
```

Replace `sk-ant-YOUR_KEY_HERE` with your actual key from Step 3.

---

## Step 7 — Build Features (One at a Time)

Send these prompts to Claude Code **in order**. Wait for confirmation before the next.

### Auth
```
Build auth: register + login pages at /login and /register.
Dark-themed, minimal. Use the ATMOS design system.
NextAuth with credentials provider. Store hashed passwords in User model.
Add a password field to the Prisma User model and migrate.
```

### Dashboard
```
Build the dashboard page at /dashboard.
Wire it to real data from the DB.
Show the deploy hero (from prototype) if no agent exists.
Show the live dashboard with stats, active jobs, recent receipts if agent is deployed.
```

### Agent Builder
```
Build /dashboard/agent — the agent builder page.
Form fields: name, goal (select), minO2 (number), specialties (grid, max 3).
On submit: POST /api/agent/deploy.
After deploy: update sidebar agent widget, show live status dot.
```

### Job Feed
```
Build /dashboard/feed — the job feed page.
Seed 7 jobs from the JOBS array in atmos-launch.html into the DB.
Filter buttons: All, Writing, Research, Marketing, Data, Design, Code.
Each job card has an Accept button. On accept: POST /api/jobs/[id]/accept.
Then call POST /api/ai/run — stream Claude's output into a job detail modal.
```

### Receipts
```
Build /dashboard/receipts.
Show all receipts for the current user.
Pending receipts have a Sign button → POST /api/receipts/[id]/sign.
On sign: seal the receipt, update wallet, show share modal.
Real World Receipt modal: POST /api/receipts with type: "Real World".
```

### Wallet
```
Build /dashboard/wallet.
Show O2 balance, USD equivalent (rate: 1 O2 = $0.65).
Transaction history from DB.
Buy O2 modal: POST /api/wallet/exchange.
WCPI live rate: tick every 12s using a small random variance (±0.02).
```

---

## Step 8 — Run It

```bash
npm run dev
```

Open http://localhost:3000 → Register → Deploy your agent → Accept a job → watch Claude work.

---

## Troubleshooting

**Prisma errors after schema change:**
```bash
npx prisma migrate dev --name describe_your_change
```

**Type errors:**
```bash
npx tsc --noEmit
```
Then ask Claude Code: `Fix all TypeScript errors shown by tsc --noEmit`

**SQLite locked:**
Stop dev server, run `npx prisma studio` to inspect, restart.

**Claude Code lost context:**
Run `/clear` in Claude Code, then start your next prompt with:
`Re-read CLAUDE.md and .claude/rules/ before continuing.`
