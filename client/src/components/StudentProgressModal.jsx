import React, { useRef, useState, useEffect } from 'react';
import { api } from '../services/api';
import { exportElementToPdf } from '../utils/pdfExport';
import { Download, User, Calendar, Award, X, BookOpen, Clock, FileText } from 'lucide-react';

export default function StudentProgressModal({ student, onClose }) {
  const printRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!student?._id) return;
      try {
        const res = await api.get(`/students/${student._id}/report-history`);
        setHistory(res.history || []);
      } catch (err) {
        console.error('Error fetching student history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [student?._id]);

  const filteredHistory = selectedMonth === 'all' 
    ? history 
    : history.filter(h => h.monthYear === selectedMonth);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const safeName = `تقرير_متابعة_الطالب_${student.fullName}_${selectedMonth}.pdf`;
    await exportElementToPdf(printRef.current, safeName, 'portrait');
  };

  const openParts = student?.openingMemorizedParts !== undefined ? student.openingMemorizedParts : 0;
  const currParts = student?.memorizedParts !== undefined ? student.memorizedParts : openParts;
  const totalProgress = Math.max(0, currParts - openParts);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Controls Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">تقرير مسار وأداء الطالب: {student?.fullName}</h3>
              <p className="text-[11px] text-emerald-200">الكود: {student?.code || '—'} | الحلقة: {student?.halaqah?.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter by Month */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-emerald-800 text-white border border-emerald-700 text-xs px-2.5 py-1.5 rounded-xl cursor-pointer"
            >
              <option value="all">كافة الأشهر التراكمية ({history.length} شهر)</option>
              {history.map(h => (
                <option key={h.monthYear} value={h.monthYear}>شهر {h.monthYear}</option>
              ))}
            </select>

            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              title="يفتح نافذة الحفظ كـ PDF والطباعة فوراً"
            >
              <Download className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div 
            ref={printRef}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mx-auto text-slate-800 space-y-4"
            style={{ width: '100%', maxWidth: '850px', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
          >
            {/* Header Banner */}
            <div className="border-b-2 border-emerald-800 pb-3 text-center">
              <p className="text-xs text-emerald-800 font-bold mb-1">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <h1 className="text-lg font-bold text-slate-900 font-serif">مشروع حلقات تحفيظ القرآن الكريم</h1>
              <h2 className="text-sm font-bold text-emerald-800 mt-0.5">
                كشف المتابعة والمسار التعليمي للقرآن الكريم للطالب
              </h2>

              {/* Student Info Card */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 block">اسم الطالب:</span>
                  <strong className="text-slate-900 text-sm">{student?.fullName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الكود:</span>
                  <strong className="font-mono text-emerald-900">{student?.code}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الحلقة والمعلم:</span>
                  <strong>{student?.halaqah?.name} — {student?.halaqah?.teacher?.fullName || 'معلم'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الرصيد الافتتاحي:</span>
                  <strong className="text-slate-700 text-sm">{openParts} أجزاء</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">الحالي والتقدم:</span>
                  <strong className="text-emerald-900 text-sm">
                    {currParts} ج 
                    {totalProgress > 0 && (
                      <span className="mr-1 text-emerald-700 font-bold bg-emerald-200/70 px-1 py-0.5 rounded text-[11px]">
                        (+{totalProgress})
                      </span>
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs font-bold text-slate-500">جاري تحميل سجلات الطالب...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl space-y-1">
                <p className="font-bold text-slate-700">لم يتم رصد تقارير شهرية لهذا الطالب حتى الآن في النظام.</p>
                <p className="text-[11px] text-slate-400">عند قيام المعلم بحفظ التقرير الشهري للحلقة، ستظهر بيانات هذا الطالب تلقائياً هنا بالتفصيل.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>سجل الإنجاز والدرجات شهراً بشهر:</span>
                </h4>

                <div className="space-y-4">
                  {filteredHistory.map((item, idx) => {
                    const itemOpen = item.openingMemorizedParts !== undefined ? item.openingMemorizedParts : openParts;
                    const itemCurr = item.currentMemorizedParts !== undefined ? item.currentMemorizedParts : currParts;
                    const itemProg = Math.max(0, itemCurr - itemOpen);

                    return (
                      <div key={idx} className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3 text-xs">
                        {/* Month Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <strong className="text-slate-900 text-sm">تقرير شهر: {item.monthYear}</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold border border-teal-200">
                              الحفظ: {itemCurr} أجزاء {itemProg > 0 && `(+${itemProg} ج)`}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-300">
                              المجموع: {item.totalScore || 100} / 100
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                              التقدير: {item.finalRating || 'ممتاز'}
                            </span>
                          </div>
                        </div>

                        {/* Performance Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">أيام الغياب:</span>
                            <span className="font-semibold text-slate-700">{(item.absenceExcused || 0) + (item.absenceUnexcused || 0)} أيام</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">الحفظ المنفذ:</span>
                            <span className="font-semibold text-slate-700">{item.actualMemorization?.surah || '—'} {item.actualMemorization?.pagesCount ? `(${item.actualMemorization.pagesCount} ص)` : ''}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">المراجعة المنفذة:</span>
                            <span className="font-semibold text-slate-700">{item.actualRevision?.surah || '—'} {item.actualRevision?.pagesCount ? `(${item.actualRevision.pagesCount} ص)` : ''}</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">المنهج العلمي:</span>
                            <span className="font-semibold text-slate-700">{item.scientificCurriculum?.actual || item.scientificCurriculum?.plan || '—'}</span>
                          </div>
                        </div>

                        {/* Detailed Test Scores Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-center text-[10.5px] border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-emerald-900 text-white text-[10px]">
                                <th className="p-1 border border-slate-300">حفظ (45)</th>
                                <th className="p-1 border border-slate-300">تلاوة (20)</th>
                                <th className="p-1 border border-slate-300">أداء (10)</th>
                                <th className="p-1 border border-slate-300">دروس (10)</th>
                                <th className="p-1 border border-slate-300">حضور (10)</th>
                                <th className="p-1 border border-slate-300">سلوك (5)</th>
                                <th className="p-1 border border-slate-300 bg-amber-400 text-emerald-950 font-bold">المجموع (100)</th>
                                <th className="p-1 border border-slate-300">التقدير</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="bg-white font-semibold">
                                <td className="p-1 border border-slate-300 text-slate-700">{item.testScores?.memorization ?? 45}</td>
                                <td className="p-1 border border-slate-300 text-slate-700">{item.testScores?.recitation ?? 20}</td>
                                <td className="p-1 border border-slate-300 text-slate-700">{item.testScores?.performance ?? 10}</td>
                                <td className="p-1 border border-slate-300 text-slate-700">{item.testScores?.lessons ?? 10}</td>
                                <td className="p-1 border border-slate-300 text-slate-700">{item.testScores?.attendance ?? 10}</td>
                                <td className="p-1 border border-slate-300 text-slate-700">{item.testScores?.behavior ?? 5}</td>
                                <td className="p-1 border border-slate-300 font-bold text-emerald-950 bg-amber-50">{item.totalScore || 100}</td>
                                <td className="p-1 border border-slate-300 font-bold text-emerald-800">{item.finalRating || 'ممتاز'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {item.teacherNotes && (
                          <div className="p-2 bg-emerald-50/70 rounded-lg text-[11px] text-emerald-950 border border-emerald-100">
                            <strong>ملاحظات المعلم: </strong> {item.teacherNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Official Signatures Footer */}
            <div className="pt-4 border-t-2 border-emerald-800 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-800">
              <div>
                <p className="text-slate-500 text-[10px] mb-6">معلم الحلقة:</p>
                <p className="border-t border-slate-300 pt-1 font-bold">{student?.halaqah?.teacher?.fullName || '....................'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] mb-6">مشرف الحلقات:</p>
                <p className="border-t border-slate-300 pt-1 font-bold">{student?.halaqah?.supervisor?.fullName || '....................'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] mb-6">ختم إدارة المركز:</p>
                <p className="border-t border-slate-300 pt-1 font-bold">إدارة شؤون الحلقات</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
