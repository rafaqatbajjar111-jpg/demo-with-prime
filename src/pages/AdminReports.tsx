import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Wallet,
  FileText,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("7");

  const { data: deposits = [] } = useQuery({
    queryKey: ["allDeposits"],
    queryFn: () => ke.entities.SecurityDeposit.list()
  });

  const { data: withdrawals = [] } = useQuery({
    queryKey: ["allWithdrawals"],
    queryFn: () => ke.entities.Withdrawal.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list()
  });

  const getFilteredData = () => {
    const days = parseInt(dateRange);
    const start = startOfDay(subDays(new Date(), days));
    const end = endOfDay(new Date());

    const filteredDeposits = deposits.filter((d: any) => 
      d.status === "approved" && isWithinInterval(new Date(d.created_date), { start, end })
    );

    const filteredWithdrawals = withdrawals.filter((w: any) => 
      w.status === "completed" && isWithinInterval(new Date(w.created_date), { start, end })
    );

    return { filteredDeposits, filteredWithdrawals };
  };

  const { filteredDeposits, filteredWithdrawals } = getFilteredData();

  const totalDeposits = filteredDeposits.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
  const totalWithdrawals = filteredWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);
  const netProfit = totalDeposits - totalWithdrawals;

  // Prepare chart data
  const chartData = Array.from({ length: parseInt(dateRange) + 1 }, (_, i) => {
    const date = subDays(new Date(), i);
    const dateStr = format(date, "dd MMM");
    
    const dayDeposits = filteredDeposits
      .filter((d: any) => format(new Date(d.created_date), "dd MMM") === dateStr)
      .reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
      
    const dayWithdrawals = filteredWithdrawals
      .filter((w: any) => format(new Date(w.created_date), "dd MMM") === dateStr)
      .reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    return { date: dateStr, deposits: dayDeposits, withdrawals: dayWithdrawals };
  }).reverse();

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text("Bigdream Platform Report", 14, 15);
    doc.text(`Period: Last ${dateRange} Days`, 14, 25);
    doc.text(`Total Deposits: ₹${totalDeposits.toLocaleString()}`, 14, 35);
    doc.text(`Total Withdrawals: ₹${totalWithdrawals.toLocaleString()}`, 14, 45);
    doc.text(`Net Flow: ₹${netProfit.toLocaleString()}`, 14, 55);

    const tableData = filteredDeposits.map((d: any) => [
      format(new Date(d.created_date), "dd/MM/yyyy"),
      d.user_email,
      "Deposit",
      `INR ${d.amount}`,
      d.status
    ]);

    doc.autoTable({
      startY: 65,
      head: [['Date', 'User', 'Type', 'Amount', 'Status']],
      body: tableData,
    });

    doc.save(`report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500 mt-1">Analyze platform performance and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="15">Last 15 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium">Total Deposits</p>
                <p className="text-2xl font-bold text-emerald-900">₹{totalDeposits.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-700 font-medium">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-900">₹{totalWithdrawals.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Net Cash Flow</p>
                <p className="text-2xl font-bold text-blue-900">₹{netProfit.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Transaction Trends</CardTitle>
          <CardDescription>Deposits vs Withdrawals over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="deposits" stroke="#10b981" fillOpacity={1} fill="url(#colorDeposits)" strokeWidth={2} />
                <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fillOpacity={1} fill="url(#colorWithdrawals)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-600" />
                <span className="text-slate-700">Total Registered Users</span>
              </div>
              <span className="font-bold text-slate-900">{users.length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-slate-700">Avg. Deposit Amount</span>
              </div>
              <span className="font-bold text-slate-900">₹{(totalDeposits / (filteredDeposits.length || 1)).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-slate-700">Avg. Withdrawal Amount</span>
              </div>
              <span className="font-bold text-slate-900">₹{(totalWithdrawals / (filteredWithdrawals.length || 1)).toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
