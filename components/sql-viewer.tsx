import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';

interface SqlViewerProps {
  initialQuery?: string;
}

export const SqlViewer: React.FC<SqlViewerProps> = ({ initialQuery = '' }) => {
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
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>SQL Viewer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <textarea
            className="w-full border rounded p-2 font-mono text-sm"
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
                {data.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-2 py-1 border-b">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : data && Array.isArray(data) && data.length === 0 ? (
            <div className="text-muted-foreground">No results.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default SqlViewer;