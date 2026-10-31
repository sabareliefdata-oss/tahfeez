import React, { useRef } from 'react';
import { exportElementToPdf } from '../utils/pdfExport';
import { Download, Award, X } from 'lucide-react';

export default function PrintableSupervisorReport({ evaluation, halaqah, monthYear, onClose }) {
  const printRef = useRef(null);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const safeName = halaqah?.name ? `تقييم_مشرف_${halaqah.name}_${monthYear}.pdf` : `supervisor_eval_${monthYear}.pdf`;
    await exportElementToPdf(printRef.current, safeName, 'portrait');
  };

  const adminScores = evaluation?.adminScores || {};
  const scientificScores = evaluation?.scientificScores || {};
  const professionalScores = evaluation?.professionalScores || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Controls Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-sm sm:text-base">معاينة تقرير زيارة المشرف الميداني الرسمي</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-teal-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
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
            style={{ width: '100%', maxWidth: '850px', direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}
          >
            {/* Header Banner */}
            <div className="border-b-2 border-teal-800 pb-3 mb-4 text-center">
              <p className="text-xs text-teal-800 font-bold mb-1">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
              <h1 className="text-xl font-extrabold text-slate-900 font-serif">مشروع حلقات تحفيظ القرآن الكريم</h1>
              <h2 className="text-sm font-bold text-teal-800 mt-0.5">
                استمارة تقييم ومتابعة أداء الحلقة الميداني (100 درجة) — شهر: {monthYear}
              </h2>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs bg-teal-50/70 p-2.5 rounded-lg border border-teal-200 font-semibold text-slate-700">
                <div>الحلقة: <strong className="text-teal-950">{halaqah?.name || '—'}</strong></div>
                <div>المعلم: <strong className="text-teal-950">{halaqah?.teacher?.fullName || evaluation?.teacher?.fullName || '—'}</strong></div>
                <div>المشرف الميداني: <strong className="text-teal-950">{evaluation?.supervisorSignature || halaqah?.supervisor?.fullName || '—'}</strong></div>
              </div>

              {/* Total Score Banner */}
              <div className="mt-3 p-3 bg-gradient-to-r from-teal-800 to-emerald-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-200 block">إجمالي درجات تقييم الحلقة:</span>
                  <span className="text-2xl font-bold font-serif text-amber-200">{evaluation?.totalScore || 0} / 100</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="bg-white/10 px-2.5 py-1 rounded-md">إداري: {evaluation?.adminTotal || 0}/34</span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-md">علمي: {evaluation?.scientificTotal || 0}/33</span>
                  <span className="bg-white/10 px-2.5 py-1 rounded-md">مهني: {evaluation?.professionalTotal || 0}/33</span>
                </div>
              </div>
            </div>

            {/* Section 1: Admin */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-teal-900 bg-teal-50 p-1.5 rounded-md border-r-4 border-teal-700 mb-2">
                1. التقييم الإداري للحلقة (المجموع: {evaluation?.adminTotal || 0} / 34)
              </h4>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5 text-center w-8">م</th>
                    <th className="border border-slate-300 p-1.5 text-right">عنصر التقييم</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">الدرجة العظمى</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">الدرجة الممنوحة</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'الالتزام بدوام الحلقة (حضور - انصراف)', max: 5, val: adminScores.attendancePunctuality },
                    { label: 'تفعيل سجل الحلقات يومياً', max: 6, val: adminScores.dailyRecordActivation },
                    { label: 'ضبط الحلقة وحسن إدارتها', max: 6, val: adminScores.disciplineAndManagement },
                    { label: 'انضباط الطلاب وعدم تسربهم من الحلقة', max: 6, val: adminScores.studentsRetention },
                    { label: 'تجاوب المعلم مع التوجيهات الإدارية', max: 6, val: adminScores.teacherCompliance },
                    { label: 'رفع التقارير والحوافظ والكشوفات في موعدها', max: 5, val: adminScores.timelyReporting }
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-1 text-center font-bold">{i + 1}</td>
                      <td className="border border-slate-300 p-1">{row.label}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{row.max}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-teal-800">{row.val ?? row.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 2: Scientific */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-teal-900 bg-teal-50 p-1.5 rounded-md border-r-4 border-teal-700 mb-2">
                2. التقييم العلمي للحلقة (المجموع: {evaluation?.scientificTotal || 0} / 33)
              </h4>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5 text-center w-8">م</th>
                    <th className="border border-slate-300 p-1.5 text-right">عنصر التقييم</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">الدرجة العظمى</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">الدرجة الممنوحة</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'التمكن والإتقان في الحفظ والتلاوة', max: 6, val: scientificScores.recitationMastery },
                    { label: 'الإلمام بالعلوم الشرعية', max: 5, val: scientificScores.shariaKnowledge },
                    { label: 'الحرص على التطور المستمر', max: 5, val: scientificScores.continuousDevelopment },
                    { label: 'المستوى العلمي لطلاب الحلقة', max: 5, val: scientificScores.studentsAcademicLevel },
                    { label: 'الإلمام بالأحكام التجويدية وتطبيقها', max: 6, val: scientificScores.tajweedRulesApplication },
                    { label: 'إنجاز خطة الحفظ والمراجعة', max: 6, val: scientificScores.planAchievement }
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-1 text-center font-bold">{i + 1}</td>
                      <td className="border border-slate-300 p-1">{row.label}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{row.max}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-teal-800">{row.val ?? row.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 3: Professional */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-teal-900 bg-teal-50 p-1.5 rounded-md border-r-4 border-teal-700 mb-2">
                3. التقييم المهني لمعلم الحلقة (المجموع: {evaluation?.professionalTotal || 0} / 33)
              </h4>
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-300 p-1.5 text-center w-8">م</th>
                    <th className="border border-slate-300 p-1.5 text-right">عنصر التقييم</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">الدرجة العظمى</th>
                    <th className="border border-slate-300 p-1.5 text-center w-24">الدرجة الممنوحة</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'استيفاء التسميع لمعظم الطلاب', max: 6, val: professionalScores.recitationCoverage },
                    { label: 'الاهتمام بالمراجعة اليومية', max: 6, val: professionalScores.dailyRevisionFocus },
                    { label: 'القراءة الفردية وتصحيح الأخطاء', max: 5, val: professionalScores.individualReading },
                    { label: 'اكتشاف الأخطاء وتصويبها', max: 5, val: professionalScores.errorCorrection },
                    { label: 'توضيح المعاني الغامضة للطلاب', max: 6, val: professionalScores.meaningClarification },
                    { label: 'حسن إدارة وقت الحلقة', max: 5, val: professionalScores.timeManagement }
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 p-1 text-center font-bold">{i + 1}</td>
                      <td className="border border-slate-300 p-1">{row.label}</td>
                      <td className="border border-slate-300 p-1 text-center font-semibold">{row.max}</td>
                      <td className="border border-slate-300 p-1 text-center font-bold text-teal-800">{row.val ?? row.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Qualitative Notes */}
            <div className="space-y-2 text-xs border-t border-slate-200 pt-3">
              <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <strong className="text-emerald-900 block mb-0.5">الإيجابيات الملحوظة:</strong>
                <p className="text-slate-700">{evaluation?.positives || 'لا توجد ملاحظات مدونة'}</p>
              </div>
              <div className="p-2 bg-red-50/70 border border-red-200 rounded-lg">
                <strong className="text-red-900 block mb-0.5">السلبيات ونقاط القصور:</strong>
                <p className="text-slate-700">{evaluation?.negatives || 'لا توجد ملاحظات مدونة'}</p>
              </div>
              <div className="p-2 bg-teal-50/70 border border-teal-200 rounded-lg">
                <strong className="text-teal-900 block mb-0.5">التوصيات والمقترحات للإدارة والمعلم:</strong>
                <p className="text-slate-700">{evaluation?.recommendations || 'لا توجد توصيات مدونة'}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-xs font-semibold px-4">
              <div>
                <span>اسم المشرف الميداني المعتمد: </span>
                <strong className="text-slate-900">{evaluation?.supervisorSignature || halaqah?.supervisor?.fullName || '....................'}</strong>
              </div>
              <div>
                <span>تاريخ الزيارة: </span>
                <strong className="text-slate-900">{evaluation?.visitDate ? new Date(evaluation.visitDate).toLocaleDateString('ar-EG') : '....................'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
