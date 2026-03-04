import React, { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Shield } from 'lucide-react';

const ADMIN_PAGES = [
  "AdminDashboard", "AdminUsers", "AdminActivation", "AdminDeposits", 
  "AdminWithdrawals", "AdminReferrals", "AdminSupport", "AdminActivityLog", 
  "AdminRoles", "AdminSettings", "RoleManagement", "UserRoleAssignment", 
  "UserActivityDashboard", "AdminBalanceManagement", "AdminReports"
];

export default function AppLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("splashShown"));
  const location = useLocation();
  const { user } = useAuth();
  
  const currentPageName = location.pathname.substring(1) || "Dashboard";
  const isAdminPage = ADMIN_PAGES.includes(currentPageName);

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ["unreadNotifications", user?.email],
    queryFn: async () => {
      const all = await ke.entities.Notification.filter({ is_read: false });
      return all.filter((n: any) => n.user_email === user?.email || n.user_email === "all");
    },
    enabled: !!user
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem("splashShown", "true");
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (user?.is_blocked) {
    return <BlockedScreen user={user} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <style>{`
        :root {
          --primary: 250 100% 60%;
          --primary-foreground: 0 0% 100%;
        }
        body {
          background: #0a0a0a;
        }
      `}</style>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isAdmin={isAdminPage} 
      />
      
      <div className="lg:pl-72">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)} 
          unreadCount={unreadNotifications.length} 
        />
        <main className="p-4 lg:p-6 bg-[#0a0a0a]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-2xl"
          >
            <span className="text-6xl font-black text-white">FP</span>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h1 className="text-5xl font-black text-white mb-3 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-300" />
              Bigdream
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </h1>
            <p className="text-xl text-white/90 font-semibold">Your Gaming Fund Partner</p>
          </motion.div>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1, duration: 1.5 }}
            className="h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 rounded-full mt-8 mx-auto max-w-xs"
          />
        </motion.div>
      </div>
    </div>
  );
}

function BlockedScreen({ user }: { user: any }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white border border-red-200 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold">Account Blocked</h1>
          <p className="text-red-50 text-lg mt-2">आपका खाता ब्लॉक कर दिया गया है</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <Shield className="w-6 h-6 text-red-600 shrink-0 mt-1" />
            <div>
              <p className="font-bold text-red-900">Your account has been blocked by the administrator</p>
              <p className="text-sm text-red-700 mt-1">
                आपके खाते तक पहुंच को प्रतिबंधित कर दिया गया है। आप तब तक कोई भी कार्रवाई नहीं कर सकते जब तक कि व्यवस्थापक आपके खाते को अनब्लॉक नहीं कर देता।
              </p>
            </div>
          </div>
          
          {user.block_reason && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <p className="text-sm font-bold text-slate-900 mb-1">Reason for block:</p>
              <p className="text-slate-700">{user.block_reason}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = "mailto:support@fastpayz.com"}
              className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
            >
              Contact Support
            </button>
            <button 
              onClick={() => ke.auth.logout()}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
