'use client';

import { useState } from 'react';

export default function TestCallPage() {
  const [form, setForm] = useState({
    businessNumber: '',
    serviceDesc: '',
    timeWindow: '',
    name: '',
    email: '',
    callbackNumber: '',
    outgoingNumberId: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setResult({ ok: res.ok, data });
    } catch (err) {
      setResult({ ok: false, data: { error: err.message } });
    } finally {
      setLoading(false);
    }
  };

  const { ok, data } = result || {};

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 20 }}>📞 Schedule a Vapi Call</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginBottom: 30 }}>
        <input
          name="businessNumber"
          placeholder="Business number (+1…)"
          value={form.businessNumber}
          onChange={handleChange}
          required
        />
        <input
          name="serviceDesc"
          placeholder="What to book (e.g. men’s haircut)"
          value={form.serviceDesc}
          onChange={handleChange}
          required
        />
        <input
          name="timeWindow"
          placeholder="Time window (e.g. next Tuesday afternoon)"
          value={form.timeWindow}
          onChange={handleChange}
          required
        />
        <input
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          name="callbackNumber"
          placeholder="Your callback number (+1…)"
          value={form.callbackNumber}
          onChange={handleChange}
        />
        <input
          name="outgoingNumberId"
          placeholder="Outgoing phoneNumberId (optional)"
          value={form.outgoingNumberId}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '☎ Calling…' : '📞 Start Call'}
        </button>
      </form>

      {result && (
        <div style={{
          border: ok ? '2px solid #4caf50' : '2px solid #f44336',
          borderRadius: 8,
          padding: 20,
          background: '#fafafa'
        }}>
          <h2 style={{ marginTop: 0 }}>
            {ok ? '✅ Call Scheduled' : '❌ Error'}
          </h2>


            {ok && (
            <>
                <p><strong>Call ID:</strong> {data.callId}</p>
                {data.summary && (
                <div style={{ /* summary styling */ }}>
                    <h3>📋 Summary</h3>
                    <p>{data.summary}</p>
                </div>
                )}
                {data.transcript && (
                <div style={{ marginTop: 16 }}>
                    <h3>🗣 Transcript</h3>

                    {Array.isArray(data.transcript) ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {data.transcript.map((turn, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                            <strong>{turn.speaker}:</strong> {turn.text}
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <pre style={{
                        background: '#fff',
                        padding: 12,
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        overflowX: 'auto'
                    }}>
                        {typeof data.transcript === 'string'
                        ? data.transcript
                        : JSON.stringify(data.transcript, null, 2)}
                    </pre>
                    )}
                </div>
                )}
            </>
            )}



          {!ok && (
            <p style={{ color: '#b00020' }}>
              {data.error || 'An unknown error occurred.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
