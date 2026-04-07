import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auditAPI } from '../services/api';

const AuditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  useEffect(() => {
    fetchLogs();
  }, [id]);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await auditAPI.getLog(id, page);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const actionColors = {
    CREATE: 'bg-blue-600/20 text-blue-400',
    EDIT: 'bg-amber-600/20 text-amber-400',
    ROLLBACK: 'bg-red-600/20 text-red-400',
    APPROVE: 'bg-emerald-600/20 text-emerald-400',
    ACCESS_CHANGE: 'bg-purple-600/20 text-purple-400',
  };

  const actionIcons = {
    CREATE: '📄',
    EDIT: '✏️',
    ROLLBACK: '↩️',
    APPROVE: '✅',
    ACCESS_CHANGE: '🔐',
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(`/documents/${id}`)}
          className="text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer text-sm"
        >
          ← Back to Document
        </button>
        <span className="text-slate-600">|</span>
        <h1 className="text-xl font-bold text-white">Audit Trail</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p>No audit entries found</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => {
              const { date, time } = formatDateTime(log.createdAt);
              return (
                <div
                  key={log._id}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 flex items-center gap-4"
                >
                  <span className="text-lg">{actionIcons[log.action] || '📋'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${actionColors[log.action] || 'bg-slate-600/20 text-slate-400'}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-white">{log.performedBy?.name || 'Unknown'}</span>
                    </div>
                    {log.metadata?.message && (
                      <p className="text-xs text-slate-400 mt-1">"{log.metadata.message}"</p>
                    )}
                    {log.metadata?.versionNumber && (
                      <p className="text-xs text-slate-500 mt-0.5">Version {log.metadata.versionNumber}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">{date}</p>
                    <p className="text-xs text-slate-500">{time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchLogs(page)}
                  className={`px-3 py-1 text-sm rounded cursor-pointer border-none transition-colors ${
                    page === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#334155] text-slate-400 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditPage;
