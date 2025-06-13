import React from "react";

interface ToolViewerProps {
  toolName: string;
  result: any;
}

const ToolViewer: React.FC<ToolViewerProps> = ({ toolName, result }) => {
  if (!result) return null;
  return (
    <details className="mb-4 border rounded bg-muted">
      <summary className="font-normal text-center p-2 min-h-0 flex cursor-pointer select-none">
        🛠️ Calling tool: {toolName}
      </summary>
      <div className="p-4">
        <pre className="whitespace-pre-wrap break-all text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </details>
  );
};

export default ToolViewer;
