import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  FileSpreadsheet, 
  Download, 
  Save, 
  CheckCircle, 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  Video, 
  MessageSquare, 
  HeartHandshake, 
  Award,
  Eye,
  X
} from 'lucide-react';

export default function AnnualReportView({ defaultHalaqahId }) {
  const { user } = useAuth();
  const isTeacher = user.role === 'teacher';

  const [halaqat, setHalaqat] = useState([]);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState(defaultHalaqahId || '');
  const [year, setYear] = useState('2026');

  const [reportData, setReportData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Modal for printable single student certificate/card for donor
  const [certificateStudent, setCertificateStudent] = useState(null);

  const ratingOptions = ['ممتاز', 'جيد جدا', 'جيد', 'مقبول', 'ضعيف'];

  useEffect(() => {
    const fetchHalaqat = async () => {
      try {
        const res = await api.get('/halaqat');
        setHalaqat(res);
        let initId = selectedHalaqahId;
        if (!initId && res.length > 0) {
          initId = res[0]._id;
          setSelectedHalaqahId(initId);
        }
        if (initId) {
          loadAnnualDataForHalaqah(initId, year);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHalaqat();
  }, []);

  const loadAnnualDataForHalaqah = async (hId, y) => {
    if (!hId || !y) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.get(`/annual-reports/halaqah/${hId}/year/${y}`);
      setReportData(res);
      setRows(res.rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleHalaqahChange = (e) => {
    const newId = e.target.value;
    setSelectedHalaqahId(newId);
    loadAnnualDataForHalaqah(newId, year);
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    loadAnnualDataForHalaqah(selectedHalaqahId, newYear);
  };

  const updateRow = (index, field, value) => {
    if (!isTeacher) return;
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!isTeacher) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.post('/annual-reports/bulk-save', {
        halaqahId: selectedHalaqahId,
        year,
        rows
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      loadAnnualDataForHalaqah(selectedHalaqahId, year);
    } catch (err) {
      alert(err.message || 'فشل حفظ التقرير السنوي');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedHalaqahId || !year) return;
    try {
      await api.downloadBlob(`/annual-reports/export-excel/${selectedHalaqahId}/${year}`, 'التقرير_السنوي.xlsx');
    } catch (err) {
      alert(err.message || 'فشل تنزيل التقرير السنوي');
    }
  };

  const openCertificate = (row) => {
    setCertificateStudent(row);
  };

  const activeHalaqah = halaqat.find(h => h._id === selectedHalaqahId);

  return (
    <div className="space-y-4 pb-8">
      {/* Top Banner and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
              <h2 className="text-lg font-bold text-slate-800">
                التقرير السنوي لطلاب الحلقة (قالب الممول والداعم)
              </h2>
              {!isTeacher && (
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>وضع الاستعراض والتحميل فقط</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeHalaqah ? `حلقة: ${activeHalaqah.name} — المعلم: ${activeHalaqah.teacher?.fullName || '—'}` : 'اختر الحلقة'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>تصدير إكسل للممول</span>
            </button>

            {isTeacher && (
              <button
                onClick={handleSave}
                disabled={saving || rows.length === 0}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التقرير السنوي'}</span>
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ التقرير السنوي للحلقة بنجاح، ومطابقته التامة مع قالب الممول!</span>
          </div>
        )}

        {/* Halaqah & Year Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">اختر الحلقة:</label>
            <select
              value={selectedHalaqahId}
              onChange={handleHalaqahChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {halaqat.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">السنة المستهدفة:</label>
            <select
              value={year}
              onChange={handleYearChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="2026">2026م</option>
              <option value="2025">2025م</option>
              <option value="2027">2027م</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW-ONLY MODE FOR ADMIN & SUPERVISOR */}
      {!isTeacher && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">
              بيانات التقرير السنوي لحلقة {activeHalaqah?.name} لعام {year}م ({rows.length} طالب):
            </h3>
            <span className="text-xs text-slate-500">جاهز للتصدير كملف إكسل مطابق لقالب الداعمين</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-2.5">م</th>
                  <th className="p-2.5">اسم الطالب</th>
                  <th className="p-2.5">الكود</th>
                  <th className="p-2.5">الأجزاء</th>
                  <th className="p-2.5">الحضور</th>
                  <th className="p-2.5">المشاركة</th>
                  <th className="p-2.5">التجويد</th>
                  <th className="p-2.5">المنهج</th>
                  <th className="p-2.5">الإجمالي</th>
                  <th className="p-2.5">رسالة الطالب</th>
                  <th className="p-2.5">فيديو التلاوة</th>
                  <th className="p-2.5 text-center">بطاقة الداعم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={row.studentId || i} className="hover:bg-slate-50/80">
                    <td className="p-2.5 font-bold text-slate-400">{i + 1}</td>
                    <td className="p-2.5 font-bold text-slate-800">{row.fullName}</td>
                    <td className="p-2.5 font-mono text-slate-500">{row.code}</td>
                    <td className="p-2.5 font-bold text-amber-800">{row.memorizedParts} أجزاء</td>
                    <td className="p-2.5 text-slate-700">{row.attendanceRating}</td>
                    <td className="p-2.5 text-slate-700">{row.participationRating}</td>
                    <td className="p-2.5 text-slate-700">{row.tajweedRating}</td>
                    <td className="p-2.5 text-slate-700">{row.curriculumRating}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {row.overallRating}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 max-w-[200px] truncate" title={row.studentMessage}>
                      {row.studentMessage || '—'}
                    </td>
                    <td className="p-2.5">
                      {row.videoUrl ? (
                        <a href={row.videoUrl} target="_blank" rel="noreferrer" className="text-purple-700 font-bold underline">
                          رابط الفيديو
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => openCertificate(row)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>معاينة A4</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERACTIVE FORM FOR TEACHER ONLY */}
      {isTeacher && (
        <div className="space-y-3">
          {rows.map((row, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={row.studentId || index}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                      {row.serial}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{row.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">الكود: {row.code}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      {row.memorizedParts} أجزاء
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      {row.overallRating || 'ممتاز'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Form Sections */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-4">
                    
                    {/* القسم الأول : بيانات الطالب الأساسية */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-emerald-900">
                          القسم الأول : بيانات الطالب الأساسية (مسحوبة تلقائياً من النظام)
                        </span>
                        <button
                          type="button"
                          onClick={() => openCertificate(row)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>معاينة وطباعة بطاقة الداعم</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">تاريخ الميلاد:</span>
                          <span className="font-semibold">{row.birthYear || '—'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">الجنس / السكن:</span>
                          <span className="font-semibold">{row.gender} / {row.housingType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ولي الأمر:</span>
                          <span className="font-semibold">{row.guardianName} ({row.guardianRelation})</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">العنوان:</span>
                          <span className="font-semibold truncate block">{row.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* القسم الثاني : عدد الأجزاء والتقييمات */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                      <h5 className="text-xs font-bold text-amber-900">
                        القسم الثاني : عدد الأجزاء والتقييمات السنوية:
                      </h5>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">عدد الأجزاء (رقم)</label>
                          <input
                            type="number"
                            value={row.memorizedParts}
                            onChange={(e) => updateRow(index, 'memorizedParts', Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">تقييم الحضور</label>
                          <select
                            value={row.attendanceRating}
                            onChange={(e) => updateRow(index, 'attendanceRating', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            {ratingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">تقييم المشاركة</label>
                          <select
                            value={row.participationRating}
                            onChange={(e) => updateRow(index, 'participationRating', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            {ratingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">تقييم التجويد</label>
                          <select
                            value={row.tajweedRating}
                            onChange={(e) => updateRow(index, 'tajweedRating', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            {ratingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">تقييم المنهج</label>
                          <select
                            value={row.curriculumRating}
                            onChange={(e) => updateRow(index, 'curriculumRating', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          >
                            {ratingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-amber-800 font-bold block mb-1">التقدير الإجمالي</label>
                          <select
                            value={row.overallRating}
                            onChange={(e) => updateRow(index, 'overallRating', e.target.value)}
                            className="w-full px-2 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-900"
                          >
                            {ratingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* القسم الثالث : رسائل المدرس والطالب والأثر ورابط الفيديو */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                      <h5 className="text-xs font-bold text-teal-900">
                        القسم الثالث : رسائل المدرس والطالب وأثر المشروع (موجهة للداعم والممول):
                      </h5>

                      <div>
                        <label className="text-[10px] text-slate-700 font-bold flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                          <span>رسالة الطالب التي في الورقة اليدوية (تكتب كما هي):</span>
                        </label>
                        <textarea
                          rows={2}
                          value={row.studentMessage}
                          onChange={(e) => updateRow(index, 'studentMessage', e.target.value)}
                          placeholder="أشكر القائمين على كفالة هذه الحلقة وجزاكم الله خيراً..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-700 font-bold flex items-center gap-1 mb-1">
                          <Award className="w-3.5 h-3.5 text-teal-700" />
                          <span>رسالة المدرس عن الطالب وانطباعه:</span>
                        </label>
                        <textarea
                          rows={2}
                          value={row.teacherMessage}
                          onChange={(e) => updateRow(index, 'teacherMessage', e.target.value)}
                          placeholder="طالب متميز ومثابر، حريص على المراجعة والتجويد وأخلاقه عالية..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-700 font-bold flex items-center gap-1 mb-1">
                          <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                          <span>كيف ساعد المشروع الطالب (بشقيه التعليمي والمالي):</span>
                        </label>
                        <textarea
                          rows={2}
                          value={row.projectImpact}
                          onChange={(e) => updateRow(index, 'projectImpact', e.target.value)}
                          placeholder="وفّر المشروع بيئة محفزة وقريبة للمسجد وكراسات الحفظ..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-700 font-bold flex items-center gap-1 mb-1">
                          <Video className="w-3.5 h-3.5 text-purple-700" />
                          <span>رابط فيديو تلاوة الطالب (YouTube أو Google Drive):</span>
                        </label>
                        <input
                          type="url"
                          value={row.videoUrl}
                          onChange={(e) => updateRow(index, 'videoUrl', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 text-left font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ واعتماد التقرير السنوي لكامل الحلقة'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Printable Single Student Certificate / Card Modal */}
      {certificateStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="no-print flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-800">بطاقة إنجاز الطالب السنوية للداعم</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة A4</span>
                </button>
                <button
                  onClick={() => setCertificateStudent(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body with Islamic Aesthetic */}
            <div className="p-6 border-4 border-double border-emerald-800 rounded-2xl bg-gradient-to-b from-amber-50/20 via-white to-emerald-50/20 mt-4 text-slate-800 space-y-5">
              
              <div className="text-center space-y-1 border-b border-emerald-100 pb-4">
                <p className="text-xs text-emerald-800 font-serif font-bold">بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ</p>
                <h3 className="text-xl font-bold font-serif text-emerald-950">تقرير إنجاز الطالب السنوي الموجه للداعم الكريم</h3>
                <p className="text-xs text-amber-800 font-medium">مشروع حلقات تحفيظ القرآن الكريم — لعام {year}م</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500">اسم الطالب:</span>
                  <span className="font-bold text-slate-900 mr-1">{certificateStudent.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500">كود الطالب:</span>
                  <span className="font-bold font-mono mr-1">{certificateStudent.code}</span>
                </div>
                <div>
                  <span className="text-slate-500">اسم الحلقة:</span>
                  <span className="font-bold text-emerald-900 mr-1">{certificateStudent.halaqahName}</span>
                </div>
                <div>
                  <span className="text-slate-500">معلم الحلقة:</span>
                  <span className="font-bold mr-1">{certificateStudent.teacherName}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                <div className="flex items-center justify-around">
                  <div>
                    <span className="text-xs text-amber-800 block">إجمالي ما يحفظه الطالب</span>
                    <span className="text-2xl font-bold text-emerald-950 font-serif">{certificateStudent.memorizedParts} أجزاء</span>
                  </div>
                  <div>
                    <span className="text-xs text-amber-800 block">التقدير العام</span>
                    <span className="text-xl font-bold text-amber-900 font-serif">{certificateStudent.overallRating}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-amber-200/60 text-[11px] text-slate-700 font-semibold">
                  <span>الحضور: {certificateStudent.attendanceRating}</span>
                  <span>المشاركة: {certificateStudent.participationRating}</span>
                  <span>التجويد: {certificateStudent.tajweedRating}</span>
                  <span>المنهج: {certificateStudent.curriculumRating}</span>
                </div>
              </div>

              {certificateStudent.studentMessage && (
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-emerald-900">رسالة الطالب للداعم الكريم:</h5>
                  <p className="p-3 bg-slate-50 border-r-4 border-emerald-600 rounded-lg text-xs italic leading-relaxed text-slate-700">
                    "{certificateStudent.studentMessage}"
                  </p>
                </div>
              )}

              {certificateStudent.teacherMessage && (
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-teal-900">شهادة معلم الحلقة عن الطالب:</h5>
                  <p className="p-3 bg-slate-50 border-r-4 border-teal-600 rounded-lg text-xs leading-relaxed text-slate-700">
                    "{certificateStudent.teacherMessage}"
                  </p>
                </div>
              )}

              {certificateStudent.projectImpact && (
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-amber-900">أثر دعمكم المبارك على مسيرة الطالب:</h5>
                  <p className="p-3 bg-slate-50 border-r-4 border-amber-600 rounded-lg text-xs leading-relaxed text-slate-700">
                    "{certificateStudent.projectImpact}"
                  </p>
                </div>
              )}

              {certificateStudent.videoUrl && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-700" />
                    <span>رابط تلاوة الطالب بالفيديو:</span>
                  </span>
                  <a
                    href={certificateStudent.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 font-bold underline font-mono text-[11px]"
                  >
                    فتح رابط الفيديو
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                <div>ختم وتوقيع المعلم: .....................</div>
                <div>اعتماد إدارة الحلقات: .....................</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
