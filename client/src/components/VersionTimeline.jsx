import { useDocuments } from '../context/DocumentContext';

const VersionTimeline = ({ onRollback, onApprove, userAccess }) => {
  const {
    versions,
    versionsLoading,
    selectedVersion,
    setSelectedVersion,
    diffVersions,
    selectVersionForDiff,
    currentDocument,
  } = useDocuments();

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isDiffSelected = (versionId) => {
    return diffVersions.v1?._id === versionId || diffVersions.v2?._id === versionId;
  };

  const isCurrentVersion = (versionId) => {
    return currentDocument?.currentVersionId?._id === versionId ||
           currentDocument?.currentVersionId === versionId;
  };

  if (versionsLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="text-slate-400 text-xs mt-2">Loading versions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-[#334155]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Version History
        </h3>
        <p className="text-xs text-slate-500 mt-1">{versions.length} version{versions.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {versions.map((version) => (
          <div
            key={version._id}
            className={`rounded-lg p-3 cursor-pointer transition-all border ${
              selectedVersion?._id === version._id
                ? 'bg-blue-600/20 border-blue-500/50'
                : isDiffSelected(version._id)
                ? 'bg-amber-600/10 border-amber-500/30'
                : 'bg-transparent border-transparent hover:bg-[#334155]/50 hover:border-[#334155]'
            }`}
            onClick={() => setSelectedVersion(version)}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-400">v{version.versionNumber}</span>
                {isCurrentVersion(version._id) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 font-medium">
                    CURRENT
                  </span>
                )}
                {version.isApproved && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/30 text-emerald-300 font-medium">
                    ✓ APPROVED
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectVersionForDiff(version);
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer border transition-colors ${
                  isDiffSelected(version._id)
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-transparent text-slate-500 border-[#334155] hover:border-slate-400 hover:text-slate-300'
                }`}
                title="Select for diff comparison"
              >
                DIFF
              </button>
            </div>

            {/* Message */}
            <p className="text-xs text-slate-300 mb-1.5 line-clamp-2">{version.message}</p>

            {/* Meta */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>{version.author?.name || 'Unknown'}</span>
              <span>·</span>
              <span>{formatDate(version.createdAt)}</span>
              <span>{formatTime(version.createdAt)}</span>
            </div>

            {/* Actions */}
            {selectedVersion?._id === version._id && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-[#334155]">
                {(userAccess === 'owner' || userAccess === 'editor') && !isCurrentVersion(version._id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRollback(version);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 cursor-pointer border border-amber-600/30 transition-colors"
                  >
                    ↩ Rollback
                  </button>
                )}
                {(userAccess === 'owner' || userAccess === 'approver') && !version.isApproved && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(version);
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 cursor-pointer border border-emerald-600/30 transition-colors"
                  >
                    ✓ Approve
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionTimeline;
