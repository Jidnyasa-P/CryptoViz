import React from 'react';

interface MathBlockProps {
  formula: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({ formula }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-inner my-4 flex items-center justify-center overflow-x-auto transition-colors">
      <code className="text-teal-700 dark:text-teal-400 font-mono text-lg break-words whitespace-pre-wrap text-center">
        {formula}
      </code>
    </div>
  );
};
