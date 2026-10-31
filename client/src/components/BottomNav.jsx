import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Layers, 
  Users, 
  ClipboardCheck, 
  Award, 
  FileSpreadsheet, 
  Sparkles,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  if (!user) return null;

  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'teacher'] },
    { id: 'halaqat', label: 'الحلقات', icon: Layers, roles: ['admin', 'supervisor'] }, // Hidden for teachers as they teach a single halaqah
    { id: 'students', label: 'الطلاب', icon: Users, roles: ['admin', 'supervisor', 'teacher'] },
    { id: 'monthly', label: 'التقرير الشهري', icon: ClipboardCheck, roles: ['admin', 'supervisor', 'teacher'] },
    { id: 'evaluations', label: 'تقييم المشرف', icon: Award, roles: ['admin', 'supervisor'] },
    { id: 'annual', label: 'التقرير السنوي', icon: FileSpreadsheet, roles: ['admin', 'teacher', 'supervisor'] },
    // Teachers & Supervisors management (Admin only)
    { id: 'teachers', label: 'المدرسين', icon: GraduationCap, roles: ['admin'] },
    { id: 'supervisors', label: 'المشرفين', icon: ShieldCheck, roles: ['admin'] },
    // AI Analysis (Admin only as explicitly requested)
    { id: 'ai', label: 'المساعد الذكي', icon: Sparkles, roles: ['admin'] }
  ].filter(t => t.roles.includes(user.role));

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-lg md:hidden">
        <div className="flex items-center justify-around px-1 py-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-w-[56px] shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop / Tablet Sub-Navbar */}
      <div className="hidden md:block bg-emerald-900 text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-emerald-800 text-amber-300 shadow-xs'
                    : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
