import React, { useState } from 'react';
import { Button } from './ui/button';

interface SqlViewerProps {
  initialQuery?: string;
  valid?: boolean;
  result?: any;
}

export const SqlViewer: React.FC<SqlViewerProps> = ({ initialQuery = '', valid = true, result = null }) => {
  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch('/api/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');
      setData(json.result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    !valid ? (
      <details className="mb-4 border rounded bg-muted">
        <summary className="font-normal text-center p-2 min-h-0 flex cursor-pointer select-none">⚠️ SQL: Invalid query or insufficient permissions.</summary>
        <div className="p-4">
          {result && (
            <>
              <div className="mb-2 text-xs text-muted-foreground"><span className="font-semibold">Query:</span><br /><span className="font-mono break-all whitespace-pre-wrap">{initialQuery}</span></div>
              <div className="text-red-600 whitespace-pre-wrap break-all">{String(result)}</div>
            </>
          )}
        </div>
      </details>
    ) : (
      <details className="mb-4 border rounded bg-muted">
        <summary className="font-normal text-center p-2 min-h-0 flex cursor-pointer select-none">🗃️ SQL query</summary>
        <div className="p-4">
          <div className="mb-4">
            <textarea
              className="w-full border rounded p-2 font-mono text-sm mt-6"
              rows={3}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
            />
            <Button
              className="mt-2"
              onClick={handleRun}
              disabled={loading || !query.trim()}
            >
              {loading ? 'Running...' : 'Run Query'}
            </Button>
          </div>
          <div className="overflow-x-auto max-h-96 border rounded bg-muted p-2">
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {data && Array.isArray(data) && data.length > 0 ? (
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map((col) => (
                      <th key={col} className="px-2 py-1 text-left border-b bg-card font-bold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const rowKey = Object.values(row).join('-');
                    return (
                      <tr key={rowKey}>
                        {Object.values(row).map((val, j) => {
                          const cellKey = `${Object.values(row).join('-')}-${j}`;
                          return (
                            <td key={cellKey} className="px-2 py-1 border-b">{String(val)}</td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : data && Array.isArray(data) && data.length === 0 ? (
              <div className="text-muted-foreground">No results.</div>
            ) : null}
          </div>
        </div>
      </details>
    )
  );
};

export default SqlViewer;