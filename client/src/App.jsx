import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import HalaqatView from './views/HalaqatView';
import StudentsView from './views/StudentsView';
import MonthlyReportView from './views/MonthlyReportView';
import SupervisorEvaluationView from './views/SupervisorEvaluationView';
import AnnualReportView from './views/AnnualReportView';
import TeachersManagementView from './views/TeachersManagementView';
import SupervisorsManagementView from './views/SupervisorsManagementView';
import AiAnalysisView from './views/AiAnalysisView';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedHalaqahId, setSelectedHalaqahId] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-emerald-950 font-serif">جاري تحميل نظام حِفظ...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-6">
      {/* Top Navbar */}
      <Navbar />

      {/* Navigation Sub-bar for Desktop & Bottom Nav for Mobile */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5">
        {activeTab === 'dashboard' && (
          <DashboardView setActiveTab={setActiveTab} />
        )}

        {activeTab === 'halaqat' && (
          <HalaqatView 
            setActiveTab={setActiveTab} 
            setSelectedHalaqahId={setSelectedHalaqahId} 
          />
        )}

        {activeTab === 'students' && (
          <StudentsView />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReportView defaultHalaqahId={selectedHalaqahId} />
        )}

        {activeTab === 'evaluations' && (
          <SupervisorEvaluationView defaultHalaqahId={selectedHalaqahId} />
        )}

        {activeTab === 'annual' && (
          <AnnualReportView defaultHalaqahId={selectedHalaqahId} />
        )}

        {/* Teachers Management (Admin only) */}
        {activeTab === 'teachers' && user.role === 'admin' && (
          <TeachersManagementView />
        )}

        {/* Supervisors Management (Admin only) */}
        {activeTab === 'supervisors' && user.role === 'admin' && (
          <SupervisorsManagementView />
        )}

        {/* AI Analysis (Admin only) */}
        {activeTab === 'ai' && user.role === 'admin' && (
          <AiAnalysisView defaultHalaqahId={selectedHalaqahId} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
