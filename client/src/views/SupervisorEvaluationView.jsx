import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PrintableSupervisorReport from '../components/PrintableSupervisorReport';
import { 
  Award, 
  Download, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Calendar,
  UserCheck,
  CheckSquare,
  FileText
} from 'lucide-react';

const ADMIN_CRITERIA = [
  { key: 'attendancePunctuality', label: 'الالتزام بدوام الحلقة (حضور - انصراف)', max: 5 },
  { key: 'dailyRecordActivation', label: 'تفعيل سجل الحلقات يومياً', max: 6 },
  { key: 'disciplineAndManagement', label: 'ضبط الحلقة وحسن إدارتها', max: 6 },
  { key: 'studentsRetention', label: 'انضباط الطلاب وعدم تسربهم من الحلقة', max: 6 },
  { key: 'teacherCompliance', label: 'تجاوب المعلم مع التوجيهات الإدارية', max: 6 },
  { key: 'timelyReporting', label: 'رفع التقارير والحوافظ والكشوفات في موعدها', max: 5 }
];

const SCIENTIFIC_CRITERIA = [
  { key: 'recitationMastery', label: 'التمكن والإتقان في الحفظ والتلاوة', max: 6 },
  { key: 'shariaKnowledge', label: 'الإلمام بالعلوم الشرعية', max: 5 },
  { key: 'continuousDevelopment', label: 'الحرص على التطور المستمر', max: 5 },
  { key: 'studentsAcademicLevel', label: 'المستوى العلمي لطلاب الحلقة', max: 5 },
  { key: 'tajweedRulesApplication', label: 'الإلمام بالأحكام التجويدية وتطبيقها', max: 6 },
  { key: 'planAchievement', label: 'إنجاز خطة الحفظ والمراجعة', max: 6 }
];

const PROFESSIONAL_CRITERIA = [
  { key: 'recitationCoverage', label: 'استيفاء التسميع لمعظم الطلاب', max: 6 },
  { key: 'dailyRevisionFocus', label: 'الاهتمام بالمراجعة اليومية', max: 6 },
  { key: 'individualReading', label: 'القراءة الفردية وتصحيح الأخطاء', max: 5 },
  { key: 'errorCorrection', label: 'اكتشاف الأخطاء وتصويبها', max: 5 },
  { key: 'meaningClarification', label: 'توضيح المعاني الغامضة للطلاب', max: 6 },
  { key: 'timeManagement', label: 'حسن إدارة وقت الحلقة', max: 5 }
];

