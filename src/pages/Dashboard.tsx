import React from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  Wallet, 
  TrendingUp, 
  Lock, 
  Clock, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard,
  Archive,
  ChevronRight,
  Plus,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: myDeposits = [] } = useQuery({
    queryKey: ["myDeposits", user?.email],
    queryFn: async () => (await ke.entities.SecurityDeposit.list("-created_date", 5)).filter((d: any) => d.user_email === user?.email),
    enabled: !!user
  });

  const { data: myWithdrawals = [] } = useQuery({
    queryKey: ["myWithdrawals", user?.email],
    queryFn: async () => (await ke.entities.Withdrawal.list("-created_date", 5)).filter((d: any) => d.user_email === user?.email),
    enabled: !!user
  });

  const { data: myBankAccounts = [] } = useQuery({
    queryKey: ["myBankAccounts", user?.email],
    queryFn: async () => (await ke.entities.BankAccount.list()).filter((d: any) => d.user_email === user?.email),
    enabled: !!user
  });

  const stats = [
    { title: "Net Balance", value: (user?.wallet_balance || 0).toFixed(2), icon: Wallet, color: "from-green-500 to-emerald-600" },
    { title: "Commission Earned", value: (user?.total_commission || 0).toFixed(2), icon: TrendingUp, color: "from-blue-500 to-cyan-600" },
    { title: "Blocked Deposit", value: "0.00", icon: Lock, color: "from-red-500 to-rose-600" },
    { title: "WDR Hold Amount", value: "0.00", icon: Clock, color: "from-purple-500 to-violet-600" }
  ];

  const quickLinks = [
    { title: "Bank Accounts", icon: Building2, page: "BankAccounts", color: "from-green-500 to-emerald-600" },
    { title: "Deposit Requests", icon: ArrowUpRight, page: "Transactions", color: "from-orange-500 to-amber-600" },
    { title: "Withdrawal Requests", icon: ArrowDownRight, page: "Transactions", color: "from-blue-500 to-cyan-600" },
    { title: "Withdraw", icon: CreditCard, page: "Withdrawal", color: "from-pink-500 to-rose-600" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-xl">
            BD
          </div>
          <h1 className="text-2xl font-bold text-white">Bigdream</h1>
        </div>
        <Link to="/Deposit">
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 h-11 rounded-xl shadow-lg border-0">
            <ArrowUpRight className="w-5 h-5 mr-2" />
            Deposit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 bg-gray-800/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", stat.color.includes("green") ? "text-emerald-500" : stat.color.includes("blue") ? "text-blue-500" : stat.color.includes("red") ? "text-red-500" : "text-purple-500")} />
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
              <p className="text-white text-2xl font-bold">₹{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-white text-lg font-bold mb-4">Quick Links</h2>
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((link, i) => (
            <Link key={i} to={`/${link.page}`} className="flex flex-col items-center gap-2">
              <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl", link.color)}>
                <link.icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-white text-xs text-center font-medium">{link.title}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 bg-gray-800/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              <p className="text-gray-400 text-xs font-medium">Total Banks</p>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-white text-2xl font-bold">{myBankAccounts.length}</p>
              <ChevronRight className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gray-800/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <p className="text-gray-400 text-xs font-medium">Active Banks</p>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-white text-2xl font-bold">{myBankAccounts.filter((b: any) => b.is_verified).length}</p>
              <ChevronRight className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gray-800/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-red-500" />
              <p className="text-gray-400 text-xs font-medium">Disputed WDR</p>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-white text-2xl font-bold">0.00</p>
              <ChevronRight className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-gray-800/50 backdrop-blur">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white text-lg">Deposit Requests - ({myDeposits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {myDeposits.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myDeposits.map((dep: any) => (
                <div key={dep.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ArrowUpRight className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-bold">₹{dep.amount?.toLocaleString("en-IN")}</p>
                      <p className="text-gray-400 text-xs">{new Date(dep.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    dep.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : 
                    dep.status === "approved" ? "bg-green-500/20 text-green-500 border-green-500/50" : 
                    "bg-red-500/20 text-red-500 border-red-500/50"
                  )}>
                    {dep.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-gray-800/50 backdrop-blur">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white text-lg">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {myWithdrawals.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-gray-400">No data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myWithdrawals.map((wdr: any) => (
                <div key={wdr.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ArrowDownRight className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-white font-bold">₹{wdr.amount?.toLocaleString("en-IN")}</p>
                      <p className="text-gray-400 text-xs">{new Date(wdr.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    wdr.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : 
                    wdr.status === "completed" ? "bg-green-500/20 text-green-500 border-green-500/50" : 
                    "bg-red-500/20 text-red-500 border-red-500/50"
                  )}>
                    {wdr.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
