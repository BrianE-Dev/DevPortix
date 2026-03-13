import React, { useEffect, useMemo, useRef, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const DEFAULT_REACT_SNIPPET = `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h2>React Playground</h2>
      <p>Edit this code and click Run Preview.</p>
      <button onClick={() => setCount((value) => value + 1)}>
        Clicked {count} times
      </button>
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;

const buildPreviewDocument = (code) => `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        background: #0f172a;
        color: #e2e8f0;
      }
      #root {
        min-height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="text/babel">
${code}
    </script>
  </body>
</html>`;

const ReactPlayground = ({ storageKey, title = 'React Code Editor' }) => {
  const [code, setCode] = useState(DEFAULT_REACT_SNIPPET);
  const [previewDoc, setPreviewDoc] = useState(buildPreviewDocument(DEFAULT_REACT_SNIPPET));
  const [copied, setCopied] = useState(false);
  const highlightLayerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(saved);
      setPreviewDoc(buildPreviewDocument(saved));
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, code);
  }, [code, storageKey]);

  const lineCount = useMemo(() => code.split('\n').length, [code]);

  const handleRunPreview = () => {
    setPreviewDoc(buildPreviewDocument(code));
  };

  const handleReset = () => {
    const resetCode = DEFAULT_REACT_SNIPPET;
    setCode(resetCode);
    setPreviewDoc(buildPreviewDocument(resetCode));
    localStorage.setItem(storageKey, resetCode);
    setCopied(false);

    if (editorRef.current) {
      editorRef.current.scrollTop = 0;
      editorRef.current.scrollLeft = 0;
    }
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = 0;
      highlightLayerRef.current.scrollLeft = 0;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch {
      setCopied(false);
    }
  };

  const handleEditorScroll = (event) => {
    if (!highlightLayerRef.current) return;
    highlightLayerRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightLayerRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="react-playground-preserve bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">Write React code and preview the output.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRunPreview}
            className="px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Run Preview
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 text-sm font-medium border border-white/10 text-gray-200 rounded-md hover:bg-white/10"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium border border-white/10 text-gray-200 rounded-md hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs uppercase tracking-wide text-gray-400">Editor</p>
            <p className="text-xs text-gray-500">{lineCount} lines</p>
          </div>
          <div className="relative h-[320px] rounded-lg border border-[#3b4048] bg-[#282c34] overflow-hidden">
            <div
              ref={highlightLayerRef}
              aria-hidden="true"
              className="absolute inset-0 overflow-x-auto overflow-y-auto pointer-events-none"
            >
              <SyntaxHighlighter
                language="javascript"
                style={atomOneDark}
                showLineNumbers
                lineNumberStyle={{
                  minWidth: '2.5rem',
                  marginRight: '1rem',
                  color: '#5c6370',
                  userSelect: 'none',
                }}
                wrapLongLines={false}
                customStyle={{
                  margin: 0,
                  minHeight: '100%',
                  minWidth: '100%',
                  width: 'max-content',
                  padding: '1rem',
                  background: 'transparent',
                  whiteSpace: 'pre',
                  fontSize: '0.875rem',
                  lineHeight: '1.5rem',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {code || ' '}
              </SyntaxHighlighter>
            </div>

            <textarea
              ref={editorRef}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onScroll={handleEditorScroll}
              spellCheck={false}
              wrap="off"
              aria-label="React code editor"
              className="absolute inset-0 w-full h-full pt-4 pr-4 pb-4 pl-[4.5rem] bg-transparent text-transparent caret-[#61afef] font-mono text-sm leading-6 resize-none overflow-x-auto overflow-y-auto whitespace-pre focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 selection:bg-blue-500/30"
              style={{
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                wordBreak: 'normal',
              }}
              placeholder="Write your React component here..."
            />
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Preview</p>
          <iframe
            title="React preview"
            sandbox="allow-scripts"
            srcDoc={previewDoc}
            className="w-full h-[320px] rounded-lg border border-white/10 bg-gray-950"
          />
        </div>
      </div>
    </div>
  );
};

export default ReactPlayground;
