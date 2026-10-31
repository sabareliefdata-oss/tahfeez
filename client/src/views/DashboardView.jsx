import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Users, 
  Layers, 
  BookOpen, 
  Award, 
  Sparkles, 
  TrendingUp, 
  ClipboardCheck, 
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

export default function DashboardView({ setActiveTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [myHalaqah, setMyHalaqah] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, halaqatRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/halaqat')
        ]);
        setData(statsRes);
        if (user.role === 'teacher' && halaqatRes && halaqatRes.length > 0) {
          setMyHalaqah(halaqatRes[0]);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user.role]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-emerald-800">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold">جاري تحميل بيانات لوحة التحكم...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-5 pb-6">
      {/* Welcome Islamic Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-xs font-medium">أهلاً بك، {user.fullName}</p>
              <h2 className="text-xl font-bold mt-0.5 text-amber-200 font-serif">
                {user.role === 'admin' && 'لوحة قيادة ومتابعة الحلقات الشاملة (31 حلقة)'}
                {user.role === 'supervisor' && 'لوحة متابعة وإشراف الحلقات الميدانية'}
                {user.role === 'teacher' && 'لوحة أداء طلاب الحلقة والتقارير'}
              </h2>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-2 max-w-md leading-relaxed">
            متابعة إنجاز الحفظ والمراجعة ورصد الحضور والغياب والتقييمات الميدانية بدقة وسرعة.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {user.role === 'teacher' && myHalaqah && (
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">بيانات حلقتك القرآنية: {myHalaqah.name}</h3>
                <p className="text-[11px] text-slate-500">حلقة التحفيظ المكلف بتدريسها ومتابعة طلابها</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200">
              {myHalaqah.studentCount || 0} طالب مقيد
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">المسجد:</span>
              <span className="font-bold text-slate-700">{myHalaqah.mosque || 'المسجد التابع للحلقة'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">الموقع / الحي:</span>
              <span className="font-bold text-slate-700">{myHalaqah.location || 'تعز'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">المشرف المسؤول:</span>
              <span className="font-bold text-teal-800">{myHalaqah.supervisor?.fullName || 'غير محدد'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">وقت الحلقة:</span>
              <span className="font-bold text-slate-700">{myHalaqah.timeSlot || 'بعد صلاة العصر'}</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Students */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">إجمالي الطلاب</p>
            <h3 className="text-lg font-bold text-slate-800">{kpis.totalStudents || 0} <span className="text-[10px] font-normal text-slate-500">طالب</span></h3>
          </div>
        </div>

        {/* Total Halaqat */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">عدد الحلقات</p>
            <h3 className="text-lg font-bold text-slate-800">{kpis.totalHalaqat || 31} <span className="text-[10px] font-normal text-slate-500">حلقة</span></h3>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">نسبة الحضور والالتزام</p>
            <h3 className="text-lg font-bold text-emerald-800">{kpis.attendanceRate || '97%'}</h3>
          </div>
        </div>

        {/* Monthly Reports Submitted */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">التقارير الشهرية المعتمدة</p>
            <h3 className="text-lg font-bold text-amber-800">{kpis.monthlyReportsCount || 31} <span className="text-[10px] font-normal text-slate-500">تقرير</span></h3>
          </div>
        </div>
      </div>

      {/* Quick Mobile Action Shortcuts */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>العمليات السريعة</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTab('monthly')}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border border-emerald-200"
          >
            <ClipboardCheck className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold">التقرير الشهري</span>
            <span className="text-[10px] text-emerald-700/80">رصد الحفظ والغياب</span>
          </button>

          {(user.role === 'admin' || user.role === 'supervisor') && (
            <button
              onClick={() => setActiveTab('evaluations')}
              className="p-3 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border border-teal-200"
            >
              <Award className="w-5 h-5 text-teal-700" />
              <span className="text-xs font-bold">تقييم المشرف</span>
              <span className="text-[10px] text-teal-700/80">الزيارة بـ 100 درجة</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('annual')}
            className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border border-amber-200"
          >
            <FileSpreadsheet className="w-5 h-5 text-amber-700" />
            <span className="text-xs font-bold">التقرير السنوي</span>
            <span className="text-[10px] text-amber-700/80">قالب الممول والداعم</span>
          </button>

          {user.role === 'admin' ? (
            <button
              onClick={() => setActiveTab('ai')}
              className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border border-purple-200"
            >
              <Sparkles className="w-5 h-5 text-purple-700" />
              <span className="text-xs font-bold">المساعد الذكي</span>
              <span className="text-[10px] text-purple-700/80">تحليل Gemini التنفيذي</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('students')}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer border border-slate-200"
            >
              <Users className="w-5 h-5 text-slate-700" />
              <span className="text-xs font-bold">سجل الطلاب</span>
              <span className="text-[10px] text-slate-500">قائمة طلاب الحلقة</span>
            </button>
          )}
        </div>
      </div>

      {/* AI On-Demand Callout Card (Visible to Admin only) */}
      {user.role === 'admin' && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700/50 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-100">التحليل الاستراتيجي بالذكاء الاصطناعي (Gemini)</h4>
              <p className="text-[11px] text-purple-200">خاص بمدير النظام: استخراج ملخص تنفيذي ونقاط القوة والضعف عند الطلب بنقرة واحدة.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ai')}
            className="w-full sm:w-auto px-4 py-2 bg-amber-400 hover:bg-amber-300 text-purple-950 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            فتح التحليل الذكي
          </button>
        </div>
      )}
    </div>
  );
}
