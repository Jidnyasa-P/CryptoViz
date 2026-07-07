"use client";

import React, { useState } from 'react';
import { docCategories, DocCategory, CipherDocCategory } from './data';
import { DocumentationSection } from './components/DocumentationSection';
import { MathBlock } from './components/MathBlock';
import { CodeBlock } from './components/CodeBlock';
import { ExampleCard } from './components/ExampleCard';
import { PlaygroundCard } from './components/PlaygroundCard';
import { ReferenceList } from './components/ReferenceList';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<DocCategory>(docCategories[0]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generalDocs = docCategories.filter(c => c.type === 'general');
  const cipherDocs = docCategories.filter(c => c.type === 'cipher');

  const handleCopy = (text: string, index: number) => {
    const cleanText = text.replace(/^\d+\.\s*/, '');
    navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderGeneralContent = () => {
    if (activeSection.type === 'cipher') return null;
    
    return (
      <div className="text-zinc-600 dark:text-zinc-300 space-y-4 text-sm font-sans leading-relaxed">
        {activeSection.content.split('\n').map((paragraph, idx) => {
          
          if (paragraph.startsWith('•')) {
            return (
              <div key={idx} className="flex items-center gap-3 pl-2 py-1 text-zinc-600 dark:text-zinc-300 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                <span>{paragraph.replace('• ', '')}</span>
              </div>
            );
          }

          if (paragraph.includes('git clone') || paragraph.includes('npm install') || paragraph.includes('npm run')) {
            return (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-900/40 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-teal-600 dark:text-teal-400 flex justify-between items-center group shadow-sm dark:shadow-inner my-4 transition-colors">
                <code className="break-all">{paragraph}</code>
                <button 
                  onClick={() => handleCopy(paragraph, idx)}
                  className="text-xs bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500/50 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 transition-all font-mono"
                >
                  {copiedIndex === idx ? 'Copied!' : 'Copy'}
                </button>
              </div>
            );
          }

          return <p key={idx} className="whitespace-pre-line">{paragraph}</p>;
        })}
      </div>
    );
  };

  const renderCipherContent = () => {
    if (activeSection.type !== 'cipher') return null;
    const cipher = activeSection as CipherDocCategory;
    
    return (
      <div className="text-zinc-600 dark:text-zinc-300 space-y-8 text-sm font-sans leading-relaxed">
        <DocumentationSection title="Overview">
          <p><strong>History:</strong> {cipher.overview.history}</p>
          <p>{cipher.overview.description}</p>
        </DocumentationSection>

        <DocumentationSection title="Mathematics">
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">Encryption Formula:</p>
          <MathBlock formula={cipher.mathematics.encryptionFormula} />
          <p className="text-zinc-500 dark:text-zinc-400 mt-6 mb-2">Decryption Formula:</p>
          <MathBlock formula={cipher.mathematics.decryptionFormula} />
          <ul className="list-disc list-inside space-y-2 mt-4 text-zinc-500 dark:text-zinc-400">
            {cipher.mathematics.explanation.map((exp, idx) => (
              <li key={idx}>{exp}</li>
            ))}
          </ul>
        </DocumentationSection>

        <DocumentationSection title="Worked Example">
          <ExampleCard 
            plaintext={cipher.workedExample.plaintext}
            parameters={cipher.workedExample.parameters}
            steps={cipher.workedExample.steps}
            finalCiphertext={cipher.workedExample.finalCiphertext}
          />
        </DocumentationSection>

        <DocumentationSection title="Complexity & Security">
          <p><strong>Complexity:</strong> {cipher.complexity}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/50 rounded-lg p-4 transition-colors">
              <h4 className="text-teal-600 dark:text-teal-500 font-mono text-xs font-bold uppercase tracking-widest mb-3">Advantages</h4>
              <ul className="space-y-2">
                {cipher.securityAnalysis.advantages.map((adv, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-teal-500">✓</span>
                    <span className="text-zinc-600 dark:text-zinc-400 text-xs">{adv}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 transition-colors">
              <h4 className="text-red-600 dark:text-red-500 font-mono text-xs font-bold uppercase tracking-widest mb-3">Weaknesses</h4>
              <ul className="space-y-2">
                {cipher.securityAnalysis.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-red-500">✗</span>
                    <span className="text-zinc-600 dark:text-zinc-400 text-xs">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DocumentationSection>
        
        <DocumentationSection title="Real-world Applications">
          <ul className="list-disc list-inside space-y-2 text-zinc-500 dark:text-zinc-400">
            {cipher.realWorldApplications.map((app, idx) => (
              <li key={idx}>{app}</li>
            ))}
          </ul>
        </DocumentationSection>

        <DocumentationSection title="Implementation Snippets">
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">Python:</p>
          <CodeBlock code={cipher.codeSnippets.python} language="python" />
          
          <p className="text-zinc-500 dark:text-zinc-400 mt-6 mb-2">JavaScript:</p>
          <CodeBlock code={cipher.codeSnippets.javascript} language="javascript" />
        </DocumentationSection>

        <DocumentationSection title="Interactive Playground">
          <PlaygroundCard link={cipher.playgroundLink} />
        </DocumentationSection>

        <DocumentationSection title="References">
          <ReferenceList references={cipher.references} />
        </DocumentationSection>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-teal-200 dark:selection:bg-teal-500 selection:text-zinc-900 flex flex-col transition-colors duration-300">
      
      <div className="w-full h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 px-6 flex items-center justify-between sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-bold tracking-widest uppercase">
            CryptoViz // Docs
          </span>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
            v1.0.0
          </span>
        </div>
        <div className="text-xs text-zinc-400 dark:text-zinc-500 font-mono hidden md:block">
          Press <kbd className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400">Ctrl</kbd> + <kbd className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400">K</kbd> to search
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1600px] mx-auto flex flex-col md:flex-row">
        
        <aside className="w-full md:w-64 bg-zinc-50 dark:bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-850 p-6 md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] overflow-y-auto shrink-0 flex flex-col gap-8 transition-colors">
          <div>
            <h3 className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 px-2">
              Overview
            </h3>
            <nav className="space-y-1">
              {generalDocs.map((category) => {
                const isSelected = activeSection.title === category.title;
                return (
                  <button
                    key={category.title}
                    onClick={() => setActiveSection(category)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-all relative ${
                      isSelected
                        ? 'bg-zinc-200/50 dark:bg-zinc-900/80 text-teal-600 dark:text-teal-400 font-semibold border-l-2 border-teal-500 pl-4'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    {category.title}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <h3 className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 px-2">
              Ciphers
            </h3>
            <nav className="space-y-1">
              {cipherDocs.map((category) => {
                const isSelected = activeSection.title === category.title;
                return (
                  <button
                    key={category.title}
                    onClick={() => setActiveSection(category)}
                    className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-all relative ${
                      isSelected
                        ? 'bg-zinc-200/50 dark:bg-zinc-900/80 text-teal-600 dark:text-teal-400 font-semibold border-l-2 border-teal-500 pl-4'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    {category.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10 max-w-3xl overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-500 mb-6">
            <span>Docs</span>
            <span>/</span>
            <span>Architecture</span>
            <span>/</span>
            <span className="text-teal-600 dark:text-teal-400">{activeSection.title}</span>
          </div>

          <h1 className="text-3xl font-mono font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
            {activeSection.title}
          </h1>
          <p className="text-sm font-sans text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-6 leading-relaxed">
            {activeSection.description}
          </p>

          {activeSection.type === 'cipher' ? renderCipherContent() : renderGeneralContent()}

          <div className="mt-10 p-4 bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded flex gap-3 items-start transition-colors">
            <span className="text-teal-600 dark:text-teal-400 font-mono text-xs font-bold mt-0.5">[!]</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
              Ensure you review corresponding module logic criteria contained inside your local project workspace repository within the <code className="text-zinc-800 dark:text-zinc-300 font-mono bg-white dark:bg-zinc-950 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">tests/unit/</code> directory.
            </p>
          </div>
        </main>

        <aside className="hidden xl:block w-56 p-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <h4 className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
            On This Page
          </h4>
          <ul className="space-y-2.5 text-xs font-mono text-zinc-500 dark:text-zinc-500">
            <li className={`cursor-pointer transition-colors ${activeSection.type === 'general' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'hover:text-zinc-900 dark:hover:text-zinc-300'}`}>Overview</li>
            <li className={`cursor-pointer transition-colors ${activeSection.type === 'cipher' ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'hover:text-zinc-900 dark:hover:text-zinc-300'}`}>Ciphers</li>
          </ul>
        </aside>

      </div>
    </div>
  );
}