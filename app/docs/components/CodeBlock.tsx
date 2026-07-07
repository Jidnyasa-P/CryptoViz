"use client";

import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-inner my-4 overflow-hidden group transition-colors">
      {language && (
        <div className="bg-zinc-100 dark:bg-zinc-900/50 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center transition-colors">
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">{language}</span>
          <button 
            onClick={handleCopy}
            className="text-[10px] bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/50 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 transition-all font-mono opacity-0 group-hover:opacity-100"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <div className="p-4 overflow-x-auto relative">
        {!language && (
          <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 text-[10px] bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/50 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 transition-all font-mono opacity-0 group-hover:opacity-100"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
        <code className="text-teal-700 dark:text-teal-400/90 font-mono text-xs whitespace-pre">
          {code}
        </code>
      </div>
    </div>
  );
};
