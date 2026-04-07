import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '../context/DocumentContext';
import { useAuth } from '../context/AuthContext';
import { versionAPI, diffAPI } from '../services/api';
import VersionTimeline from '../components/VersionTimeline';
import DocumentEditor from '../components/DocumentEditor';
import DiffViewer from '../components/DiffViewer';
import ConfirmDialog from '../components/ConfirmDialog';

const DocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentDocument, fetchDocument, fetchVersions,
    versions, selectedVersion, setSelectedVersion,
    diffVersions, clearDiffSelection,
  } = useDocuments();

  const [versionContent, setVersionContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  // Determine user's access level
  const getUserAccess = useCallback(() => {
    if (!currentDocument || !user) return 'viewer';
    const ac = currentDocument.accessControl;
    const userId = user.id;
    if (ac.owner?._id === userId || ac.owner === userId) return 'owner';
    if (ac.approvers?.some(u => u._id === userId || u === userId)) return 'approver';
    if (ac.editors?.some(u => u._id === userId || u === userId)) return 'editor';
    return 'viewer';
  }, [currentDocument, user]);

  const userAccess = getUserAccess();
  const canEdit = userAccess === 'owner' || userAccess === 'editor';

  // Load document + versions
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const doc = await fetchDocument(id);
        await fetchVersions(id);
      } catch (err) {
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // When selected version changes, load its content
  useEffect(() => {
    const loadVersion = async () => {
      if (!selectedVersion) {
        // If no version selected, load current version
        if (currentDocument?.currentVersionId?.content) {
          setVersionContent(currentDocument.currentVersionId.content);
        } else if (currentDocument?.currentVersionId?._id) {
          try {
            const { data } = await versionAPI.get(currentDocument.currentVersionId._id);
            setVersionContent(data.version.content);
          } catch { /* ignore */ }
        } else if (versions.length > 0) {
          try {
            const { data } = await versionAPI.get(versions[0]._id);
            setVersionContent(data.version.content);
            setSelectedVersion(versions[0]);
          } catch { /* ignore */ }
        }
        return;
      }

      try {
        const { data } = await versionAPI.get(selectedVersion._id);
        setVersionContent(data.version.content);
      } catch {
        setError('Failed to load version content');
      }
    };
    loadVersion();
  }, [selectedVersion, currentDocument]);

  // Auto-load diff when two versions selected
  useEffect(() => {
    const loadDiff = async () => {
      if (diffVersions.v1 && diffVersions.v2) {
        try {
          const { data } = await diffAPI.compare(diffVersions.v1._id, diffVersions.v2._id);
          setDiffData(data);
          setShowDiff(true);
        } catch {
          setError('Failed to compute diff');
        }
      } else {
        setShowDiff(false);
        setDiffData(null);
      }
    };
    loadDiff();
  }, [diffVersions]);

  // Create new version
  const handleSaveVersion = async () => {
    if (!editContent.trim()) {
      setError('Content cannot be empty');
      return;
    }
    if (!commitMessage.trim()) {
      setError('Commit message is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await versionAPI.create(id, { content: editContent, message: commitMessage });
      setIsEditing(false);
      setCommitMessage('');
      await fetchDocument(id);
      await fetchVersions(id);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.warning || 'Failed to create version');
    } finally {
      setSaving(false);
    }
  };

  // Rollback
  const handleRollback = async (version) => {
    setConfirmAction({
      title: 'Rollback Version',
      message: `Are you sure you want to rollback to version ${version.versionNumber}? This will create a new version with that content.`,
      danger: true,
      confirmText: 'Rollback',
      onConfirm: async () => {
        try {
          await versionAPI.rollback(version._id);
          await fetchDocument(id);
          await fetchVersions(id);
          setConfirmAction(null);
        } catch (err) {
          setError(err.response?.data?.error || 'Rollback failed');
          setConfirmAction(null);
        }
      },
    });
  };

  // Approve
  const handleApprove = async (version) => {
    setConfirmAction({
      title: 'Approve Version',
      message: `Are you sure you want to approve version ${version.versionNumber}? This marks it as formally approved.`,
      confirmText: 'Approve',
      onConfirm: async () => {
        try {
          await versionAPI.approve(version._id);
          await fetchDocument(id);
          await fetchVersions(id);
          setConfirmAction(null);
        } catch (err) {
          setError(err.response?.data?.error || 'Approval failed');
          setConfirmAction(null);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentDocument) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-400">Document not found</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-400 hover:text-blue-300 text-sm bg-transparent border-none cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Toolbar */}
      <div className="bg-[#1e293b] border-b border-[#334155] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-sm"
          >
            ← Back
          </button>
          <span className="text-slate-600">|</span>
          <h2 className="text-white font-medium">{currentDocument.title}</h2>
          <span className="text-xs text-slate-500 bg-[#334155] px-2 py-0.5 rounded">
            {userAccess}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {showDiff && (
            <button
              onClick={() => {
                clearDiffSelection();
                setShowDiff(false);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 cursor-pointer border border-amber-600/30 transition-colors"
            >
              Close Diff
            </button>
          )}

          {canEdit && !isEditing && !showDiff && (
            <button
              onClick={() => {
                setEditContent(versionContent);
                setIsEditing(true);
              }}
              className="text-sm px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer border-none transition-colors"
            >
              Edit Document
            </button>
          )}

          {isEditing && (
            <>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-white text-sm w-64 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleSaveVersion}
                disabled={saving}
                className="text-sm px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer border-none transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Commit'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#334155] text-slate-300 hover:bg-[#475569] cursor-pointer border-none transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={() => navigate(`/documents/${id}/audit`)}
            className="text-sm px-3 py-1.5 rounded-lg bg-[#334155] text-slate-400 hover:text-white hover:bg-[#475569] cursor-pointer border-none transition-colors"
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-3 p-3 bg-red-600/10 border border-red-600/20 rounded-lg text-sm text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Version Timeline */}
        <div className="w-72 border-r border-[#334155] bg-[#1e293b]/50 shrink-0 flex flex-col overflow-hidden">
          <VersionTimeline
            onRollback={handleRollback}
            onApprove={handleApprove}
            userAccess={userAccess}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-auto">
          {showDiff && diffData ? (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-white font-medium">Comparing Versions</h3>
                <span className="text-xs text-slate-400 bg-[#334155] px-2 py-0.5 rounded">
                  v{diffData.version1.versionNumber} → v{diffData.version2.versionNumber}
                </span>
                <span className="text-xs text-emerald-400">+{diffData.stats.additions}</span>
                <span className="text-xs text-red-400">-{diffData.stats.deletions}</span>
              </div>
              <DiffViewer
                diff={diffData.diff}
                version1={diffData.version1}
                version2={diffData.version2}
              />
            </div>
          ) : (
            <DocumentEditor
              content={isEditing ? editContent : versionContent}
              onChange={isEditing ? setEditContent : undefined}
              readOnly={!isEditing}
            />
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        danger={confirmAction?.danger}
        onConfirm={confirmAction?.onConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default DocumentPage;
