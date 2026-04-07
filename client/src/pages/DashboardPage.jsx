import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState('text'); // 'text' or 'upload'
  const [createForm, setCreateForm] = useState({ title: '', content: '', message: 'Initial version' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentAPI.list();
      setDocuments(data.documents);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      if (createMode === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', createForm.title);
        formData.append('message', createForm.message || 'Initial version');
        await documentAPI.create(formData);
      } else {
        await documentAPI.createText({
          title: createForm.title,
          content: createForm.content,
          message: createForm.message || 'Initial version',
        });
      }
      setShowCreateModal(false);
      setCreateForm({ title: '', content: '', message: 'Initial version' });
      setSelectedFile(null);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your version-controlled documents</p>
        </div>
        {(user?.role === 'editor' || user?.role === 'approver') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer border-none"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Document
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-3 bg-red-600/10 border border-red-600/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Document Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#1e293b] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 4h10l6 6v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="#64748b" strokeWidth="1.5" />
              <path d="M16 4v6h6" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No documents yet</h3>
          <p className="text-slate-400 text-sm">Create your first document to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 cursor-pointer hover:border-blue-500/30 hover:bg-[#1e293b]/80 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M4 2h8l4 4v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#2563eb" strokeWidth="1.5" />
                    <path d="M12 2v4h4" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                {doc.currentVersionId?.isApproved && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400 font-medium">
                    ✓ Approved
                  </span>
                )}
              </div>

              <h3 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors truncate">
                {doc.title}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                by {doc.createdBy?.name || 'Unknown'} · {formatDate(doc.createdAt)}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  v{doc.currentVersionId?.versionNumber || 1}
                </span>
                <span>{doc.currentVersionId?.message || 'Initial version'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Document</h2>

            {/* Mode Toggle */}
            <div className="flex bg-[#0f172a] rounded-lg p-0.5 mb-4 border border-[#334155]">
              <button
                type="button"
                onClick={() => setCreateMode('text')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer border-none ${
                  createMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                ✍️ Write Content
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('upload')}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer border-none ${
                  createMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                📁 Upload File
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Document title"
                  required
                />
              </div>

              {createMode === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Content</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    className="w-full h-40 px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-white text-sm font-mono resize-none focus:border-blue-500 focus:outline-none"
                    placeholder="Enter document content..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">File (.txt or .pdf)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#334155] rounded-lg p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                  >
                    {selectedFile ? (
                      <div>
                        <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-slate-500 text-xs mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2">
                          <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-slate-400 text-sm">Click to select a file</p>
                        <p className="text-slate-600 text-xs mt-1">Max 1MB · .txt or .pdf</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Commit Message</label>
                <input
                  type="text"
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Initial version"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setCreateForm({ title: '', content: '', message: 'Initial version' });
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-[#334155] text-slate-300 hover:bg-[#475569] transition-colors cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer border-none disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
