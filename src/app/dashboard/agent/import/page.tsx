'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ImportMode = 'systemPrompt' | 'json' | 'openai';

const TABS: { id: ImportMode; label: string; icon: string }[] = [
  { id: 'systemPrompt', label: 'System Prompt', icon: '📝' },
  { id: 'json', label: 'JSON Config', icon: '{ }' },
  { id: 'openai', label: 'OpenAI Assistant', icon: '⚡' },
];

const JSON_EXAMPLE = `{
  "name": "Atlas",
  "goal": "earn",
  "specialties": ["Writing", "Research"],
  "provider": "openai",
  "model": "gpt-4o",
  "systemPrompt": "You are an expert research and writing assistant..."
}`;

export default function ImportAgentPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ImportMode>('systemPrompt');
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [json, setJson] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleImport() {
    setSaving(true);
    setError('');
    const payload: Record<string, string> = { mode: tab, name };
    if (tab === 'systemPrompt') payload.systemPrompt = systemPrompt;
    if (tab === 'json') payload.json = json;
    if (tab === 'openai') { payload.assistantId = assistantId; payload.apiKey = openaiKey; }

    try {
      const res = await fetch('/api/agents/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { data: unknown; error: string | null };
      if (data.error) { setError(data.error); return; }
      router.push('/dashboard/agent');
      router.refresh();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="sec-head mb2">
        <div>
          <div className="sec-label">{'// IMPORT'}</div>
          <div className="sec-title">Import Agent</div>
        </div>
        <Link href="/dashboard/agent" className="btn btn-outline btn-sm">← Back to Builder</Link>
      </div>

      <div className="card mb2">
        <div className="card-t">
          <div className="card-title">Import Method</div>
          <div className="card-sub">BRING YOUR EXISTING AGENT CONFIGURATION</div>
        </div>
        <div className="card-b">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  padding: '.4rem .9rem',
                  border: `1px solid ${tab === t.id ? 'var(--gold)' : 'var(--b1)'}`,
                  borderRadius: '20px',
                  fontFamily: 'var(--fm)',
                  fontSize: '.56rem',
                  letterSpacing: '.1em',
                  color: tab === t.id ? 'var(--gold)' : 'var(--muted)',
                  background: tab === t.id ? 'var(--g10)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Agent name (all modes) */}
          <div className="form-group">
            <label className="form-label">Agent Name {tab === 'openai' ? '(auto-filled from assistant)' : '(optional)'}</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={tab === 'openai' ? 'Auto-filled from OpenAI' : 'e.g. Atlas, Cipher...'}
            />
          </div>

          {/* System Prompt tab */}
          {tab === 'systemPrompt' && (
            <div className="form-group">
              <label className="form-label">System Prompt</label>
              <textarea
                className="form-input"
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={8}
                placeholder="Paste your agent's system prompt here. This will be used exactly as provided when running jobs."
              />
            </div>
          )}

          {/* JSON tab */}
          {tab === 'json' && (
            <div className="form-group">
              <label className="form-label">JSON Configuration</label>
              <textarea
                className="form-input"
                value={json}
                onChange={e => setJson(e.target.value)}
                rows={8}
                placeholder={JSON_EXAMPLE}
                style={{ fontFamily: 'var(--fm)', fontSize: '.65rem' }}
              />
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)', marginTop: '.4rem' }}>
                Supported keys: name, goal, specialties, provider, model, systemPrompt, personality, baseUrl
              </div>
            </div>
          )}

          {/* OpenAI tab */}
          {tab === 'openai' && (
            <>
              <div className="form-group">
                <label className="form-label">OpenAI Assistant ID</label>
                <input
                  className="form-input"
                  value={assistantId}
                  onChange={e => setAssistantId(e.target.value)}
                  placeholder="asst_abc123..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">OpenAI API Key</label>
                <input
                  className="form-input"
                  type="password"
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)', marginTop: '.4rem' }}>
                  Used only to fetch the assistant config. Stored encrypted.
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--b2)', borderRadius: 'var(--r2)', padding: '.75rem', fontSize: '.72rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                We will fetch your assistant&apos;s instructions and model configuration from OpenAI, then deploy it on ATMOS. Your API key is encrypted and never logged.
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,80,80,.1)', border: '1px solid rgba(255,80,80,.2)', borderRadius: 'var(--r2)', padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.72rem', color: '#ff6b6b' }}>
          {error}
        </div>
      )}

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-gold btn-lg" onClick={handleImport} disabled={saving}>
          {saving ? 'Importing...' : 'Import & Deploy Agent →'}
        </button>
        <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)', marginTop: '.6rem', letterSpacing: '.1em' }}>
          THIS WILL CREATE OR OVERWRITE YOUR CURRENT AGENT
        </div>
      </div>
    </div>
  );
}
