import React, { useRef } from 'react';
import { exportElementToPdf } from '../utils/pdfExport';
import { Download, FileText, X } from 'lucide-react';

export default function PrintableMonthlyReport({ report, halaqah, monthYear, onClose }) {
  const printRef = useRef(null);

  const calculateRating = (score) => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    if (score >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const entries = report?.studentEntries || [];

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const safeName = halaqah?.name ? `تقرير_شهري_${halaqah.name}_${monthYear}.pdf` : `monthly_report_${monthYear}.pdf`;
    await exportElementToPdf(printRef.current, safeName, 'landscape');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Controls Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm sm:text-base">معاينة التقرير الشهري الرسمي المنسق</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              title="يفتح نافذة الحفظ كـ PDF والطباعة فوراً"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div 
            ref={printRef}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mx-auto text-slate-800"
            style={{ width: '100%', maxWidth: '1050px', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
          >
            {/* Islamic Header Banner */}
            <div className="border-b-2 border-emerald-800 pb-3 mb-4 text-center">
              <p className="text-xs text-emerald-800 font-bold mb-1">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <h1 className="text-xl font-extrabold text-slate-900 font-serif">مشروع حلقات تحفيظ القرآن الكريم</h1>
              <h2 className="text-sm font-bold text-emerald-800 mt-0.5">
                تقرير الأداء الشهري والإنجاز القرآني — لشهر: {monthYear}
              </h2>
              
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 font-semibold text-slate-700">
                <div>الحلقة: <strong className="text-emerald-950">{halaqah?.name || '—'}</strong></div>
                <div>المسجد والموقع: <strong className="text-emerald-950">{halaqah?.mosque || ''} ({halaqah?.location || ''})</strong></div>
                <div>المعلم: <strong className="text-emerald-950">{halaqah?.teacher?.fullName || report?.teacher?.fullName || '—'}</strong></div>
                <div>عدد الطلاب: <strong className="text-emerald-950">{entries.length} طالب</strong></div>
              </div>
            </div>

            {/* Table of Students */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-right border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-emerald-900 text-white text-[10px]">
                    <th className="border border-slate-300 p-1.5 text-center">م</th>
                    <th className="border border-slate-300 p-1.5">اسم الطالب</th>
                    <th className="border border-slate-300 p-1.5 text-center">الكود</th>
                    <th className="border border-slate-300 p-1.5 text-center">الافتتاحي</th>
                    <th className="border border-slate-300 p-1.5 text-center">الحالي</th>
                    <th className="border border-slate-300 p-1.5 text-center">التقدم</th>
                    <th className="border border-slate-300 p-1.5 text-center">الغياب</th>
                    <th className="border border-slate-300 p-1.5">الحفظ المنفذ</th>
                    <th className="border border-slate-300 p-1.5">المراجعة</th>
                    <th className="border border-slate-300 p-1.5 text-center">حفظ (45)</th>
                    <th className="border border-slate-300 p-1.5 text-center">تلاوة (20)</th>
                    <th className="border border-slate-300 p-1.5 text-center">أداء (10)</th>
                    <th className="border border-slate-300 p-1.5 text-center">دروس (10)</th>
                    <th className="border border-slate-300 p-1.5 text-center">حضور (10)</th>
                    <th className="border border-slate-300 p-1.5 text-center">سلوك (5)</th>
                    <th className="border border-slate-300 p-1.5 text-center">المجموع (100)</th>
                    <th className="border border-slate-300 p-1.5 text-center">التقدير</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-1 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-1 font-bold text-slate-800">{entry.studentName}</td>
                      <td className="border border-slate-300 p-1 text-center font-mono text-[10px]">{entry.studentCode}</td>
                      <td className="border border-slate-300 p-1 text-center text-slate-600">
                        {entry.openingMemorizedParts !== undefined ? entry.openingMemorizedParts : 0}
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-emerald-900 bg-emerald-50/50">
                        {entry.currentMemorizedParts !== undefined ? entry.currentMemorizedParts : (entry.openingMemorizedParts || 0)}
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-emerald-700">
                        {((entry.currentMemorizedParts || 0) - (entry.openingMemorizedParts || 0)) > 0 
                          ? `+${(entry.currentMemorizedParts || 0) - (entry.openingMemorizedParts || 0)}` 
                          : '0'}
                      </td>
                      <td className="border border-slate-300 p-1 text-center">
                        {(entry.absenceExcused || 0) + (entry.absenceUnexcused || 0)}
                      </td>
                      <td className="border border-slate-300 p-1">
                        {entry.actualMemorization?.surah ? `${entry.actualMemorization.surah} (${entry.actualMemorization.pagesCount} ص)` : '—'}
                      </td>
                      <td className="border border-slate-300 p-1">
                        {entry.actualRevision?.surah ? `${entry.actualRevision.surah} (${entry.actualRevision.pagesCount} ص)` : '—'}
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{entry.testScores?.memorization ?? 45}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{entry.testScores?.recitation ?? 20}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{entry.testScores?.performance ?? 10}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{entry.testScores?.lessons ?? 10}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{entry.testScores?.attendance ?? 10}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-emerald-800">{entry.testScores?.behavior ?? 5}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-slate-900 bg-amber-50/50">
                        {entry.totalScore || 100}
                      </td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-emerald-800">
                        {entry.finalRating || calculateRating(entry.totalScore || 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* General Notes and Signatures */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700 block mb-0.5">ملاحظات المعلم العامة:</span>
                <p className="text-slate-600 leading-relaxed">{report?.generalNotes || 'لا توجد ملاحظات إضافية مسجلة.'}</p>
              </div>

              <div className="flex items-center justify-around text-center p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">توقيع المعلم:</span>
                  <span className="font-bold text-slate-800 block">{halaqah?.teacher?.fullName || report?.teacher?.fullName || '....................'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">اعتماد المشرف الميداني:</span>
                  <span className="font-bold text-slate-800 block">{halaqah?.supervisor?.fullName || '....................'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
