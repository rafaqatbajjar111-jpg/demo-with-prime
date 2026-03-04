import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Shield, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminActivityLog() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["allActivities"],
    queryFn: () => ke.entities.UserActivity.list("-created_date")
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      warning: "bg-yellow-100 text-yellow-700"
    };
    return styles[status] || styles.success;
  };

  const filteredActivities = activities.filter((a: any) => {
    const matchesFilter = filter === "all" || a.action_type === filter;
    const matchesSearch = !search || 
      a.user_email?.toLowerCase().includes(search.toLowerCase()) || 
      a.action_description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activityTypes = Array.from(new Set(activities.map((a: any) => a.action_type)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
        <p className="text-slate-500 mt-1">Monitor platform and user activities</p>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by email or description..." 
                value={search}
                onChange={(e) => setSearch(search)}
                className="pl-10"
              />
            </div>
            <select 
              className="p-2 bg-white border rounded-lg text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {activityTypes.map((type: any) => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">User</th>
                  <th className="text-left p-4 font-medium text-slate-600">Action</th>
                  <th className="text-left p-4 font-medium text-slate-600">Type</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredActivities.map((activity: any) => (
                  <tr key={activity.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{activity.user_name || "System"}</p>
                          <p className="text-xs text-slate-500">{activity.user_email || "system@platform.com"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700">{activity.action_description}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {activity.action_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadge(activity.status)}>
                        {activity.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(activity.created_date), "dd MMM, hh:mm:ss a")}
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
