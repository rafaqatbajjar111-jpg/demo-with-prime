import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, ShieldCheck, Wallet, TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ke } from '../lib/sdk';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Button } from './ui/button';

export function Header({ onMenuClick, unreadCount = 0 }: { onMenuClick: () => void; unreadCount?: number }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#1a1a1a] border-b border-gray-800">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden text-gray-400 hover:text-white" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
          
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
              <Wallet className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Balance:</span>
              <span className="font-bold text-white">₹{(user?.wallet_balance || 0).toLocaleString("en-IN")}</span>
            </div>
            {user?.account_activated && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400">Commission:</span>
                <span className="font-bold text-white">₹{(user?.total_commission || 0).toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/Notifications">
            <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-white">{user?.full_name || "User"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-gray-800 text-white">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.full_name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem asChild>
                <Link to="/Profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem asChild>
                  <Link to="/AdminDashboard" className="flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                onClick={() => ke.auth.logout()}
                className="text-red-400 focus:text-red-400 cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
