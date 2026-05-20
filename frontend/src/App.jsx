import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';

// ─── Severity / Status Badge ───────────────────────────────────────────────
function Badge({ level }) {
  const colors = {
    HIGH: '#dc3545', MEDIUM: '#fd7e14', LOW: '#ffc107',
    PASS: '#28a745', FAIL: '#dc3545', WARNING: '#fd7e14', ERROR: '#6c757d',
    COMPLETED: '#28a745', QUEUED: '#1f6feb', PROCESSING: '#fd7e14', FAILED: '#dc3545'
  };
  return (
    <span style={{
      background: colors[level] || '#6c757d',
      color: ['LOW', 'WARNING', 'QUEUED'].includes(level) ? '#000' : '#fff',
      padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600
    }}>{level}</span>
  );
}

// ─── SAST Submission Tab ───────────────────────────────────────────────────
function SastTab({ onSubmitted }) {
  const [code, setCode] = useState(
`// Paste your JavaScript code here to scan for vulnerabilities
const password = "admin123";
const apiKey = "sk-live-abcdefghijklmnopqrstuvwx12";
const query = "SELECT * FROM users WHERE id = " + userId;
eval(userInput);`
  );
  const [filename, setFilename] = useState('untitled.js');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sast', code, filename })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onSubmitted(data.scanId);
    } catch (e) {
      setError(e.message); setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>SAST — Static Code Analysis</h2>
      <p className="subtitle">Paste JavaScript code to scan for security vulnerabilities</p>
      <div className="form-group">
        <label>Filename (optional)</label>
        <input type="text" value={filename} onChange={e => setFilename(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Code</label>
        <textarea rows={12} value={code} onChange={e => setCode(e.target.value)}
          placeholder="Paste your JavaScript code here..." />
      </div>
      <button onClick={handleScan} disabled={submitting || !code.trim()}>
        {submitting ? 'Submitting...' : 'Run SAST Scan'}
      </button>
      {error && <div className="status-box error">Error: {error}</div>}
    </div>
  );
}

// ─── Pentest Submission Tab ────────────────────────────────────────────────
function PentestTab({ onSubmitted }) {
  const [targetUrl, setTargetUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pentest', targetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onSubmitted(data.scanId);
    } catch (e) {
      setError(e.message); setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Pentest — API Penetration Testing</h2>
      <p className="subtitle">Enter a target API URL to test for security vulnerabilities</p>
      <div className="form-group">
        <label>Target URL</label>
        <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
          placeholder="http://example.com/api/users" />
      </div>
      <button onClick={handleScan} disabled={submitting || !targetUrl.trim()}>
        {submitting ? 'Submitting...' : 'Run Pentest Scan'}
      </button>
      {error && <div className="status-box error">Error: {error}</div>}
    </div>
  );
}

// ─── SAST Report Detail ────────────────────────────────────────────────────
function SastReport({ report }) {
  return (
    <div className="report-detail">
      <div className="summary-bar">
        <span className="s-total">Total: {report.summary.totalVulnerabilities}</span>
        <span className="s-high">HIGH: {report.summary.high}</span>
        <span className="s-med">MEDIUM: {report.summary.medium}</span>
        <span className="s-low">LOW: {report.summary.low}</span>
      </div>
      {report.vulnerabilities.length === 0
        ? <p className="pass-msg">No vulnerabilities detected.</p>
        : <table className="results-table">
            <thead><tr><th>Severity</th><th>Type</th><th>Line</th><th>Description</th><th>Evidence</th></tr></thead>
            <tbody>
              {report.vulnerabilities.map((v, i) => (
                <tr key={i}>
                  <td><Badge level={v.severity} /></td>
                  <td>{v.name}</td>
                  <td>{v.line}</td>
                  <td>{v.description}</td>
                  <td><code>{v.evidence}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  );
}

// ─── Pentest Report Detail ─────────────────────────────────────────────────
function PentestReport({ report }) {
  return (
    <div className="report-detail">
      <div className="summary-bar">
        <span className="s-total">Tests: {report.summary.totalTests}</span>
        <span className="s-pass">PASS: {report.summary.passed}</span>
        <span className="s-high">FAIL: {report.summary.failed}</span>
        <span className="s-med">WARN: {report.summary.warnings}</span>
        <span className="s-low">ERROR: {report.summary.errors}</span>
      </div>
      <table className="results-table">
        <thead><tr><th>Status</th><th>Severity</th><th>Test</th><th>Details</th></tr></thead>
        <tbody>
          {report.results.map((r, i) => (
            <tr key={i}>
              <td><Badge level={r.status} /></td>
              <td><Badge level={r.severity} /></td>
              <td>{r.name}</td>
              <td>
                {r.details}
                {r.findings && r.findings.length > 0 && (
                  <ul className="findings-list">
                    {r.findings.map((f, j) => (
                      <li key={j}>{f.issue}{f.payload ? ` — payload: ${f.payload}` : ''}</li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Expandable Scan Row ───────────────────────────────────────────────────
function ScanRow({ scan, isHighlighted }) {
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState(null);

  const handleToggle = async () => {
    if (expanded) { setExpanded(false); return; }

    if (scan.status !== 'COMPLETED') { setExpanded(true); return; }

    if (report) { setExpanded(true); return; }

    // Fetch report from API (proxied from S3)
    setLoadingReport(true);
    setReportError(null);
    try {
      const res = await fetch(`${API_BASE}/scans/${scan.id}/report`);
      if (!res.ok) throw new Error('Failed to load report');
      const data = await res.json();
      setReport(data);
      setExpanded(true);
    } catch (e) {
      setReportError(e.message);
      setExpanded(true);
    }
    setLoadingReport(false);
  };

  const statusBadge = scan.status === 'COMPLETED' ? 'COMPLETED'
    : scan.status === 'FAILED' ? 'FAILED'
    : scan.status === 'PROCESSING' ? 'PROCESSING'
    : 'QUEUED';

  const summaryText = scan.summary
    ? scan.type === 'sast'
      ? `${scan.summary.totalVulnerabilities} vulns (H:${scan.summary.high} M:${scan.summary.medium} L:${scan.summary.low})`
      : `${scan.summary.totalTests} tests (P:${scan.summary.passed} F:${scan.summary.failed} W:${scan.summary.warnings})`
    : scan.status;

  return (
    <>
      <tr
        className={`scan-row clickable ${isHighlighted ? 'highlighted' : ''}`}
        onClick={handleToggle}
      >
        <td>
          <span className="expand-icon">{expanded ? '▾' : '▸'}</span>
          <code title={scan.id}>{scan.id.slice(0, 8)}...</code>
        </td>
        <td><span className={`type-badge ${scan.type}`}>{scan.type.toUpperCase()}</span></td>
        <td><Badge level={statusBadge} /></td>
        <td className="target-cell">{scan.targetUrl || scan.filename || '—'}</td>
        <td>{summaryText}</td>
        <td>{new Date(scan.createdAt).toLocaleString()}</td>
      </tr>
      {expanded && (
        <tr className="report-row">
          <td colSpan={6}>
            {scan.status === 'QUEUED' && (
              <div className="status-box info">Scan is queued. Refresh to check for updates.</div>
            )}
            {scan.status === 'PROCESSING' && (
              <div className="status-box info">Scan is running. Refresh to check for updates.</div>
            )}
            {scan.status === 'FAILED' && (
              <div className="status-box error">Scan failed: {scan.scanError || 'Unknown error'}</div>
            )}
            {loadingReport && <div className="status-box info">Loading full report from S3...</div>}
            {reportError && <div className="status-box error">Error loading report: {reportError}</div>}
            {scan.status === 'COMPLETED' && report && scan.type === 'sast' && <SastReport report={report} />}
            {scan.status === 'COMPLETED' && report && scan.type === 'pentest' && <PentestReport report={report} />}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Scan Results Tab (main hub) ───────────────────────────────────────────
function ResultsTab({ highlightId, clearHighlight }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scans`);
      const data = await res.json();
      setScans(data.scans || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  // Initial fetch + auto-refresh every 5s if any scans are pending
  useEffect(() => {
    fetchScans();
    intervalRef.current = setInterval(fetchScans, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchScans]);

  // Clear highlight after 5s
  useEffect(() => {
    if (highlightId) {
      const timeout = setTimeout(clearHighlight, 5000);
      return () => clearTimeout(timeout);
    }
  }, [highlightId, clearHighlight]);

  const hasPending = scans.some(s => s.status === 'QUEUED' || s.status === 'PROCESSING');

  return (
    <div>
      <h2>Scan Results</h2>
      <p className="subtitle">
        All scan results from DynamoDB — click a row to view the full report from S3
        {hasPending && <span className="auto-refresh-badge"> Auto-refreshing...</span>}
      </p>
      <button onClick={() => { setLoading(true); fetchScans(); }} style={{ marginBottom: '1rem' }}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      {scans.length === 0 && !loading && <p>No scans yet. Submit a SAST or Pentest scan first.</p>}
      {scans.length > 0 && (
        <table className="results-table">
          <thead>
            <tr><th>ID</th><th>Type</th><th>Status</th><th>Target</th><th>Summary</th><th>Created</th></tr>
          </thead>
          <tbody>
            {scans.map(s => (
              <ScanRow key={s.id} scan={s} isHighlighted={s.id === highlightId} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('sast');
  const [highlightId, setHighlightId] = useState(null);

  const handleSubmitted = (scanId) => {
    setHighlightId(scanId);
    setTab('results');
  };

  return (
    <div className="app">
      <header>
        <h1>QuickScan Hub</h1>
        <p>Unified Code &amp; API Security Scanner</p>
      </header>
      <nav>
        <button className={tab === 'sast' ? 'active' : ''} onClick={() => setTab('sast')}>SAST Scanner</button>
        <button className={tab === 'pentest' ? 'active' : ''} onClick={() => setTab('pentest')}>Pentest Scanner</button>
        <button className={tab === 'results' ? 'active' : ''} onClick={() => setTab('results')}>Scan Results</button>
      </nav>
      <main>
        {tab === 'sast' && <SastTab onSubmitted={handleSubmitted} />}
        {tab === 'pentest' && <PentestTab onSubmitted={handleSubmitted} />}
        {tab === 'results' && <ResultsTab highlightId={highlightId} clearHighlight={() => setHighlightId(null)} />}
      </main>
      <footer>QuickScan Hub — CS6620 Cloud Computing Project</footer>
    </div>
  );
}
