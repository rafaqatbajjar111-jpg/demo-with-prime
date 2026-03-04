import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth';
import AppLayout from './components/AppLayout';
import { Toaster } from 'sonner';

// Create a client
const queryClient = new QueryClient();

// Pages
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import AccountActivation from './pages/AccountActivation';
import LiveDeposits from './pages/LiveDeposits';
import Deposit from './pages/Deposit';
import BankAccounts from './pages/BankAccounts';
import Withdrawal from './pages/Withdrawal';
import Referrals from './pages/Referrals';
import Transactions from './pages/Transactions';
import Support from './pages/Support';
import Notifications from './pages/Notifications';
import UserProfile from './pages/UserProfile';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminActivation from './pages/AdminActivation';
import AdminDeposits from './pages/AdminDeposits';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminSupport from './pages/AdminSupport';
import AdminSettings from './pages/AdminSettings';
import AdminActivityLog from './pages/AdminActivityLog';
import AdminBalanceManagement from './pages/AdminBalanceManagement';
import AdminReferrals from './pages/AdminReferrals';
import AdminReports from './pages/AdminReports';
import AdminRoles from './pages/AdminRoles';

function ProtectedRoute({ children, adminOnly = false }: { children?: React.ReactNode, adminOnly?: boolean }) {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) return <div className="flex items-center justify-center h-screen bg-slate-950"><div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  
  if (!user) {
    navigateToLogin();
    return null;
  }

  if (adminOnly && user.role !== 'admin') return <Navigate to="/Dashboard" />;

  return children ? <>{children}</> : <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/Dashboard" replace />} />
            
            {/* Protected Layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* User Routes */}
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/AIChat" element={<AIChat />} />
              <Route path="/AccountActivation" element={<AccountActivation />} />
              <Route path="/LiveDeposits" element={<LiveDeposits />} />
              <Route path="/Deposit" element={<Deposit />} />
              <Route path="/BankAccounts" element={<BankAccounts />} />
              <Route path="/Withdrawal" element={<Withdrawal />} />
              <Route path="/Referrals" element={<Referrals />} />
              <Route path="/Transactions" element={<Transactions />} />
              <Route path="/Support" element={<Support />} />
              <Route path="/Notifications" element={<Notifications />} />
              <Route path="/Profile" element={<UserProfile />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute adminOnly />}>
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                <Route path="/AdminUsers" element={<AdminUsers />} />
                <Route path="/AdminActivation" element={<AdminActivation />} />
                <Route path="/AdminDeposits" element={<AdminDeposits />} />
                <Route path="/AdminWithdrawals" element={<AdminWithdrawals />} />
                <Route path="/AdminSupport" element={<AdminSupport />} />
                <Route path="/AdminSettings" element={<AdminSettings />} />
                <Route path="/AdminActivityLog" element={<AdminActivityLog />} />
                <Route path="/AdminBalanceManagement" element={<AdminBalanceManagement />} />
                <Route path="/AdminReferrals" element={<AdminReferrals />} />
                <Route path="/AdminReports" element={<AdminReports />} />
                <Route path="/AdminRoles" element={<AdminRoles />} />
                <Route path="/RoleManagement" element={<AdminRoles />} />
                <Route path="/UserRoleAssignment" element={<AdminRoles />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
