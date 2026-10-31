import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Layers, 
  CheckCircle, 
  X,
  Key
} from 'lucide-react';

export default function SupervisorsManagementView() {
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupervisor, setEditingSupervisor] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    phone: '',
    sector: 'القطاع الميداني',
    assignedHalaqat: [],
    status: 'active',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        api.get('/supervisors'),
        api.get('/halaqat')
      ]);
      setSupervisors(sRes);
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
    setEditingSupervisor(null);
    setFormData({
      fullName: '',
      username: `supervisor_${supervisors.length + 1}`,
      password: 'sup123',
      phone: '',
      sector: 'القطاع الميداني',
      assignedHalaqat: [],
      status: 'active',
      notes: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (s) => {
    setEditingSupervisor(s);
    setFormData({
      fullName: s.fullName,
      username: s.user?.username || '',
      password: '',
      phone: s.phone || '',
      sector: s.sector || 'القطاع الميداني',
      assignedHalaqat: s.assignedHalaqat ? s.assignedHalaqat.map(h => h._id || h) : [],
      status: s.status || 'active',
      notes: s.notes || ''
    });
    setModalOpen(true);
  };

  const toggleHalaqah = (hId) => {
    setFormData(prev => {
      const exists = prev.assignedHalaqat.includes(hId);
      return {
        ...prev,
        assignedHalaqat: exists
          ? prev.assignedHalaqat.filter(id => id !== hId)
          : [...prev.assignedHalaqat, hId]
      };
    });
  };

  const selectAllHalaqat = () => {
    setFormData(prev => ({
      ...prev,
      assignedHalaqat: halaqat.map(h => h._id)
    }));
  };

  const clearAllHalaqat = () => {
    setFormData(prev => ({
      ...prev,
      assignedHalaqat: []
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingSupervisor) {
        await api.put(`/supervisors/${editingSupervisor._id}`, formData);
      } else {
        await api.post('/supervisors', formData);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'فشل حفظ بيانات المشرف');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف المشرف "${name}"؟`)) return;
    try {
      await api.delete(`/supervisors/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'فشل حذف المشرف');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-700" />
            <span>إدارة المشرفين وتوزيع الحلقات ({supervisors.length} مشرف)</span>
          </h2>
          <p className="text-xs text-slate-500">
            توزيع الحلقات على المشرفين، بحيث يرى كل مشرف فقط الحلقات المربوطة به من قبل الإدارة
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مشرف جديد</span>
        </button>
      </div>

      {/* Supervisors List */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل المشرفين...</div>
      ) : supervisors.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          لا يوجد مشرفون مسجلون حالياً
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supervisors.map((s) => (
            <div
              key={s._id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-800">{s.fullName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                        @{s.user?.username || '—'}
                      </span>
                      <span className="text-xs text-teal-700 font-semibold">{s.sector}</span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                {s.phone && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </p>
                )}

                {/* Assigned halaqat list */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      الحلقات المكلف بالإشراف عليها ({s.assignedHalaqat?.length || 0} حلقة):
                    </span>
                    <button
                      onClick={() => openEditModal(s)}
                      className="text-[11px] text-teal-700 hover:underline font-bold"
                    >
                      تعديل التوزيع
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {s.assignedHalaqat && s.assignedHalaqat.length > 0 ? (
                      s.assignedHalaqat.map((h, i) => (
                        <span key={h._id || i} className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700">
                          {h.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-amber-700 italic">لم يتم إسناد أي حلقة لهذا المشرف</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">كلمة المرور: sup123</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(s)}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل وبيانات الدخول</span>
                  </button>
                  <button
                    onClick={() => handleDelete(s._id, s.fullName)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="حذف المشرف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Supervisor Modal with Halaqat Multi-selection */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingSupervisor ? 'تعديل بيانات المشرف وتوزيع الحلقات' : 'إضافة مشرف جديد'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم الكامل للمشرف *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="أ. محمد عبد الله"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستخدم للدخول *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingSupervisor}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="supervisor1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingSupervisor ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور *'}
                  </label>
                  <input
                    type="password"
                    required={!editingSupervisor}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="******"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="777000002"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">القطاع الإشرافي</label>
                  <input
                    type="text"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    placeholder="قطاع المدينة - 16 حلقة"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Halaqat Multi-selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    تحديد وإسناد الحلقات التابعة لهذا المشرف ({formData.assignedHalaqat.length} حلقة محددة):
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllHalaqat}
                      className="text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllHalaqat}
                      className="text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {halaqat.map(h => {
                    const isChecked = formData.assignedHalaqat.includes(h._id);
                    return (
                      <label
                        key={h._id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-50 border-teal-300 text-teal-950 font-bold' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleHalaqah(h._id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="truncate">{h.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * الحلقات المحددة هنا هي الحلقات الوحيدة التي ستظهر للمشرف عند تسجيل دخوله لتقييمها ومتابعتها.
                </p>
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
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  حفظ المشرف وتوزيع الحلقات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
