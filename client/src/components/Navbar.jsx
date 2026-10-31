import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, UserCheck, Shield, Award } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'مدير النظام', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Shield };
      case 'supervisor':
        return { label: 'مشرف الحلقات', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: UserCheck };
      default:
        return { label: 'معلم الحلقة', color: 'bg-teal-100 text-teal-800 border-teal-300', icon: Award };
    }
  };

  const badge = getRoleBadge(user.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-amber-300 shadow-md shadow-emerald-900/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-emerald-950 leading-tight">نظام حِفظ</h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}>
                <BadgeIcon className="w-3 h-3" />
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">إدارة ومتابعة حلقات تحفيظ القرآن الكريم</p>
          </div>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
            <p className="text-xs text-slate-400">@{user.username}</p>
          </div>

          <button
            onClick={logout}
            title="تسجيل الخروج"
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
