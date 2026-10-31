import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle2, AlertCircle, Phone, Clock, RefreshCw } from 'lucide-react';

export default function SubmissionTracker({ monthYear }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/monthly-reports/submission-status?monthYear=${monthYear}`);
      setData(res);
    } catch (err) {
      console.error('Error fetching submission status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [monthYear]);

  if (loading) {
    return <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 font-semibold">جاري رصد حالة رفع التقارير...</div>;
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>مؤشر متابعة رفع التقارير الشهرية — لشهر ({data.monthYear})</span>
          </h3>
          <p className="text-[11px] text-slate-500">متابعة دقيقة للحلقات التي تم اعتماد تقاريرها والحلقات المتأخرة لتسهيل التواصل الفوري مع المعلمين</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم الرفع: {data.submittedCount} من {data.totalHalaqat} ({data.submittedRate}%)</span>
          </div>
          <button
            onClick={fetchStatus}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
            title="تحديث الحالة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Pending / Late Teachers */}
        <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 pb-1.5 border-b border-amber-200/60">
            <span className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>حلقات لم ترفع التقرير بعد ({data.pendingCount}):</span>
            </span>
            <span className="text-[10px] text-amber-700 font-normal">بحاجة لمتابعة هاتفية</span>
          </div>

          {data.pending.length === 0 ? (
            <p className="text-xs text-emerald-700 font-bold p-3 text-center">✓ ممتاز! جميع الحلقات قامت برفع تقاريرها لهذا الشهر بنجاح.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {data.pending.map(h => (
                <div key={h.halaqahId} className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{h.halaqahName}</strong>
                    <span className="text-[10px] text-slate-500">المعلم: {h.teacherName}</span>
                  </div>
                  {h.teacherPhone && (
                    <a
                      href={`tel:${h.teacherPhone}`}
                      className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md font-bold text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{h.teacherPhone}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submitted Teachers */}
        <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 pb-1.5 border-b border-emerald-200/60">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>حلقات تم اعتماد تقريرها ({data.submittedCount}):</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-normal">منجزة ومعتمدة</span>
          </div>

          {data.submitted.length === 0 ? (
            <p className="text-xs text-slate-400 p-3 text-center">لا توجد تقارير معتمدة لهذا الشهر حتى الآن.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {data.submitted.map(h => (
                <div key={h.halaqahId} className="bg-white p-2.5 rounded-lg border border-emerald-100 text-xs flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 block">{h.halaqahName}</strong>
                    <span className="text-[10px] text-slate-500">المعلم: {h.teacherName}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                    تم الرفع بنجاح
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
