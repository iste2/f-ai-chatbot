import Link from 'next/link';
import React, { memo, Children, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';
import { Button } from './ui/button';

// ExpandableTable is a React component for expandable markdown tables
function ExpandableTable({ children, ...props }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  // Split children into thead and tbody
  let thead = null;
  let tbody = null;
  Children.forEach(children, (child) => {
    if (child && (child as any).type && (child as any).type === 'thead') thead = child;
    if (child && (child as any).type && (child as any).type === 'tbody') tbody = child;
  });
  // Count columns for colSpan
  let colCount = 1;
  if (thead && (thead as any).props.children && Array.isArray((thead as any).props.children)) {
    const firstRow = (thead as any).props.children[0];
    if (firstRow && firstRow.props && firstRow.props.children) {
      colCount = Children.count(firstRow.props.children);
    }
  }
  return (
    <div className="overflow-x-auto my-6">
      <table
        className="min-w-full border-collapse rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm border border-border [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-left [&_th]:px-4 [&_th]:py-2 [&_th]:border-b [&_th]:border-border [&_td]:px-4 [&_td]:py-2 [&_td]:border-b [&_td]:border-border [&_tr:last-child_th]:border-b-0 [&_tr:last-child_td]:border-b-0 [&_tbody_tr:hover]:bg-muted/60 transition-colors"
        {...props}
      >
        {thead}
        {expanded && tbody}
      </table>
      <div className="flex items-center gap-2 mt-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
    </div>
  );
}

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ol: ({ node, children, ...props }: any) => (
    <ol className="list-decimal list-outside ml-4" {...props}>{children}</ol>
  ),
  li: ({ node, children, ...props }: any) => (
    <li className="py-1" {...props}>{children}</li>
  ),
  ul: ({ node, children, ...props }: any) => (
    <ul className="list-decimal list-outside ml-4" {...props}>{children}</ul>
  ),
  strong: ({ node, children, ...props }: any) => (
    <span className="font-semibold" {...props}>{children}</span>
  ),
  a: ({ node, children, ...props }: any) => (
    // @ts-expect-error
    <Link className="text-blue-500 hover:underline" target="_blank" rel="noreferrer" {...props}>{children}</Link>
  ),
  h1: ({ node, children, ...props }: any) => (
    <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>{children}</h1>
  ),
  h2: ({ node, children, ...props }: any) => (
    <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>{children}</h2>
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>{children}</h3>
  ),
  h4: ({ node, children, ...props }: any) => (
    <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>{children}</h4>
  ),
  h5: ({ node, children, ...props }: any) => (
    <h5 className="text-base font-semibold mt-6 mb-2" {...props}>{children}</h5>
  ),
  h6: ({ node, children, ...props }: any) => (
    <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>{children}</h6>
  ),
  table: ExpandableTable,
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
