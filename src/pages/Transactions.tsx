import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter,
  Calendar,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Transactions() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const { data: deposits = [], isLoading: loadingDep } = useQuery({
    queryKey: ["allDeposits", user?.email],
    queryFn: async () => (await ke.entities.SecurityDeposit.list("-created_date")).filter((d: any) => d.user_email === user?.email),
    enabled: !!user
  });

  const { data: withdrawals = [], isLoading: loadingWdr } = useQuery({
    queryKey: ["allWithdrawals", user?.email],
    queryFn: async () => (await ke.entities.Withdrawal.list("-created_date")).filter((w: any) => w.user_email === user?.email),
    enabled: !!user
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
      processing: "bg-blue-100 text-blue-700 border-blue-200"
    };
    return styles[status] || styles.pending;
  };

  const allTransactions = [
    ...deposits.map((d: any) => ({ ...d, type: 'deposit' })),
    ...withdrawals.map((w: any) => ({ ...w, type: 'withdrawal' }))
  ].sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

  const filtered = allTransactions.filter((t: any) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const matchesSearch = !search || t.transaction_id?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isLoading = loadingDep || loadingWdr;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-slate-500 mt-1">View all your deposits and withdrawals</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Deposits</p>
            <p className="text-2xl font-bold text-emerald-600">{deposits.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Withdrawals</p>
            <p className="text-2xl font-bold text-blue-600">{withdrawals.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{allTransactions.filter(t => t.status === "pending").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={filter} onValueChange={setFilter} className="flex-1">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposit">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by Transaction ID" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((tx: any) => (
                <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        tx.type === 'deposit' ? "bg-emerald-100" : "bg-blue-100"
                      )}>
                        {tx.type === 'deposit' ? (
                          <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}</p>
                          <Badge variant="outline" className={getStatusBadge(tx.status)}>
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {tx.transaction_id || "N/A"} • {format(new Date(tx.created_date), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        tx.type === 'deposit' ? "text-emerald-600" : "text-blue-600"
                      )}>
                        {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-500 uppercase">{tx.payment_method || "Bank"}</p>
                    </div>
                  </div>
                  {tx.rejection_reason && (
                    <div className="mt-2 ml-16 p-2 bg-red-50 rounded-lg text-sm text-red-600">
                      Reason: {tx.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
