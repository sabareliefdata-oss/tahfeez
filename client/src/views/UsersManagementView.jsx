import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  UserCog, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Award, 
  UserCheck, 
  Phone, 
  Key, 
  X, 
  CheckCircle, 
  Layers
} from 'lucide-react';

export default function UsersManagementView() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [halaqat, setHalaqat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    role: 'teacher',
    password: '',
    assignedHalaqat: [],
    notes: '',
    isActive: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = roleFilter ? `?role=${roleFilter}` : '';
      const [uRes, hRes] = await Promise.all([
        api.get(`/auth/users${query}`),
        api.get('/halaqat')
      ]);
      setUsers(uRes);
      setHalaqat(hRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const openAddModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        fullName: u.fullName,
        username: u.username,
        phone: u.phone || '',
        role: u.role,
        password: '',
        assignedHalaqat: u.assignedHalaqat ? u.assignedHalaqat.map(h => h._id || h) : [],
        notes: u.notes || '',
        isActive: u.isActive !== undefined ? u.isActive : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        fullName: '',
        username: '',
        phone: '',
        role: 'teacher',
        password: '',
        assignedHalaqat: [],
        notes: '',
        isActive: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/auth/users/${editingUser._id}`, formData);
      } else {
        await api.post('/auth/users', formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleHalaqahAssignment = (hId) => {
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

  const filteredUsers = users.filter(u => {
    const s = searchTerm.toLowerCase();
    return u.fullName.toLowerCase().includes(s) || u.username.toLowerCase().includes(s) || (u.phone && u.phone.includes(s));
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-emerald-700" />
            <span>إدارة الكوادر والمستخدمين ({filteredUsers.length})</span>
          </h2>
          <p className="text-xs text-slate-500">إدارة حسابات المعلمين، المشرفين، وتوزيع الحلقات</p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Search and Role Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو اسم المستخدم أو الهاتف..."
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">كل الأدوار</option>
          <option value="teacher">المعلمين فقط</option>
          <option value="supervisor">المشرفين فقط</option>
          <option value="admin">المدراء فقط</option>
        </select>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">جاري تحميل المستخدمين...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          لا يوجد مستخدمون مطابقون للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredUsers.map((u) => {
            const roleBadge = u.role === 'admin'
              ? { label: 'مدير نظام', color: 'bg-amber-100 text-amber-800' }
              : u.role === 'supervisor'
              ? { label: 'مشرف حلقات', color: 'bg-emerald-100 text-emerald-800' }
              : { label: 'معلم حلقة', color: 'bg-teal-100 text-teal-800' };

            return (
              <div
                key={u._id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${u.isActive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-800 mt-2">{u.fullName}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>

                  {u.phone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.phone}</span>
                    </p>
                  )}

                  {/* Assigned halaqat list */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-1">الحلقات التابعة:</span>
                    {u.assignedHalaqat && u.assignedHalaqat.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.assignedHalaqat.map((h, i) => (
                          <span key={h._id || i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {h.name || 'حلقة'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">لم تسند أي حلقة بعد</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => openAddModal(u)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">
                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">الاسم الكامل *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المستخدم (للدخول) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="teacher_saleh"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">الدور والصلاحية *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="teacher">معلم حلقة</option>
                    <option value="supervisor">مشرف حلقات</option>
                    <option value="admin">مدير نظام</option>
                  </select>
                </div>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingUser ? 'كلمة مرور جديدة (اتركها فارغة للتخطي)' : 'كلمة المرور *'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="******"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Assign Halaqat checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  إسناد وتوزيع الحلقات التابعة لهذا المستخدم:
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto space-y-1.5">
                  {halaqat.map(h => {
                    const isChecked = formData.assignedHalaqat.includes(h._id);
                    return (
                      <label key={h._id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleHalaqahAssignment(h._id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{h.name}</span>
                      </label>
                    );
                  })}
                </div>
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
                  حفظ المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
