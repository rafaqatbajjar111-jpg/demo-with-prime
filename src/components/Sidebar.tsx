import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageCircle, 
  User, 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  Building2, 
  ArrowDownToLine, 
  Users, 
  History, 
  Headphones, 
  Bell,
  LogOut,
  X,
  Shield,
  Settings,
  TicketCheck,
  Activity,
  ChartColumn,
  UserCheck,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ke } from '../lib/sdk';
import { useAuth } from '../lib/auth';

const userNav = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "AI Assistant", icon: MessageCircle, page: "AIChat" },
  { name: "Profile Settings", icon: Users, page: "Profile" },
  { name: "Account Activation", icon: ShieldCheck, page: "AccountActivation" },
  { name: "Live Deposits", icon: TrendingUp, page: "LiveDeposits" },
  { name: "Security Deposit", icon: Wallet, page: "Deposit" },
  { name: "Bank Accounts", icon: Building2, page: "BankAccounts" },
  { name: "Withdrawal", icon: ArrowDownToLine, page: "Withdrawal" },
  { name: "Referrals", icon: Users, page: "Referrals" },
  { name: "Transactions", icon: History, page: "Transactions" },
  { name: "Support", icon: Headphones, page: "Support" },
  { name: "Notifications", icon: Bell, page: "Notifications" }
];

const adminNav = [
  { name: "Admin Dashboard", icon: ChartColumn, page: "AdminDashboard", section: "dashboard" },
  { name: "Users", icon: Users, page: "AdminUsers", section: "users" },
  { name: "Balance Management", icon: Wallet, page: "AdminBalanceManagement", section: "users" },
  { name: "Activation Requests", icon: ShieldCheck, page: "AdminActivation", section: "activation" },
  { name: "Deposits", icon: Plus, page: "AdminDeposits", section: "deposits" },
  { name: "Withdrawals", icon: ArrowDownToLine, page: "AdminWithdrawals", section: "withdrawals" },
  { name: "Referrals", icon: Users, page: "AdminReferrals", section: "referrals" },
  { name: "Support Tickets", icon: TicketCheck, page: "AdminSupport", section: "support" },
  { name: "Activity Log", icon: History, page: "AdminActivityLog", section: "reports" },
  { name: "Advanced Reports", icon: ChartColumn, page: "AdminReports", section: "reports" },
  { name: "Role Management", icon: Shield, page: "RoleManagement", section: "roles" },
  { name: "Assign User Roles", icon: UserCheck, page: "UserRoleAssignment", section: "roles" },
  { name: "Admin Roles", icon: ShieldCheck, page: "AdminRoles", section: "roles" },
  { name: "Settings", icon: Settings, page: "AdminSettings", section: "settings" }
];

const co = (page: string) => "/" + page.replace(/ /g, "-");

export function Sidebar({ isOpen, onClose, isAdmin }: { isOpen: boolean; onClose: () => void; isAdmin: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] border-r border-gray-800 z-50 transform transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">BD</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Bigdream</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">{isAdmin ? "Admin Panel" : "Account Panel"}</p>
                {user?.customRole && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {user.customRole}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-160px)]">
          {navItems.map((item) => {
            const path = co(item.page);
            const isActive = location.pathname === path;
            return (
              <Link
                key={item.page}
                to={path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-[#1a1a1a]">
          {isAdmin ? (
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">User Panel</span>
            </Link>
          ) : (
            <button
              onClick={() => ke.auth.logout()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
