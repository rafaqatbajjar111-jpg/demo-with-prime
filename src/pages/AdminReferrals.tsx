import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  Users, 
  Search, 
  TrendingUp, 
  Gift, 
  UserPlus,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminReferrals() {
  const [search, setSearch] = useState("");

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["allReferrals"],
    queryFn: () => ke.entities.Referral.list("-created_date")
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list()
  });

  const totalEarnings = referrals.reduce((sum: number, r: any) => sum + (r.reward_amount || 0), 0);
  const completedReferrals = referrals.filter((r: any) => r.status === "completed").length;

  const filteredReferrals = referrals.filter((r: any) => 
    r.referrer_email?.toLowerCase().includes(search.toLowerCase()) || 
    r.referred_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Management</h1>
        <p className="text-slate-500 mt-1">Monitor referral program performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Referrals</p>
                <p className="text-2xl font-bold text-slate-900">{referrals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{completedReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Gift className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Rewards Paid</p>
                <p className="text-2xl font-bold text-slate-900">₹{totalEarnings.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by referrer or referred email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">Referrer</th>
                  <th className="text-left p-4 font-medium text-slate-600">Referred User</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Reward</th>
                  <th className="text-left p-4 font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredReferrals.map((ref: any) => (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{ref.referrer_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{ref.referred_email}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={ref.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {ref.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-emerald-600">₹{ref.reward_amount || 0}</p>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(ref.created_date), "dd MMM, hh:mm a")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
