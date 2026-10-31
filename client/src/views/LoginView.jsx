import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول، تأكد من صحة البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      {/* Container with mobile-first maximum width */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
        
        {/* Islamic Header Banner with Saba Relief Branding */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-7 text-center relative overflow-hidden text-white">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          {/* Foundation Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-xs font-semibold text-amber-200 mb-3 shadow-xs">
            <span>مؤسسة سبأ للإغاثة والتنمية</span>
          </div>

          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-amber-300 shadow-lg border border-emerald-500/30">
            <BookOpen className="w-9 h-9" />
          </div>

          <h2 className="text-2xl font-bold font-serif tracking-wide text-amber-100">نظام حِفظ</h2>
          <p className="text-xs text-emerald-200 mt-1">منظومة متابعة وإدارة حلقات تحفيظ القرآن الكريم</p>
          <div className="mt-3 text-[11px] text-amber-200/80 font-serif italic">
            ﴿ وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ ﴾
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium text-center animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">اسم المستخدم أو رقم الهاتف</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-800/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center space-y-0.5">
          <p className="text-xs font-bold text-emerald-900">مؤسسة سبأ للإغاثة والتنمية</p>
          <p className="text-[10px] text-slate-400">نظام حِفظ © 2026 — مصمم للجوال أولاً</p>
        </div>
      </div>
    </div>
  );
}
