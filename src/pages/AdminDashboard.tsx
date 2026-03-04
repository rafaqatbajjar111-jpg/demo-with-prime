import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  Users, 
  Wallet, 
  ArrowDownRight, 
  TicketCheck, 
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list()
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ["allDeposits"],
    queryFn: () => ke.entities.SecurityDeposit.list("-created_date", 10)
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["allWithdrawals"],
    queryFn: () => ke.entities.Withdrawal.list("-created_date", 10)
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["allTickets"],
    queryFn: () => ke.entities.SupportTicket.list("-created_date", 10)
  });

  const pendingDeposits = deposits.filter((d: any) => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === "pending").length;
  const openTickets = tickets.filter((t: any) => t.status === "open").length;

  const totalDeposited = deposits
    .filter((d: any) => d.status === "approved")
    .reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === "completed")
    .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

  const stats = [
    { title: "Total Users", value: users.length.toString(), icon: Users, color: "text-blue-600", bgColor: "bg-blue-100", link: "/AdminUsers" },
    { title: "Total Deposited", value: `₹${totalDeposited.toLocaleString("en-IN")}`, icon: Wallet, color: "text-emerald-600", bgColor: "bg-emerald-100", link: "/AdminDeposits" },
    { title: "Total Withdrawn", value: `₹${totalWithdrawn.toLocaleString("en-IN")}`, icon: ArrowDownRight, color: "text-purple-600", bgColor: "bg-purple-100", link: "/AdminWithdrawals" },
    { title: "Open Tickets", value: openTickets.toString(), icon: TicketCheck, color: "text-amber-600", bgColor: "bg-amber-100", link: "/AdminSupport" }
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      completed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      processing: "bg-blue-100 text-blue-700",
      open: "bg-blue-100 text-blue-700"
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your platform</p>
      </div>

      {(pendingDeposits > 0 || pendingWithdrawals > 0 || openTickets > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-900">Action Required</p>
              <p className="text-sm text-red-700">
                {pendingDeposits > 0 && `${pendingDeposits} pending deposit(s)`}
                {pendingDeposits > 0 && pendingWithdrawals > 0 && ", "}
                {pendingWithdrawals > 0 && `${pendingWithdrawals} pending withdrawal(s)`}
                {(pendingDeposits > 0 || pendingWithdrawals > 0) && openTickets > 0 && ", "}
                {openTickets > 0 && `${openTickets} open ticket(s)`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={i} to={stat.link}>
            <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Deposits</CardTitle>
            <Link to="/AdminDeposits">
              <Button variant="ghost" size="sm" className="text-amber-600">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deposits.slice(0, 5).map((dep: any) => (
                <div key={dep.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">₹{dep.amount?.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-slate-500">{dep.user_email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadge(dep.status)}>{dep.status}</Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(dep.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Withdrawals</CardTitle>
            <Link to="/AdminWithdrawals">
              <Button variant="ghost" size="sm" className="text-amber-600">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {withdrawals.slice(0, 5).map((wdr: any) => (
                <div key={wdr.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-900">₹{wdr.amount?.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-slate-500">{wdr.user_email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadge(wdr.status)}>{wdr.status}</Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(wdr.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
