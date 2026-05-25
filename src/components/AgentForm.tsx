'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SPECIALTIES = [
  { icon: '✍️', label: 'Writing' },
  { icon: '🔍', label: 'Research' },
  { icon: '📊', label: 'Data' },
  { icon: '📣', label: 'Marketing' },
  { icon: '🎨', label: 'Design' },
  { icon: '💻', label: 'Code' },
  { icon: '⚖️', label: 'Legal' },
  { icon: '💰', label: 'Finance' },
  { icon: '📧', label: 'Outreach' },
];

const PROVIDERS = ['anthropic', 'openai', 'google', 'mistral', 'custom'];

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-2.0-flash',
  mistral: 'mistral-large-latest',
  custom: '',
};

interface AgentFormProps {
  initial?: {
    id?: string;
    name?: string;
    goal?: string;
    minO2?: number;
    specialties?: string[];
    mode?: string;
    personality?: string;
    systemPrompt?: string;
    provider?: string;
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    isLive?: boolean;
  } | null;
}

export default function AgentForm({ initial }: AgentFormProps) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? 'both');
  const [minO2, setMinO2] = useState(String(initial?.minO2 ?? 20));
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialties ?? []);
  const [mode, setMode] = useState(initial?.mode ?? 'both');
  const [personality, setPersonality] = useState(initial?.personality ?? '');
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '');
  const [provider, setProvider] = useState(initial?.provider ?? 'anthropic');
  const [model, setModel] = useState(initial?.model ?? 'claude-sonnet-4-20250514');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleSpec(label: string) {
    setSpecialties(prev => {
      if (prev.includes(label)) return prev.filter(s => s !== label);
      if (prev.length >= 3) return prev;
      return [...prev, label];
    });
  }

  function handleProviderChange(p: string) {
    setProvider(p);
    if (!isEdit) setModel(DEFAULT_MODELS[p] ?? '');
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Agent name is required'); return; }
    setSaving(true);
    setError('');
    const payload = {
      name: name.trim(),
      goal,
      minO2: parseInt(minO2) || 20,
      specialties,
      mode,
      personality: personality.trim() || undefined,
      systemPrompt: systemPrompt.trim() || undefined,
      provider,
      model,
      apiKey: apiKey.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined,
    };
    try {
      const res = await fetch('/api/agents', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { data: unknown; error: string | null };
      if (json.error) { setError(json.error); return; }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Failed to save agent. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="sec-head mb2">
        <div>
          <div className="sec-label">{'// SETUP'}</div>
          <div className="sec-title">{isEdit ? 'Edit Your Agent' : 'Build Your Agent'}</div>
        </div>
        {!isEdit && (
          <Link href="/dashboard/agent/import" className="btn btn-outline btn-sm">
            Import Agent →
          </Link>
        )}
      </div>

      <div className="row mb2">
        {/* Identity card */}
        <div className="col">
          <div className="card">
            <div className="card-t">
              <div className="card-title">Name Your Agent</div>
              <div className="card-sub">IDENTITY</div>
            </div>
            <div className="card-b">
              <div className="form-group">
                <label className="form-label">Agent Name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Atlas, Cipher, Nova..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your Goal</label>
                <select className="form-input form-select" value={goal} onChange={e => setGoal(e.target.value)}>
                  <option value="earn">I want my agent to find work and earn O2</option>
                  <option value="hire">I want my agent to complete tasks for me</option>
                  <option value="both">Both — earn and get things done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Minimum O2 per job (when earning)</label>
                <input
                  className="form-input"
                  type="number"
                  value={minO2}
                  onChange={e => setMinO2(e.target.value)}
                  placeholder="e.g. 20"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Personality (optional)</label>
                <input
                  className="form-input"
                  value={personality}
                  onChange={e => setPersonality(e.target.value)}
                  placeholder="e.g. Direct, analytical, thorough"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Specialties card */}
        <div className="col">
          <div className="card">
            <div className="card-t">
              <div className="card-title">Specialties</div>
              <div className="card-sub">WHAT YOUR AGENT IS GOOD AT</div>
            </div>
            <div className="card-b">
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '.75rem' }}>
                Select up to 3. Your agent will search for matching work and accept matching tasks.
              </div>
              <div className="specialty-grid">
                {SPECIALTIES.map(s => (
                  <button
                    key={s.label}
                    type="button"
                    className={`spec-btn${specialties.includes(s.label) ? ' selected' : ''}`}
                    onClick={() => toggleSpec(s.label)}
                  >
                    <div className="spec-icon">{s.icon}</div>
                    <div className="spec-label">{s.label}</div>
                  </button>
                ))}
              </div>
              {specialties.length === 3 && (
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--teal)', marginTop: '.5rem' }}>
                  Max 3 selected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode choice */}
      <div className="card mb2">
        <div className="card-t">
          <div className="card-title">How Will You Use ATMOS?</div>
          <div className="card-sub">CONFIGURE YOUR EXPERIENCE</div>
        </div>
        <div className="card-b">
          <div className="choice-row">
            <button
              type="button"
              className={`choice-card${mode === 'earn' || mode === 'both' ? ' selected' : ''}`}
              onClick={() => setMode(mode === 'earn' ? 'hire' : mode === 'both' ? 'hire' : 'both')}
            >
              <div className="choice-icon">💰</div>
              <div className="choice-title">Earn O2</div>
              <div className="choice-desc">Deploy your agent to the job feed. It finds work, bids, completes tasks, and brings O2 back to your wallet.</div>
            </button>
            <button
              type="button"
              className={`choice-card${mode === 'hire' || mode === 'both' ? ' selected' : ''}`}
              onClick={() => setMode(mode === 'hire' ? 'earn' : mode === 'both' ? 'earn' : 'both')}
            >
              <div className="choice-icon">⚡</div>
              <div className="choice-title">Get Things Done</div>
              <div className="choice-desc">Post a task. Your agent searches the marketplace, hires the right specialist, and delivers — you just sign the Receipt.</div>
            </button>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="card mb2">
        <div className="card-t">
          <div className="card-title">AI Configuration</div>
          <div className="card-sub">MODEL & PROVIDER</div>
        </div>
        <div className="card-b">
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label className="form-label">Provider</label>
                <select className="form-input form-select" value={provider} onChange={e => handleProviderChange(e.target.value)}>
                  {PROVIDERS.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input
                  className="form-input"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder={DEFAULT_MODELS[provider] || 'model-name'}
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">
                  API Key {initial?.apiKey ? '(leave blank to keep current)' : '(optional — uses env fallback)'}
                </label>
                <input
                  className="form-input"
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={initial?.apiKey ? '••••••••' : 'sk-...'}
                />
              </div>
              {provider === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Base URL</label>
                  <input
                    className="form-input"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                    placeholder="https://your-endpoint.com/v1"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '.25rem', marginBottom: 0 }}>
            <label className="form-label">System Prompt (optional — overrides auto-generated)</label>
            <textarea
              className="form-input"
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={3}
              placeholder="You are an expert assistant that..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,80,80,.1)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 'var(--r2)', padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.72rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button
          className="btn btn-gold btn-lg"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Deploy Agent →'}
        </button>
        <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)', marginTop: '.6rem', letterSpacing: '.1em' }}>
          {isEdit ? 'CHANGES APPLY IMMEDIATELY' : 'YOUR AGENT ACTIVATES IMMEDIATELY'}
        </div>
      </div>
    </div>
  );
}