export default function SupervisorEvaluationView({ defaultHalaqahId }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';

  const [halaqat, setHalaqat] = useState([]);
  const [selectedHalaqahId, setSelectedHalaqahId] = useState(defaultHalaqahId || '');
  const [monthYear, setMonthYear] = useState('2026-10');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'scientific' | 'professional' | 'notes'

  const [evaluationId, setEvaluationId] = useState(null);
  const [evalDoc, setEvalDoc] = useState(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const [adminScores, setAdminScores] = useState({
    attendancePunctuality: 5,
    dailyRecordActivation: 6,
    disciplineAndManagement: 6,
    studentsRetention: 6,
    teacherCompliance: 6,
    timelyReporting: 5
  });

  const [scientificScores, setScientificScores] = useState({
    recitationMastery: 6,
    shariaKnowledge: 5,
    continuousDevelopment: 5,
    studentsAcademicLevel: 5,
    tajweedRulesApplication: 6,
    planAchievement: 6
  });

  const [professionalScores, setProfessionalScores] = useState({
    recitationCoverage: 6,
    dailyRevisionFocus: 6,
    individualReading: 5,
    errorCorrection: 5,
    meaningClarification: 6,
    timeManagement: 5
  });

  const [positives, setPositives] = useState('');
  const [negatives, setNegatives] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState(user.fullName || '');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch accessible halaqat
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
          loadEvaluationForHalaqah(initId, monthYear);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHalaqat();
  }, []);

  // Fetch evaluation for selected halaqah & month
  const loadEvaluationForHalaqah = async (hId, mYear) => {
    if (!hId || !mYear) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.get(`/supervisor-evaluations?halaqahId=${hId}&monthYear=${mYear}`);
      if (res && res.length > 0) {
        const ev = res[0];
        setEvalDoc(ev);
        setEvaluationId(ev._id);
        if (ev.adminScores) setAdminScores(ev.adminScores);
        if (ev.scientificScores) setScientificScores(ev.scientificScores);
        if (ev.professionalScores) setProfessionalScores(ev.professionalScores);
        setPositives(ev.positives || '');
        setNegatives(ev.negatives || '');
        setRecommendations(ev.recommendations || '');
        setSupervisorSignature(ev.supervisorSignature || ev.supervisor?.fullName || user.fullName);
        if (ev.visitDate) setVisitDate(new Date(ev.visitDate).toISOString().split('T')[0]);
      } else {
        setEvalDoc(null);
        setEvaluationId(null);
        setPositives('');
        setNegatives('');
        setRecommendations('');
        if (isSupervisor) {
          setSupervisorSignature(user.fullName);
        }
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
    loadEvaluationForHalaqah(newId, monthYear);
  };

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setMonthYear(newMonth);
    loadEvaluationForHalaqah(selectedHalaqahId, newMonth);
  };

  // Totals calculations
  const adminTotal = Object.values(adminScores).reduce((a, b) => a + (Number(b) || 0), 0);
  const scientificTotal = Object.values(scientificScores).reduce((a, b) => a + (Number(b) || 0), 0);
  const professionalTotal = Object.values(professionalScores).reduce((a, b) => a + (Number(b) || 0), 0);
  const grandTotal = adminTotal + scientificTotal + professionalTotal;

  const handleSave = async () => {
    if (!isSupervisor) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.post('/supervisor-evaluations', {
        halaqahId: selectedHalaqahId,
        monthYear,
        visitDate,
        adminScores,
        scientificScores,
        professionalScores,
        positives,
        negatives,
        recommendations,
        supervisorSignature
      });
      setEvaluationId(res.evaluation._id);
      setEvalDoc(res.evaluation);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'فشل حفظ التقييم');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (evaluationId) {
      try {
        await api.downloadBlob(`/supervisor-evaluations/${evaluationId}/export-excel`, 'تقييم_المشرف.xlsx');
      } catch (err) {
        alert(err.message || 'فشل تنزيل ملف الإكسل');
      }
    } else {
      alert('لا يوجد تقرير معتمد لتصديره لهذا الشهر');
    }
  };

  const openPdfModal = () => {
    setPdfModalOpen(true);
  };

  const currentHalaqah = halaqat.find(h => h._id === selectedHalaqahId);

  return (
    <div className="space-y-4 pb-8 print:p-0 print:space-y-2">
      {/* Top Banner for Admin Mode */}
      {isAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center gap-2.5 text-xs font-semibold print:hidden">
          <Eye className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold">وضع الاستعراض والتصدير (المدير العام): </span>
            <span>استعراض تقييمات الزيارات الميدانية المعتمدة من المشرفين وتصديرها إكسل وPDF. التعبئة والاعتماد صلاحية خاصة بالمشرف الميداني فقط.</span>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-700" />
              <span>نموذج تقييم زيارة المشرف الميداني للحلقة</span>
            </h2>
            <p className="text-xs text-slate-500">
              تقييم شامل للحلقة بـ 100 درجة (إداري 34، علمي 33، مهني 33)
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {evaluationId && (
              <>
                <button
                  onClick={handleDownloadExcel}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="تصدير إكسل"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير إكسل</span>
                </button>
                <button
                  onClick={openPdfModal}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="تنزيل تقرير PDF"
                >
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>تنزيل تقرير PDF</span>
                </button>
              </>
            )}

            {isSupervisor && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ واعتماد التقييم'}</span>
              </button>
            )}
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in print:hidden">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <span>تم حفظ تقرير زيارة المشرف بنجاح!</span>
          </div>
        )}

        {/* Selectors and Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 print:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">الحلقة المستهدفة بالزيارة:</label>
            <select
              value={selectedHalaqahId}
              onChange={handleHalaqahChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
            >
              {halaqat.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">شهر التقرير:</label>
            <input
              type="month"
              value={monthYear}
              onChange={handleMonthChange}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">تاريخ الزيارة الفعلية:</label>
            {isAdmin ? (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                {evalDoc?.visitDate ? new Date(evalDoc.visitDate).toLocaleDateString('ar-EG') : 'لم تسجل بعد'}
              </div>
            ) : (
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
          <span>الحلقة: <strong className="text-slate-900">{currentHalaqah?.name || '—'}</strong></span>
          <span>•</span>
          <span>المعلم: <strong className="text-slate-900">{currentHalaqah?.teacher?.fullName || '—'}</strong></span>
          <span>•</span>
          <span>المشرف المسؤول: <strong className="text-slate-900">{evalDoc?.supervisor?.fullName || currentHalaqah?.supervisor?.fullName || '—'}</strong></span>
        </div>

        {/* Grand Total Score Bar */}
        <div className="p-3 bg-gradient-to-r from-emerald-800 to-teal-900 rounded-xl text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-300" />
            <div>
              <span className="text-[11px] text-emerald-200 block">إجمالي درجات تقييم الحلقة:</span>
              <span className="text-2xl font-bold font-serif text-amber-200">
                {evaluationId || isSupervisor ? grandTotal : 0} / 100
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="bg-white/10 px-2 py-1 rounded-md">إداري: {evaluationId || isSupervisor ? adminTotal : 0}/34</span>
            <span className="bg-white/10 px-2 py-1 rounded-md">علمي: {evaluationId || isSupervisor ? scientificTotal : 0}/33</span>
            <span className="bg-white/10 px-2 py-1 rounded-md">مهني: {evaluationId || isSupervisor ? professionalTotal : 0}/33</span>
          </div>
        </div>
      </div>

      {/* Notice if Admin and no evaluation exists */}
      {isAdmin && !evaluationId && !loading && (
        <div className="p-6 bg-white rounded-2xl border border-dashed border-amber-300 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">لم يتم رفع تقييم زيارة لهذه الحلقة لشهر ({monthYear}) بعد</h3>
          <p className="text-xs text-slate-500">يقوم المشرف الميداني المسؤول بزيارة الحلقة واعتماد التقييم الميداني من حسابه، وسيظهر هنا تلقائياً.</p>
        </div>
      )}

      {/* Tabs Switcher for Supervisor / Admin */}
      <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'admin' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          1. التقييم الإداري (34)
        </button>
        <button
          onClick={() => setActiveTab('scientific')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'scientific' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          2. التقييم العلمي (33)
        </button>
        <button
          onClick={() => setActiveTab('professional')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'professional' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          3. التقييم المهني (33)
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'notes' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          الملاحظات والتوصيات
        </button>
      </div>

      {/* Tab 1: Administrative Evaluation */}
      {(activeTab === 'admin' || window.matchMedia?.('print')?.matches) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">عناصر التقييم الإداري للحلقة:</h3>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
              المجموع الإداري: {evaluationId || isSupervisor ? adminTotal : 0} / 34
            </span>
          </div>

          <div className="space-y-2">
            {ADMIN_CRITERIA.map((item, idx) => (
              <div key={item.key} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                </div>
                
                {/* View-Only for Admin vs Editable for Supervisor */}
                {isAdmin ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs text-teal-800 min-w-[36px] text-center">
                      {evaluationId ? (adminScores[item.key] ?? '—') : '—'}
                    </span>
                    <span className="text-xs text-slate-400">/{item.max}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={item.max}
                      value={adminScores[item.key] ?? item.max}
                      onChange={(e) => setAdminScores({ ...adminScores, [item.key]: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-400">/{item.max}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Scientific Evaluation */}
      {(activeTab === 'scientific' || window.matchMedia?.('print')?.matches) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">عناصر التقييم العلمي للحلقة:</h3>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
              المجموع العلمي: {evaluationId || isSupervisor ? scientificTotal : 0} / 33
            </span>
          </div>

          <div className="space-y-2">
            {SCIENTIFIC_CRITERIA.map((item, idx) => (
              <div key={item.key} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                </div>

                {isAdmin ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs text-teal-800 min-w-[36px] text-center">
                      {evaluationId ? (scientificScores[item.key] ?? '—') : '—'}
                    </span>
                    <span className="text-xs text-slate-400">/{item.max}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={item.max}
                      value={scientificScores[item.key] ?? item.max}
                      onChange={(e) => setScientificScores({ ...scientificScores, [item.key]: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-400">/{item.max}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Professional Evaluation */}
      {(activeTab === 'professional' || window.matchMedia?.('print')?.matches) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">عناصر التقييم المهني لمعلم الحلقة:</h3>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
              المجموع المهني: {evaluationId || isSupervisor ? professionalTotal : 0} / 33
            </span>
          </div>

          <div className="space-y-2">
            {PROFESSIONAL_CRITERIA.map((item, idx) => (
              <div key={item.key} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{item.label}</span>
                </div>

                {isAdmin ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs text-teal-800 min-w-[36px] text-center">
                      {evaluationId ? (professionalScores[item.key] ?? '—') : '—'}
                    </span>
                    <span className="text-xs text-slate-400">/{item.max}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={item.max}
                      value={professionalScores[item.key] ?? item.max}
                      onChange={(e) => setProfessionalScores({ ...professionalScores, [item.key]: Number(e.target.value) })}
                      className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs focus:ring-2 focus:ring-teal-500"
                    />
                    <span className="text-xs text-slate-400">/{item.max}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Qualitative Notes & Recommendations */}
      {(activeTab === 'notes' || window.matchMedia?.('print')?.matches) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-bold text-emerald-800 mb-1">الإيجابيات الملحوظة:</label>
            {isAdmin ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap min-h-[50px]">
                {positives || 'لا توجد ملاحظات مدونة'}
              </div>
            ) : (
              <textarea
                rows={3}
                value={positives}
                onChange={(e) => setPositives(e.target.value)}
                placeholder="التزام المعلم بالحضور، حماس الطلاب في التسميع، تميز في أحكام التجويد..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-red-800 mb-1">السلبيات ونقاط القصور:</label>
            {isAdmin ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap min-h-[50px]">
                {negatives || 'لا توجد ملاحظات مدونة'}
              </div>
            ) : (
              <textarea
                rows={3}
                value={negatives}
                onChange={(e) => setNegatives(e.target.value)}
                placeholder="تسرب بعض الطلاب قبل نهاية وقت الحلقة، عدم تفعيل السجل يومياً..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-800 mb-1">التوصيات والمقترحات للإدارة والمعلم:</label>
            {isAdmin ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap min-h-[50px]">
                {recommendations || 'لا توجد توصيات مدونة'}
              </div>
            ) : (
              <textarea
                rows={3}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="تنظيم مسابقة تشجيعية، تكريم الطلاب الملتزمين، توفير كراسات متابعة إضافية..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المشرف وتوقيعه:</label>
            {isAdmin ? (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                {supervisorSignature || '—'}
              </div>
            ) : (
              <input
                type="text"
                value={supervisorSignature}
                onChange={(e) => setSupervisorSignature(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            )}
          </div>
        </div>
      )}

      {/* Save Button for Supervisor Only */}
      {isSupervisor && (
        <div className="flex justify-end print:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ واعتماد تقرير الزيارة (100 درجة)'}</span>
          </button>
        </div>
      )}

      {/* PDF Modal */}
      {pdfModalOpen && (
        <PrintableSupervisorReport
          evaluation={evalDoc || {
            totalScore: grandTotal,
            adminScores,
            adminTotal,
            scientificScores,
            scientificTotal,
            professionalScores,
            professionalTotal,
            positives,
            negatives,
            recommendations,
            supervisorSignature,
            visitDate
          }}
          halaqah={currentHalaqah}
          monthYear={monthYear}
          onClose={() => setPdfModalOpen(false)}
        />
      )}
    </div>
  );
}