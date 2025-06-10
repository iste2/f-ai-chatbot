import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";

interface ArtifactDocumentationProps {
  documentation: string;
}

export const ArtifactDocumentation: React.FC<ArtifactDocumentationProps> = ({ documentation }) => {
  const [expanded, setExpanded] = useState(false);
  if (!documentation) return null;
  const PREVIEW_LENGTH = 150;
  const isLong = documentation.length > PREVIEW_LENGTH;
  const preview = isLong ? documentation.slice(0, PREVIEW_LENGTH) + "..." : documentation;

  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle>Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">
          {expanded || !isLong ? documentation : preview}
        </div>
      </CardContent>
      {isLong && (
        <CardFooter className="justify-start">
          <Button
            variant="default"
            size="sm"
            className=""
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ArtifactDocumentation;
