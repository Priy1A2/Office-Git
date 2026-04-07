import { useMemo, useState } from 'react';

const DiffViewer = ({ diff, version1, version2 }) => {
  const [viewMode, setViewMode] = useState('inline'); // 'inline' or 'split'

  // Escape HTML to prevent XSS
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const inlineView = useMemo(() => {
    if (!diff) return null;
    return diff.map((part, i) => {
      const lines = part.value.split('\n');
      // Remove trailing empty string from split
      if (lines[lines.length - 1] === '') lines.pop();

      return lines.map((line, j) => {
        let bgColor = '';
        let prefix = ' ';
        let textColor = 'text-slate-300';

        if (part.added) {
          bgColor = 'bg-emerald-950/50 border-l-2 border-emerald-500';
          prefix = '+';
          textColor = 'text-emerald-300';
        } else if (part.removed) {
          bgColor = 'bg-red-950/50 border-l-2 border-red-500';
          prefix = '-';
          textColor = 'text-red-300';
        } else {
          bgColor = 'border-l-2 border-transparent';
        }

        return (
          <div key={`${i}-${j}`} className={`${bgColor} px-4 py-0.5 font-mono text-sm flex`}>
            <span className={`select-none w-6 shrink-0 ${part.added ? 'text-emerald-500' : part.removed ? 'text-red-500' : 'text-slate-600'}`}>
              {prefix}
            </span>
            <span className={textColor} dangerouslySetInnerHTML={{ __html: escapeHtml(line) || '&nbsp;' }} />
          </div>
        );
      });
    });
  }, [diff]);

  const splitView = useMemo(() => {
    if (!diff) return { left: [], right: [] };

    const left = [];
    const right = [];
    let leftLine = 1;
    let rightLine = 1;

    diff.forEach((part, i) => {
      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop();

      lines.forEach((line, j) => {
        if (part.removed) {
          left.push({
            key: `l-${i}-${j}`,
            num: leftLine++,
            content: line,
            type: 'removed',
          });
          right.push({
            key: `r-${i}-${j}`,
            num: '',
            content: '',
            type: 'empty',
          });
        } else if (part.added) {
          left.push({
            key: `l-${i}-${j}`,
            num: '',
            content: '',
            type: 'empty',
          });
          right.push({
            key: `r-${i}-${j}`,
            num: rightLine++,
            content: line,
            type: 'added',
          });
        } else {
          left.push({
            key: `l-${i}-${j}`,
            num: leftLine++,
            content: line,
            type: 'unchanged',
          });
          right.push({
            key: `r-${i}-${j}`,
            num: rightLine++,
            content: line,
            type: 'unchanged',
          });
        }
      });
    });

    return { left, right };
  }, [diff]);

  if (!diff || diff.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>No differences found. The versions are identical.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600"></span> Added
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-600"></span> Removed
          </span>
        </div>
        <div className="flex bg-[#0f172a] rounded-lg p-0.5 border border-[#334155]">
          <button
            onClick={() => setViewMode('inline')}
            className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer border-none ${
              viewMode === 'inline' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            Inline
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer border-none ${
              viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Diff Content */}
      <div className="bg-[#0f172a] rounded-lg border border-[#334155] overflow-hidden">
        {viewMode === 'inline' ? (
          <div className="overflow-x-auto">{inlineView}</div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-[#334155]">
            {/* Left (old) */}
            <div className="overflow-x-auto">
              <div className="px-3 py-1.5 bg-[#1e293b] border-b border-[#334155] text-xs text-slate-400 font-medium">
                v{version1?.versionNumber} — {version1?.author?.name}
              </div>
              {splitView.left.map((line) => {
                let bg = '';
                let textColor = 'text-slate-300';
                if (line.type === 'removed') {
                  bg = 'bg-red-950/40';
                  textColor = 'text-red-300';
                } else if (line.type === 'empty') {
                  bg = 'bg-[#0f172a]';
                }
                return (
                  <div key={line.key} className={`${bg} px-4 py-0.5 font-mono text-sm flex`}>
                    <span className="text-slate-600 select-none w-8 shrink-0 text-right mr-3 text-xs leading-5">
                      {line.num}
                    </span>
                    <span className={textColor} dangerouslySetInnerHTML={{ __html: escapeHtml(line.content) || '&nbsp;' }} />
                  </div>
                );
              })}
            </div>
            {/* Right (new) */}
            <div className="overflow-x-auto">
              <div className="px-3 py-1.5 bg-[#1e293b] border-b border-[#334155] text-xs text-slate-400 font-medium">
                v{version2?.versionNumber} — {version2?.author?.name}
              </div>
              {splitView.right.map((line) => {
                let bg = '';
                let textColor = 'text-slate-300';
                if (line.type === 'added') {
                  bg = 'bg-emerald-950/40';
                  textColor = 'text-emerald-300';
                } else if (line.type === 'empty') {
                  bg = 'bg-[#0f172a]';
                }
                return (
                  <div key={line.key} className={`${bg} px-4 py-0.5 font-mono text-sm flex`}>
                    <span className="text-slate-600 select-none w-8 shrink-0 text-right mr-3 text-xs leading-5">
                      {line.num}
                    </span>
                    <span className={textColor} dangerouslySetInnerHTML={{ __html: escapeHtml(line.content) || '&nbsp;' }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffViewer;
