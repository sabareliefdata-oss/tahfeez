import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PrintableMonthlyReport from '../components/PrintableMonthlyReport';
import SubmissionTracker from '../components/SubmissionTracker';
import { 
  ClipboardCheck, 
  Download, 
  Save, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  Eye, 
  Award,
  Calendar,
  Layers
} from 'lucide-react';

export default function MonthlyReportView({ defaultHalaqahId }) {
  const { user } = useAuth();
  const isTeacher = user.role === 'teacher';
  const isAdmin = user.role === 'admin';
  const isSupervisor = user.role === 'supervisor';

  const [halaqat, setHalaqat] = useState([]);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState(defaultHalaqahId || '');
  const [monthYear, setMonthYear] = useState('2026-10');
  
  const [reportData, setReportData] = useState(null);
  const [studentEntries, setStudentEntries] = useState([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [allSubmittedReports, setAllSubmittedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  // PDF Preview Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  // Selected archive month in teacher view
  const [openedArchiveMonth, setOpenedArchiveMonth] = useState(null);
  const [archiveStudents, setArchiveStudents] = useState([]);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const calculateRating = (score) => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    if (score >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const fetchInitialData = async () => {
    try {
      const [hRes, rRes] = await Promise.all([
        api.get('/halaqat'),
        api.get('/monthly-reports')
      ]);
      setHalaqat(hRes);
      setAllSubmittedReports(rRes);

      let initialHalaqahId = selectedHalaqahId;
      if (!initialHalaqahId && hRes.length > 0) {
        initialHalaqahId = hRes[0]._id;
        setSelectedHalaqahId(initialHalaqahId);
      }

      if (initialHalaqahId) {
        loadReportForHalaqah(initialHalaqahId, monthYear);
      }
    } catch (err) {
      console.error('Error fetching halaqat:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const loadReportForHalaqah = async (hId, mYear) => {
    if (!hId || !mYear) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.get(`/monthly-reports/init/${hId}/${mYear}`);
      if (res.isNew) {
        setReportData(null);
        setStudentEntries(res.studentEntries || []);
        setGeneralNotes(res.generalNotes || '');
      } else {
        setReportData(res.report);
        setStudentEntries(res.report?.studentEntries || res.studentEntries || []);
        setGeneralNotes(res.report?.generalNotes || res.generalNotes || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHalaqahChange = (e) => {
    const newId = e.target.value;
    setSelectedHalaqahId(newId);
    loadReportForHalaqah(newId, monthYear);
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setMonthYear(newMonth);
    loadReportForHalaqah(selectedHalaqahId, newMonth);
  };

  const updateStudentEntry = (index, field, value) => {
    if (!isTeacher) return;
    setStudentEntries(prev => {
      const updated = [...prev];
      const entry = { ...updated[index] };

      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        entry[parent] = { ...entry[parent], [child]: value };
      } else {
        entry[field] = value;
      }

      if (field.startsWith('testScores.')) {
        const scores = entry.testScores || {};
        const total = (Number(scores.memorization) || 0) +
                      (Number(scores.recitation) || 0) +
                      (Number(scores.performance) || 0) +
                      (Number(scores.lessons) || 0) +
                      (Number(scores.attendance) || 0) +
                      (Number(scores.behavior) || 0);
        entry.totalScore = total;
        entry.finalRating = calculateRating(total);
      }

      updated[index] = entry;
      return updated;
    });
  };

  const adjustAbsence = (index, type, delta) => {
    if (!isTeacher) return;
    setStudentEntries(prev => {
      const updated = [...prev];
      const entry = { ...updated[index] };
      const current = entry[type] || 0;
      entry[type] = Math.max(0, current + delta);
      updated[index] = entry;
      return updated;
    });
  };

  const handleSaveReport = async () => {
    if (!isTeacher) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.post('/monthly-reports', {
        halaqahId: selectedHalaqahId,
        monthYear,
        studentEntries,
        generalNotes,
        status: 'submitted'
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      loadReportForHalaqah(selectedHalaqahId, monthYear);
      const rRes = await api.get('/monthly-reports');
      setAllSubmittedReports(rRes);
    } catch (err) {
      alert(err.message || 'فشل حفظ التقرير');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadExcel = async (repId = null) => {
    const targetId = repId || reportData?._id;
    if (targetId) {
      try {
        await api.downloadBlob(`/monthly-reports/${targetId}/export-excel`, 'التقرير_الشهري.xlsx');
      } catch (err) {
        alert(err.message || 'فشل تنزيل ملف الإكسل');
      }
    } else {
      alert('لا يوجد تقرير معتمد محفوظ لهذا الشهر حتى الآن لتصديره');
    }
  };

  const openPdfPreview = (rep = null) => {
    const targetRep = rep || reportData || { studentEntries, generalNotes, monthYear };
    setPreviewReport(targetRep);
    setPdfModalOpen(true);
  };

  const activeHalaqahObj = halaqat.find(h => h._id === selectedHalaqahId);

  // Unique months in submitted reports for teacher archive
  const teacherReports = isTeacher
    ? allSubmittedReports.filter(r => (r.halaqah?._id || r.halaqah) === selectedHalaqahId)
    : allSubmittedReports;

  return (
    <div className="space-y-4 pb-8">
      {/* Top Controls Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-800">التقرير الشهري لأداء الحلقة</h2>
              {!isTeacher && (
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>وضع الاستعراض والتصدير فقط</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeHalaqahObj ? `حلقة: ${activeHalaqahObj.name} | المعلم: ${activeHalaqahObj.teacher?.fullName || '—'}` : 'اختر الحلقة'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons on top: ONLY for Teacher Save */}
            {isTeacher && (
              <button
                onClick={handleSaveReport}
                disabled={saving || studentEntries.length === 0}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ واعتماد التقرير'}</span>
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ التقرير الشهري بنجاح وتحديث عدد الأجزاء المحفوظة في ملف الطالب!</span>
          </div>
        )}

        {/* Halaqah & Month Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              اختر الحلقة ({halaqat.length} حلقة):
            </label>
            <select
              value={selectedHalaqahId}
              onChange={handleHalaqahChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {halaqat.map(h => (
                <option key={h._id} value={h._id}>
                  {h.name} ({h.studentCount || 0} طالب) — {h.teacher?.fullName || 'معلم'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">الشهر المستهدف:</label>
            <input
              type="month"
              value={monthYear}
              onChange={handleMonthChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* TRACKER FOR ADMIN & SUPERVISOR: WHO SUBMITTED & WHO HASN'T */}
      {(isAdmin || isSupervisor) && (
        <SubmissionTracker monthYear={monthYear} />
      )}

      {/* VIEW-ONLY MODE FOR ADMIN & SUPERVISOR */}
      {!isTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                كشف درجات وأداء طلاب الحلقة لشهر {monthYear} ({studentEntries.length} طالب):
              </h3>
              <span className="text-xs text-slate-500">
                {reportData ? '✓ تقرير معتمد من المعلم' : 'لم يرفع المعلم تقرير هذا الشهر بعد'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadExcel()}
                disabled={!reportData?._id}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>تنزيل إكسل</span>
              </button>

              <button
                onClick={() => openPdfPreview()}
                disabled={!reportData?._id}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>تنزيل تقرير PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-2.5">م</th>
                  <th className="p-2.5">اسم الطالب</th>
                  <th className="p-2.5">الكود</th>
                  <th className="p-2.5 text-center text-slate-700 font-bold bg-slate-100">الافتتاحي</th>
                  <th className="p-2.5 text-center text-emerald-800 font-bold bg-emerald-50/50">الحفظ الحالي</th>
                  <th className="p-2.5 text-center text-emerald-700 font-bold bg-emerald-100/40">التقدم</th>
                  <th className="p-2.5">الغياب</th>
                  <th className="p-2.5">الحفظ المنفذ</th>
                  <th className="p-2.5">المراجعة</th>
                  <th className="p-2.5 text-center">حفظ (45)</th>
                  <th className="p-2.5 text-center">تلاوة (20)</th>
                  <th className="p-2.5 text-center">أداء (10)</th>
                  <th className="p-2.5 text-center">دروس (10)</th>
                  <th className="p-2.5 text-center">حضور (10)</th>
                  <th className="p-2.5 text-center">سلوك (5)</th>
                  <th className="p-2.5 text-center">المجموع (100)</th>
                  <th className="p-2.5 text-center">التقدير النهائي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentEntries.map((st, i) => (
                  <tr key={st.student || i} className="hover:bg-slate-50/80">
                    <td className="p-2.5 font-bold text-slate-400">{i + 1}</td>
                    <td className="p-2.5 font-bold text-slate-800">{st.studentName}</td>
                    <td className="p-2.5 font-mono text-slate-500">{st.studentCode}</td>
                    <td className="p-2.5 text-center font-bold text-slate-600 bg-slate-50">
                      {st.openingMemorizedParts !== undefined ? st.openingMemorizedParts : 0} ج
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-800 bg-emerald-50/50">
                      {st.currentMemorizedParts !== undefined ? st.currentMemorizedParts : (st.openingMemorizedParts || 0)} ج
                    </td>
                    <td className="p-2.5 text-center font-bold">
                      {((st.currentMemorizedParts || 0) - (st.openingMemorizedParts || 0)) > 0 ? (
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                          +{((st.currentMemorizedParts || 0) - (st.openingMemorizedParts || 0))} ج
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className={(st.absenceExcused + st.absenceUnexcused) > 0 ? 'text-red-600 font-bold' : 'text-slate-400'}>
                        {(st.absenceExcused || 0) + (st.absenceUnexcused || 0)} أيام
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {st.actualMemorization?.surah ? `${st.actualMemorization.surah} (${st.actualMemorization.pagesCount} ص)` : '—'}
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {st.actualRevision?.surah ? `${st.actualRevision.surah} (${st.actualRevision.pagesCount} ص)` : '—'}
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{st.testScores?.memorization ?? 45}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{st.testScores?.recitation ?? 20}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{st.testScores?.performance ?? 10}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{st.testScores?.lessons ?? 10}</td>
                    <td className="p-2.5 text-center font-bold text-slate-700">{st.testScores?.attendance ?? 10}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-800">{st.testScores?.behavior ?? 5}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-950 bg-emerald-50/50">
                      {st.totalScore || 100}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {st.finalRating || calculateRating(st.totalScore || 100)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {generalNotes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-bold text-slate-700 block mb-1">ملاحظات المعلم المرفوعة مع التقرير:</span>
              <p className="text-slate-600">{generalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE EDIT MODE FOR TEACHER ONLY */}
      {isTeacher && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              قائمة طلاب حلقتك ({studentEntries.length} طالب):
            </span>
            <span className="text-[11px] text-slate-400">انقر على بطاقة أي طالب لفتح تفاصيل الحفظ ودرجات الاختبار</span>
          </div>

          {studentEntries.map((entry, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={entry.student || index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                {/* Accordion Card Header */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{entry.studentName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{entry.studentCode}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      الافتتاحي: {entry.openingMemorizedParts !== undefined ? entry.openingMemorizedParts : 0} | الحالي: {entry.currentMemorizedParts !== undefined ? entry.currentMemorizedParts : (entry.openingMemorizedParts || 0)}
                      {((entry.currentMemorizedParts || 0) - (entry.openingMemorizedParts || 0)) > 0 && (
                        <span className="mr-1.5 text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded text-[10px]">
                          (+{((entry.currentMemorizedParts || 0) - (entry.openingMemorizedParts || 0))})
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      {entry.totalScore || 0} / 100
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold">
                      {entry.finalRating || calculateRating(entry.totalScore || 0)}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      (entry.absenceExcused + entry.absenceUnexcused) > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      غياب: {(entry.absenceExcused || 0) + (entry.absenceUnexcused || 0)}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details Form */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-4">
                    
                    {/* Universal Update: Opening Balance & Current Memorized Parts Progress */}
                    <div className="bg-emerald-50/90 p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-emerald-950">
                            مستوى الحفظ ومقدار التقدم عن الرصيد الافتتاحي:
                          </label>
                          <span className="text-[11px] bg-slate-200/90 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                            الافتتاحي: {entry.openingMemorizedParts !== undefined ? entry.openingMemorizedParts : 0} أجزاء
                          </span>
                          {((entry.currentMemorizedParts || 0) - (entry.openingMemorizedParts || 0)) > 0 && (
                            <span className="text-[11px] bg-emerald-700 text-white px-2 py-0.5 rounded-md font-bold shadow-xs">
                              +{((entry.currentMemorizedParts || 0) - (entry.openingMemorizedParts || 0))} جزء تقدم
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-1">
                          (الرصيد الافتتاحي ثابت من كشف تسجيل الطلاب، ويتم تحديث الحفظ الحالي ومقدار التقدم المحرز تلقائياً في ملف الطالب وبطاقته)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">الحفظ الحالي:</span>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={entry.currentMemorizedParts !== undefined ? entry.currentMemorizedParts : (entry.openingMemorizedParts || 0)}
                          onChange={(e) => updateStudentEntry(index, 'currentMemorizedParts', Number(e.target.value))}
                          className="w-20 px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-center font-bold text-emerald-950 text-sm focus:ring-2 focus:ring-emerald-500 shadow-xs"
                        />
                        <span className="text-xs font-bold text-emerald-900">أجزاء</span>
                      </div>
                    </div>

                    {/* 1. Absence Section */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 mb-2">أيام الغياب خلال الشهر:</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-slate-600">غياب بإذن:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustAbsence(index, 'absenceExcused', -1)}
                              className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                            >
                              -
                            </button>
                            <span className="font-bold text-sm text-slate-800 w-5 text-center">
                              {entry.absenceExcused || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustAbsence(index, 'absenceExcused', 1)}
                              className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <span className="text-xs text-slate-600">غياب بغير إذن:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => adjustAbsence(index, 'absenceUnexcused', -1)}
                              className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                            >
                              -
                            </button>
                            <span className="font-bold text-sm text-red-600 w-5 text-center">
                              {entry.absenceUnexcused || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustAbsence(index, 'absenceUnexcused', 1)}
                              className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Previous Progress & Memorization Plan */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                      <h5 className="text-xs font-bold text-emerald-900">خطة الحفظ والمنفذ الفعلي:</h5>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">السورة السابقة</label>
                          <input
                            type="text"
                            value={entry.previousSurah || ''}
                            onChange={(e) => updateStudentEntry(index, 'previousSurah', e.target.value)}
                            placeholder="النبأ"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">رقم الآية السابقة</label>
                          <input
                            type="text"
                            value={entry.previousAyah || ''}
                            onChange={(e) => updateStudentEntry(index, 'previousAyah', e.target.value)}
                            placeholder="40"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">السورة المتوقعة (الخطة)</label>
                          <input
                            type="text"
                            value={entry.planMemorization?.expectedSurah || ''}
                            onChange={(e) => updateStudentEntry(index, 'planMemorization.expectedSurah', e.target.value)}
                            placeholder="النازعات"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">آية الخطة</label>
                          <input
                            type="text"
                            value={entry.planMemorization?.ayah || ''}
                            onChange={(e) => updateStudentEntry(index, 'planMemorization.ayah', e.target.value)}
                            placeholder="46"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">صفحات الخطة</label>
                          <input
                            type="number"
                            value={entry.planMemorization?.pagesCount || 0}
                            onChange={(e) => updateStudentEntry(index, 'planMemorization.pagesCount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-emerald-800 font-semibold block mb-0.5">الحفظ المنفذ (سورة)</label>
                          <input
                            type="text"
                            value={entry.actualMemorization?.surah || ''}
                            onChange={(e) => updateStudentEntry(index, 'actualMemorization.surah', e.target.value)}
                            placeholder="النازعات"
                            className="w-full px-2 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-emerald-800 font-semibold block mb-0.5">آية المنفذ</label>
                          <input
                            type="text"
                            value={entry.actualMemorization?.ayah || ''}
                            onChange={(e) => updateStudentEntry(index, 'actualMemorization.ayah', e.target.value)}
                            placeholder="46"
                            className="w-full px-2 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-emerald-800 font-semibold block mb-0.5">صفحات الحفظ</label>
                          <input
                            type="number"
                            value={entry.actualMemorization?.pagesCount || 0}
                            onChange={(e) => updateStudentEntry(index, 'actualMemorization.pagesCount', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Revision Section */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-teal-900">المراجعة المنفذة والمنهج العلمي:</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">سورة المراجعة</label>
                          <input
                            type="text"
                            value={entry.actualRevision?.surah || ''}
                            onChange={(e) => updateStudentEntry(index, 'actualRevision.surah', e.target.value)}
                            placeholder="النبأ"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">عدد صفحات المراجعة</label>
                          <input
                            type="number"
                            value={entry.actualRevision?.pagesCount || 0}
                            onChange={(e) => updateStudentEntry(index, 'actualRevision.pagesCount', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">المنهج العلمي (الخطة)</label>
                          <input
                            type="text"
                            value={entry.scientificCurriculum?.plan || ''}
                            onChange={(e) => updateStudentEntry(index, 'scientificCurriculum.plan', e.target.value)}
                            placeholder="آداب طالب القرآن"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">المنهج العلمي (المنفذ)</label>
                          <input
                            type="text"
                            value={entry.scientificCurriculum?.actual || ''}
                            onChange={(e) => updateStudentEntry(index, 'scientificCurriculum.actual', e.target.value)}
                            placeholder="تم الشرح والتطبيق"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4. Monthly Test Scores (WITH BEHAVIOR & FINAL RATING) */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-amber-900">درجات الاختبار والتقييم الشهري:</h5>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            المجموع: {entry.totalScore || 0} / 100
                          </span>
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            التقدير: {entry.finalRating || calculateRating(entry.totalScore || 0)}
                          </span>
                        </div>
                      </div>

                      {/* 6 Score Categories matching the official Excel */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-xs">
                        <div>
                          <label className="text-[9px] text-slate-500 block font-semibold">الحفظ (45)</label>
                          <input
                            type="number"
                            max={45}
                            value={entry.testScores?.memorization || 0}
                            onChange={(e) => updateStudentEntry(index, 'testScores.memorization', Number(e.target.value))}
                            className="w-full px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block font-semibold">التلاوة (20)</label>
                          <input
                            type="number"
                            max={20}
                            value={entry.testScores?.recitation || 0}
                            onChange={(e) => updateStudentEntry(index, 'testScores.recitation', Number(e.target.value))}
                            className="w-full px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block font-semibold">الأداء (10)</label>
                          <input
                            type="number"
                            max={10}
                            value={entry.testScores?.performance || 0}
                            onChange={(e) => updateStudentEntry(index, 'testScores.performance', Number(e.target.value))}
                            className="w-full px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block font-semibold">الدروس (10)</label>
                          <input
                            type="number"
                            max={10}
                            value={entry.testScores?.lessons || 0}
                            onChange={(e) => updateStudentEntry(index, 'testScores.lessons', Number(e.target.value))}
                            className="w-full px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block font-semibold">الحضور (10)</label>
                          <input
                            type="number"
                            max={10}
                            value={entry.testScores?.attendance || 0}
                            onChange={(e) => updateStudentEntry(index, 'testScores.attendance', Number(e.target.value))}
                            className="w-full px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-emerald-800 block font-bold">السلوك (5)</label>
                          <input
                            type="number"
                            max={5}
                            value={entry.testScores?.behavior || 0}
                            onChange={(e) => updateStudentEntry(index, 'testScores.behavior', Number(e.target.value))}
                            className="w-full px-1 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-center font-bold text-xs text-emerald-950"
                          />
                        </div>
                      </div>

                      {/* Final Rating Selector */}
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5 font-bold">التقدير النهائي المعتمد:</label>
                          <select
                            value={entry.finalRating || calculateRating(entry.totalScore || 0)}
                            onChange={(e) => updateStudentEntry(index, 'finalRating', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-lg font-bold text-amber-900"
                          >
                            <option value="ممتاز">ممتاز (90 - 100)</option>
                            <option value="جيد جداً">جيد جداً (80 - 89)</option>
                            <option value="جيد">جيد (70 - 79)</option>
                            <option value="مقبول">مقبول (60 - 69)</option>
                            <option value="ضعيف">ضعيف (أقل من 60)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">ملاحظات المعلم الخاصة بالطالب:</label>
                          <input
                            type="text"
                            value={entry.notes || ''}
                            onChange={(e) => updateStudentEntry(index, 'notes', e.target.value)}
                            placeholder="طالب مجتهد، يحتاج عناية في أحكام التجويد..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {/* General Monthly Report Notes */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-700">ملاحظات المعلم العامة حول سير الحلقة هذا الشهر:</h4>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="اكتب أي ملاحظات أو تحديات تود رفعها للمشرف والإدارة..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveReport}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري حفظ التقرير...' : 'حفظ واعتماد التقرير الشهري'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY REPORTS ARCHIVE CARDS (TEACHER & EVERYONE) */}
      {teacherReports.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mt-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>أرشيف التقارير الشهرية المسجلة ({teacherReports.length} تقرير):</span>
          </h3>
          <p className="text-xs text-slate-500">
            يمكنك تحميل ملف الإكسل الرسمي أو تقرير PDF الفاخر لكل شهر، أو النقر على البطاقة لاستعراض تقرير كل طالب.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {teacherReports.map((rep) => {
              const isMonthOpened = openedArchiveMonth === rep._id;
              return (
                <div key={rep._id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 text-sm block">شهر: {rep.monthYear}</strong>
                      <span className="text-[11px] text-slate-500">حلقة: {rep.halaqah?.name} | المعلم: {rep.teacher?.fullName}</span>
                      <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                        عدد الطلاب المقيدين: {rep.studentEntries?.length || 0} طالب
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDownloadExcel(rep._id)}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="تنزيل إكسل بالقالب المعتمد"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>إكسل</span>
                      </button>

                      <button
                        onClick={() => openPdfPreview(rep)}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="تنزيل تقرير PDF الفاخر"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (isMonthOpened) {
                          setOpenedArchiveMonth(null);
                          setArchiveStudents([]);
                          setSelectedStudentDetail(null);
                        } else {
                          setOpenedArchiveMonth(rep._id);
                          setArchiveStudents(rep.studentEntries || []);
                          setSelectedStudentDetail(null);
                        }
                      }}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isMonthOpened ? 'إغلاق قائمة الطلاب' : 'عرض قائمة الطلاب وتقاريرهم'}</span>
                      {isMonthOpened ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* List of Students within this Archived Month */}
                  {isMonthOpened && (
                    <div className="pt-2 space-y-2">
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white overflow-hidden max-h-56 overflow-y-auto">
                        {archiveStudents.map((st, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => setSelectedStudentDetail(selectedStudentDetail?.student === st.student ? null : st)}
                            className="p-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-emerald-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-600 text-[10px] flex items-center justify-center">
                                {sIdx + 1}
                              </span>
                              <span className="font-bold text-slate-800">{st.studentName}</span>
                              <span className="text-[10px] font-mono text-slate-400">({st.studentCode})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded text-[10px]">
                                {st.currentMemorizedParts !== undefined ? st.currentMemorizedParts : '—'} أجزاء
                              </span>
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                {st.totalScore || 0}/100
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Selected Student Details Card */}
                      {selectedStudentDetail && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-2 text-xs">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <strong className="text-emerald-950 font-bold">تقرير: {selectedStudentDetail.studentName}</strong>
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                              التقدير: {selectedStudentDetail.finalRating || calculateRating(selectedStudentDetail.totalScore || 0)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>الغياب: <strong>{(selectedStudentDetail.absenceExcused || 0) + (selectedStudentDetail.absenceUnexcused || 0)} أيام</strong></div>
                            <div>الحفظ والتقدم: <strong>الافتتاحي: {selectedStudentDetail.openingMemorizedParts !== undefined ? selectedStudentDetail.openingMemorizedParts : 0} | الحالي: {selectedStudentDetail.currentMemorizedParts || 0} ج {((selectedStudentDetail.currentMemorizedParts || 0) - (selectedStudentDetail.openingMemorizedParts || 0)) > 0 ? `(+${(selectedStudentDetail.currentMemorizedParts || 0) - (selectedStudentDetail.openingMemorizedParts || 0)})` : ''}</strong></div>
                            <div>الحفظ المنفذ: <strong>{selectedStudentDetail.actualMemorization?.surah || '—'} ({selectedStudentDetail.actualMemorization?.pagesCount || 0} ص)</strong></div>
                            <div>المراجعة: <strong>{selectedStudentDetail.actualRevision?.surah || '—'} ({selectedStudentDetail.actualRevision?.pagesCount || 0} ص)</strong></div>
                          </div>
                          {selectedStudentDetail.notes && (
                            <p className="text-[10px] text-slate-500 pt-1">ملاحظة: {selectedStudentDetail.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PDF Modal Viewer */}
      {pdfModalOpen && (
        <PrintableMonthlyReport
          report={previewReport}
          halaqah={activeHalaqahObj}
          monthYear={monthYear}
          onClose={() => setPdfModalOpen(false)}
        />
      )}
    </div>
  );
}
