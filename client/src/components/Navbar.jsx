import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    viewer: 'bg-slate-600',
    editor: 'bg-blue-600',
    approver: 'bg-emerald-600',
  };

  return (
    <nav className="bg-[#1e293b] border-b border-[#334155] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#2563eb" />
            <path d="M8 14l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-lg font-bold text-white tracking-tight">OfficeGit</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-md text-sm no-underline transition-colors ${
              location.pathname === '/'
                ? 'bg-[#334155] text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]/50'
            }`}
          >
            Dashboard
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${roleColors[user?.role] || 'bg-slate-600'}`}>
          {user?.role}
        </span>
        <span className="text-sm text-slate-300">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-[#334155]/50 transition-colors cursor-pointer bg-transparent border-none"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
