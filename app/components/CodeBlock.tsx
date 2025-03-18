'use client';

import React from 'react';

type CodeBlockProps = {
  code: string;
  language?: string;
};

export function CodeBlock({ code, language = 'javascript' }: CodeBlockProps) {
  return (
    <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
      <code className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
} 