const DocumentEditor = ({ content, onChange, readOnly = false }) => {
  return (
    <div className="h-full flex flex-col">
      {readOnly && (
        <div className="px-3 py-1.5 bg-amber-600/10 border-b border-amber-600/20 text-xs text-amber-400 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M7 11v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Read-only view
        </div>
      )}
      <textarea
        value={content || ''}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        placeholder={readOnly ? '' : 'Start typing your document content...'}
        className={`flex-1 w-full bg-[#0f172a] text-slate-200 font-mono text-sm p-4 resize-none border-none outline-none leading-relaxed ${
          readOnly ? 'cursor-default' : ''
        }`}
        spellCheck={false}
      />
    </div>
  );
};

export default DocumentEditor;
