import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StudentProgressModal from '../components/StudentProgressModal';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  BookOpen, 
  ArrowRightLeft, 
  Edit, 
  Trash2, 
  MapPin, 
  UserCheck, 
  Power,
  Printer,
  FileText,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function StudentsView() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHalaqah, setSelectedHalaqah] = useState('');
  const [housingFilter, setHousingFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [targetHalaqahId, setTargetHalaqahId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [reportModalStudent, setReportModalStudent] = useState(null);

  // Form data for adding/editing student
  const [formData, setFormData] = useState({
    fullName: '',
    code: '',
    halaqah: '',
    birthYear: '',
    gender: 'ذكر',
    housingType: 'إيجار',
    address: 'تعز',
    guardianName: '',
    guardianRelation: 'أب',
    languages: 'العربية',
    hobbies: '',
    openingMemorizedParts: 0,
    memorizedParts: 0,
    notes: ''
  });

  const fetchHalaqat = async () => {
    try {
      const res = await api.get('/halaqat');
      setHalaqat(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedHalaqah) queryParams.append('halaqahId', selectedHalaqah);
      if (housingFilter) queryParams.append('housingType', housingFilter);
      if (genderFilter) queryParams.append('gender', genderFilter);
      queryParams.append('limit', '450');

      const res = await api.get(`/students?${queryParams.toString()}`);
      setStudents(res.students || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHalaqat();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedHalaqah, housingFilter, genderFilter]);

  const openAddModal = (st = null) => {
    if (st) {
      setSelectedStudent(st);
      setFormData({
        fullName: st.fullName,
        code: st.code,
        halaqah: st.halaqah?._id || st.halaqah,
        birthYear: st.birthYear || '',
        gender: st.gender || 'ذكر',
        housingType: st.housingType || 'إيجار',
        address: st.address || '',
        guardianName: st.guardianName || '',
        guardianRelation: st.guardianRelation || 'أب',
        languages: st.languages || 'العربية',
        hobbies: st.hobbies || '',
        openingMemorizedParts: st.openingMemorizedParts !== undefined ? st.openingMemorizedParts : 0,
        memorizedParts: st.memorizedParts !== undefined ? st.memorizedParts : (st.openingMemorizedParts || 0),
        notes: st.notes || ''
      });
    } else {
      setSelectedStudent(null);
      setFormData({
        fullName: '',
        code: '',
        halaqah: halaqat[0]?._id || '',
        birthYear: '2013',
        gender: 'ذكر',
        housingType: 'إيجار',
        address: 'تعز - المظفر',
        guardianName: '',
        guardianRelation: 'أب',
        languages: 'العربية',
        hobbies: '',
        openingMemorizedParts: 0,
        memorizedParts: 0,
        notes: ''
      });
    }
    setAddModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (selectedStudent) {
        await api.put(`/students/${selectedStudent._id}`, formData);
      } else {
        await api.post('/students', formData);
      }
      setAddModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const openTransferModal = (st) => {
    setSelectedStudent(st);
    setTargetHalaqahId('');
    setTransferReason('');
    setTransferModalOpen(true);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!targetHalaqahId) {
      alert('يرجى اختيار الحلقة المراد النقل إليها');
      return;
    }
    try {
      await api.put(`/students/${selectedStudent._id}/transfer`, {
        targetHalaqahId,
        reason: transferReason
      });
      setTransferModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطالب "${name}"؟`)) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/students/${id}/toggle-status`);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'فشل تغيير حالة الطالب');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>سجل الطلاب ({totalCount})</span>
          </h2>
          <p className="text-xs text-slate-500">
            {user.role === 'admin' ? 'إدارة ومتابعة الطلاب وحلقاتهم وبيانات أولياء الأمور' : 'استعراض بيانات طلاب حلقتك ومتابعة تفاصيلهم'}
          </p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الطالب، الكود (HF...)، ولي الأمر، الحي..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* Filter dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={selectedHalaqah}
            onChange={(e) => setSelectedHalaqah(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">كل الحلقات</option>
            {halaqat.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>

          <select
            value={housingFilter}
            onChange={(e) => setHousingFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">نوع السكن (الكل)</option>
            <option value="إيجار">إيجار</option>
            <option value="ملك">ملك</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">الجنس (الكل)</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>

          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedHalaqah('');
                setHousingFilter('');
                setGenderFilter('');
              }}
              className="text-xs text-slate-400 hover:text-red-600 font-semibold cursor-pointer"
            >
              إعادة الضبط
            </button>
          </div>
        </div>
      </div>

      {/* Students Mobile-First List / Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل الطلاب...</div>
      ) : students.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          لا يوجد طلاب مطابقون لمعايير البحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((st) => (
            <div
              key={st._id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-3.5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded-md font-bold">
                      {st.code}
                    </span>
                    <span className="text-[10px] text-slate-400">مواليد {st.birthYear || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-[11px] font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{st.memorizedParts !== undefined ? st.memorizedParts : 0} أجزاء</span>
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-800 mt-1.5">{st.fullName}</h3>
                
                <p className="text-xs text-emerald-800 font-medium mt-1">
                  حلقة: {st.halaqah?.name || '—'}
                </p>

                {/* Quran Memorization Balance & Progress Indicator */}
                <div className="mt-2.5 p-2 bg-slate-50/90 rounded-xl border border-slate-200/70 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">الافتتاحي</span>
                    <span className="font-bold text-slate-700 text-xs">{st.openingMemorizedParts !== undefined ? st.openingMemorizedParts : 0} ج</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">الحالي</span>
                    <span className="font-bold text-emerald-800 text-xs">{st.memorizedParts !== undefined ? st.memorizedParts : 0} ج</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">التقدم المحرز</span>
                    {((st.memorizedParts || 0) - (st.openingMemorizedParts || 0)) > 0 ? (
                      <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px] inline-block">
                        +{((st.memorizedParts || 0) - (st.openingMemorizedParts || 0))} ج
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-400 text-xs">0</span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ولي الأمر:</span>
                    <span className="font-semibold truncate max-w-[170px]">
                      {st.guardianName} ({st.guardianRelation})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">العنوان:</span>
                    <span className="truncate max-w-[170px]">{st.address}</span>
                  </div>
                  {st.hobbies && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">الهوايات:</span>
                      <span className="text-slate-500 truncate max-w-[170px]">{st.hobbies}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-500">
                  السكن: {st.housingType}
                </span>

                <div className="flex items-center gap-1">
                  {/* Print / View Student Report Button */}
                  <button
                    onClick={() => setReportModalStudent(st)}
                    title="طباعة / استخراج تقرير مسار الطالب"
                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>تقرير الطالب</span>
                  </button>

                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(st._id)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ${
                          st.status === 'inactive'
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={st.status === 'inactive' ? 'تفعيل الطالب (موقوف حالياً)' : 'إيقاف مؤقت للطالب'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openTransferModal(st)}
                        title="نقل الطالب إلى حلقة أخرى"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openAddModal(st)}
                        title="تعديل بيانات الطالب"
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(st._id, st.fullName)}
                        title="حذف الطالب"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {selectedStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الطالب الرباعي *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="محمد أحمد عبد الرحمن سعيد"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الكود (اختياري)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="HF10840"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الحلقة *</label>
                  <select
                    required
                    value={formData.halaqah}
                    onChange={(e) => setFormData({ ...formData, halaqah: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر الحلقة --</option>
                    {halaqat.map(h => (
                      <option key={h._id} value={h._id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سنة الميلاد</label>
                  <input
                    type="text"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    placeholder="2013"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الجنس</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الافتتاحي للأجزاء</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.openingMemorizedParts}
                    onChange={(e) => setFormData({ ...formData, openingMemorizedParts: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الحفظ الحالي (أجزاء)</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.memorizedParts}
                    onChange={(e) => setFormData({ ...formData, memorizedParts: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="أحمد عبد الرحمن"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">صلة القرابة</label>
                  <input
                    type="text"
                    value={formData.guardianRelation}
                    onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                    placeholder="أب / أم / أخ"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نوع السكن</label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => setFormData({ ...formData, housingType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="إيجار">إيجار</option>
                    <option value="ملك">ملك</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">العنوان / المنطقة</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="تعز - المظفر"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الهوايات والاهتمامات</label>
                <input
                  type="text"
                  value={formData.hobbies}
                  onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                  placeholder="حفظ القرآن، الإنشاد، الخط العربي..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ بيانات الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-1.5">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <span>نقل الطالب بين الحلقات</span>
              </h3>
              <button onClick={() => setTransferModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="mt-4 space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-xs text-emerald-800 font-bold">{selectedStudent?.fullName}</p>
                <p className="text-[11px] text-emerald-700">الحلقة الحالية: {selectedStudent?.halaqah?.name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الحلقة المراد النقل إليها *</label>
                <select
                  required
                  value={targetHalaqahId}
                  onChange={(e) => setTargetHalaqahId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اختر الحلقة المستهدفة --</option>
                  {halaqat
                    .filter(h => h._id !== selectedStudent?.halaqah?._id)
                    .map(h => (
                      <option key={h._id} value={h._id}>{h.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">سبب النقل (اختياري)</label>
                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="مثال: تغيير مكان السكن أو رغبة ولي الأمر..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  تأكيد النقل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Student Progress / Report Modal */}
      {reportModalStudent && (
        <StudentProgressModal
          student={reportModalStudent}
          onClose={() => setReportModalStudent(null)}
        />
      )}
    </div>
  );
}
