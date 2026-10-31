import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  BookOpen, 
  Key, 
  X, 
  CheckCircle, 
  Layers,
  Award,
  Eye,
  Copy
} from 'lucide-react';

export default function TeachersManagementView() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    qualification: 'إجازة في القرآن الكريم بالسند المتصل',
    experienceYears: 3,
    halaqahId: '',
    city: 'تعز',
    status: 'active',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, hRes] = await Promise.all([
        api.get('/teachers'),
        api.get('/halaqat')
      ]);
      setTeachers(tRes);
      setHalaqat(hRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      username: `teacher_${teachers.length + 1}`,
      password: 'teacher123',
      phone: '',
      qualification: 'إجازة في القرآن الكريم بالسند المتصل',
      experienceYears: 3,
      halaqahId: '',
      city: 'تعز',
      status: 'active',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTeacher(t);
    setFormData({
      fullName: t.fullName,
      username: t.user?.username || '',
      password: '',
      phone: t.phone || '',
      qualification: t.qualification || '',
      experienceYears: t.experienceYears || 0,
      halaqahId: t.halaqah?._id || '',
      city: t.city || 'تعز',
      status: t.status || 'active',
      notes: t.notes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher._id}`, formData);
      } else {
        await api.post('/teachers', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'فشل حفظ بيانات المعلم');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف المعلم "${name}"؟`)) return;
    try {
      await api.delete(`/teachers/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'فشل حذف المعلم');
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const s = searchTerm.toLowerCase();
    return (
      t.fullName?.toLowerCase().includes(s) ||
      t.user?.username?.toLowerCase().includes(s) ||
      t.phone?.includes(s) ||
      t.halaqah?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            <span>إدارة المدرسين ({teachers.length} معلم)</span>
          </h2>
          <p className="text-xs text-slate-500">
            إضافة وتعديل بيانات المدرسين، ربط الحسابات بالحلقات، وإدارة بيانات الدخول
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCredentialsModalOpen(true)}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4 text-amber-700" />
            <span>كشف حسابات المعلمين</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة معلم جديد</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم المعلم، اسم المستخدم، رقم الجوال، أو الحلقة..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {/* Teachers Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل بيانات المعلمين...</div>
      ) : filteredTeachers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          لا يوجد معلمون مطابقون لمعايير البحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTeachers.map((t) => (
            <div
              key={t._id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{t.fullName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                        @{t.user?.username || '—'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${t.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {t.status === 'active' ? 'نشط' : 'معطل'}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>

                {/* Assigned Halaqah */}
                <div className="mt-3 p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">الحلقة المكلف بتدريسها:</span>
                  {t.halaqah ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950">{t.halaqah.name}</span>
                      <span className="text-[10px] text-emerald-700">{t.halaqah.mosque}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-600 font-medium italic">لم تسند حلقة لهذا المعلم بعد</span>
                  )}
                </div>

                <div className="mt-2.5 text-xs text-slate-600 space-y-1">
                  {t.phone && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                  {t.qualification && (
                    <div className="text-[11px] text-slate-500 truncate">
                      <span className="text-slate-400">المؤهل:</span> {t.qualification} ({t.experienceYears || 0} سنوات خبرة)
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">كلمة المرور: teacher123</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => handleDelete(t._id, t.fullName)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="حذف المعلم"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingTeacher ? 'تعديل بيانات المعلم وربط الحلقة' : 'إضافة معلم جديد وحساب دخول'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المعلم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="صالح أحمد قاسم مهدي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستخدم للدخول *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTeacher}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="teacher_1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingTeacher ? 'كلمة المرور الجديدة (اختياري)' : 'كلمة المرور *'}
                  </label>
                  <input
                    type="password"
                    required={!editingTeacher}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="******"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  الحلقة المكلف بها (ربط المعلم بالحلقة) *
                </label>
                <select
                  value={formData.halaqahId}
                  onChange={(e) => setFormData({ ...formData, halaqahId: e.target.value })}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اختر الحلقة المراد ربطها بهذا المعلم --</option>
                  {halaqat.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name} — ({h.mosque})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  * سيتم ربط هذا المعلم بالحلقة بحيث تظهر له عند تسجيل دخوله فوراً.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="770123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">سنوات الخبرة</label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">المؤهل والشهادات</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="إجازة برواية حفص عن عاصم، بكالوريوس..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ بيانات المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teachers Credentials Roster Modal (for Admin handover) */}
      {credentialsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-600" />
                  <span>كشف بيانات دخول جميع المعلمين ({teachers.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك نسخ أو توزيع هذه البيانات على المعلمين ليتمكن كل معلم من الدخول لحلقته
                </p>
              </div>
              <button onClick={() => setCredentialsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {teachers.map((t, idx) => (
                <div key={t._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{idx + 1}. {t.fullName}</span>
                    <span className="text-emerald-800 font-semibold block text-[11px]">
                      حلقة: {t.halaqah?.name || 'لم تسند بعد'}
                    </span>
                  </div>
                  <div className="text-left bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-[11px]">
                    <span className="text-slate-600 block">المستخدم: <strong className="text-emerald-900">{t.user?.username}</strong></span>
                    <span className="text-slate-500 block">المرور: <strong>teacher123</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCredentialsModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
