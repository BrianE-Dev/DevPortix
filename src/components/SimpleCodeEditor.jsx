import React, { useEffect, useState } from 'react';

const LANGUAGE_TEMPLATES = {
  javascript: `// Write your JavaScript code here
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('DevPort'));`,
  python: `# Write your Python code here
def greet(name):
    return f"Hello, {name}!"

print(greet("DevPort"))`,
  html: `<!-- Write your HTML here -->
<section>
  <h1>My Project</h1>
  <p>Start building your idea.</p>
</section>`,
};

const SimpleCodeEditor = ({ storageKey, title = 'Code Editor' }) => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.javascript);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedCode = localStorage.getItem(`${storageKey}:${language}`);
    setCode(savedCode || LANGUAGE_TEMPLATES[language]);
  }, [language, storageKey]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(`${storageKey}:${language}`, code);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [code, language, storageKey]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_error) {
      setCopied(false);
    }
  };

  const handleClear = () => {
    setCode('');
  };

  const handleResetTemplate = () => {
    setCode(LANGUAGE_TEMPLATES[language]);
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="font-semibold text-lg text-white">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            className="px-3 py-2 border border-white/10 rounded-md text-sm text-gray-200 bg-gray-900/60"
            aria-label="Select code language"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
          </select>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="px-3 py-2 text-sm border border-white/10 rounded-md text-gray-300 hover:bg-white/10"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 text-sm border border-white/10 rounded-md text-gray-300 hover:bg-white/10"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        className="w-full min-h-[260px] p-4 rounded-lg border border-white/10 bg-gray-950 text-gray-100 font-mono text-sm leading-6 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Write your code here..."
      />

      <p className="text-xs text-gray-400 mt-3">
        Draft is saved automatically for this dashboard.
      </p>
    </div>
  );
};

export default SimpleCodeEditor;
