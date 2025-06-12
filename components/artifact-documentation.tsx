import React from "react";
import { Markdown } from "./markdown";

interface ArtifactDocumentationProps {
  documentation: string;
}

export const ArtifactDocumentation: React.FC<ArtifactDocumentationProps> = ({ documentation }) => {
  if (!documentation) return null;
  const firstLine = documentation.split("\n")[0];
  return (
    <details className="mb-4 border rounded bg-muted">
      <summary className="font-normal text-center p-2 min-h-0 flex cursor-pointer select-none">
        📄 {firstLine}
      </summary>
      <div className="p-4">
        <Markdown className="prose dark:prose-invert max-w-none whitespace-pre-line text-sm text-gray-800 dark:text-gray-200 mt-2">
          {documentation}
        </Markdown>
      </div>
    </details>
  );
};

export default ArtifactDocumentation;
