import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Layers, 
  Plus, 
  Search, 
  MapPin, 
  Users, 
  Clock, 
  Edit, 
  Trash2, 
  BookOpen, 
  Award, 
  ClipboardCheck, 
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Power,
  X
} from 'lucide-react';

export default function HalaqatView({ setActiveTab, setSelectedHalaqahId }) {
  const { user } = useAuth();
  const [halaqat, setHalaqat] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHalaqah, setEditingHalaqah] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mosque: '',
    location: '',
    teacher: '',
    supervisor: '',
    timeSlot: 'بعد صلاة العصر',
    targetCapacity: 20
  });

  const fetchHalaqat = async () => {
    try {
      const res = await api.get('/halaqat');
      setHalaqat(res);
    } catch (err) {
      console.error('Error fetching halaqat:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (user.role === 'admin') {
      try {
        const [tRes, sRes] = await Promise.all([
          api.get('/auth/users?role=teacher'),
          api.get('/auth/users?role=supervisor')
        ]);
        setTeachers(tRes);
        setSupervisors(sRes);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    }
  };

  useEffect(() => {
    fetchHalaqat();
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingHalaqah(null);
    setFormData({
      name: '',
      mosque: '',
      location: 'تعز',
      teacher: '',
      supervisor: '',
      timeSlot: 'بعد صلاة العصر',
      targetCapacity: 20
    });
    setModalOpen(true);
  };

  const openEditModal = (h) => {
    setEditingHalaqah(h);
    setFormData({
      name: h.name,
      mosque: h.mosque || '',
      location: h.location || '',
      teacher: h.teacher?._id || '',
      supervisor: h.supervisor?._id || '',
      timeSlot: h.timeSlot || 'بعد صلاة العصر',
      targetCapacity: h.targetCapacity || 20
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingHalaqah) {
        await api.put(`/halaqat/${editingHalaqah._id}`, formData);
      } else {
        await api.post('/halaqat', formData);
      }
      setModalOpen(false);
      fetchHalaqat();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف حلقة "${name}"؟`)) return;
    try {
      await api.delete(`/halaqat/${id}`);
      fetchHalaqat();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/halaqat/${id}/toggle-status`);
      fetchHalaqat();
    } catch (err) {
      alert(err.message || 'فشل تغيير حالة الحلقة');
    }
  };

  const filteredHalaqat = halaqat.filter(h => {
    const search = searchTerm.toLowerCase();
    return (
      h.name?.toLowerCase().includes(search) ||
      h.mosque?.toLowerCase().includes(search) ||
      h.location?.toLowerCase().includes(search) ||
      h.teacher?.fullName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <span>إدارة ومتابعة الحلقات ({filteredHalaqat.length})</span>
          </h2>
          <p className="text-xs text-slate-500">استعراض بيانات الحلقات والمساجد وتوزيع الكوادر</p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حلقة جديدة</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم الحلقة أو المسجد أو المعلم أو الحي..."
          className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل الحلقات...</div>
      ) : filteredHalaqat.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          لا توجد حلقات مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHalaqat.map((h) => (
            <div
              key={h._id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-emerald-950">{h.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{h.mosque} — {h.location}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{h.studentCount || 0} طالب</span>
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">المعلم:</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {h.teacher?.fullName || 'غير محدد'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">المشرف المتابع:</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {h.supervisor?.fullName || 'غير محدد'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>الوقت: {h.timeSlot}</span>
                </div>
              </div>

              {/* Action Buttons for Mobile/Desktop */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      if (setSelectedHalaqahId) setSelectedHalaqahId(h._id);
                      setActiveTab('monthly');
                    }}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>التقرير الشهري</span>
                  </button>

                  <button
                    onClick={() => {
                      if (setSelectedHalaqahId) setSelectedHalaqahId(h._id);
                      setActiveTab('annual');
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>التقرير السنوي</span>
                  </button>

                  {(user.role === 'admin' || user.role === 'supervisor') && (
                    <button
                      onClick={() => {
                        if (setSelectedHalaqahId) setSelectedHalaqahId(h._id);
                        setActiveTab('evaluations');
                      }}
                      className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>تقييم الزيارة</span>
                    </button>
                  )}
                </div>

                {user.role === 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleStatus(h._id, h.status)}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                        h.status === 'inactive'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={h.status === 'inactive' ? 'تفعيل الحلقة (الحلقة متوقفة حالياً)' : 'إيقاف مؤقت للحلقة'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{h.status === 'inactive' ? 'موقوفة' : 'نشطة'}</span>
                    </button>
                    <button
                      onClick={() => openEditModal(h)}
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg"
                      title="تعديل الحلقة"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(h._id, h.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="حذف الحلقة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingHalaqah ? 'تعديل بيانات الحلقة' : 'إضافة حلقة جديدة'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الحلقة *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحفاد الصحابة"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المسجد / المقر</label>
                  <input
                    type="text"
                    value={formData.mosque}
                    onChange={(e) => setFormData({ ...formData, mosque: e.target.value })}
                    placeholder="جامع الفاروق"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الموقع / الحي</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="تعز - المظفر"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">معلم الحلقة</label>
                  <select
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر المعلم --</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">المشرف المسؤول</label>
                  <select
                    value={formData.supervisor}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- اختر المشرف --</option>
                    {supervisors.map(s => (
                      <option key={s._id} value={s._id}>{s.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">فترة الدوام</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="بعد صلاة العصر">بعد صلاة العصر</option>
                    <option value="بعد صلاة المغرب">بعد صلاة المغرب</option>
                    <option value="بعد صلاة الفجر">بعد صلاة الفجر</option>
                    <option value="الفترة الصباحية">الفترة الصباحية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">السعة المستهدفة (طالب)</label>
                  <input
                    type="number"
                    value={formData.targetCapacity}
                    onChange={(e) => setFormData({ ...formData, targetCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
