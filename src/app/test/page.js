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
      setResult({ ok: false, data: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h1>Test Vapi Appointment Call</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
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

        <button type="submit" disabled={loading}>
          {loading ? 'Calling…' : 'Start Call'}
        </button>
      </form>

      {result && (
        <pre style={{ marginTop: 20, background: '#f5f5f5', padding: 10 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
