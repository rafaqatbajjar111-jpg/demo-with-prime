import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  Wallet, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  History,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { cn } from '../lib/utils';

export default function AdminBalanceManagement() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("");

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list("-wallet_balance")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ user, amount, type, reason }: any) => {
      const currentBalance = user.wallet_balance || 0;
      const newBalance = type === "credit" ? currentBalance + amount : Math.max(0, currentBalance - amount);
      
      await ke.entities.User.update(user.id, { wallet_balance: newBalance });
      
      // Log activity
      await ke.entities.UserActivity.create({
        user_email: user.email,
        user_name: user.full_name,
        action_type: "balance_adjustment",
        action_description: `Admin ${type}ed ₹${amount} to wallet. Reason: ${reason}`,
        status: "success"
      });

      // Notify user
      await ke.entities.Notification.create({
        user_email: user.email,
        title: type === "credit" ? "Wallet Credited" : "Wallet Debited",
        message: `₹${amount} has been ${type}ed ${type === "credit" ? "to" : "from"} your wallet. Reason: ${reason}`,
        type: type === "credit" ? "success" : "warning"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Balance updated successfully");
      setSelectedUser(null);
      setAmount("");
      setReason("");
    }
  });

  const handleUpdate = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (!reason) {
      toast.error("Enter reason for adjustment");
      return;
    }
    updateMutation.mutate({ user: selectedUser, amount: val, type, reason });
  };

  const filteredUsers = users.filter((u: any) => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Balance Management</h1>
        <p className="text-slate-500 mt-1">Manually adjust user wallet balances</p>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search users..." 
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
                  <th className="text-left p-4 font-medium text-slate-600">User</th>
                  <th className="text-left p-4 font-medium text-slate-600">Current Balance</th>
                  <th className="text-left p-4 font-medium text-slate-600">Total Deposited</th>
                  <th className="text-left p-4 font-medium text-slate-600">Total Withdrawn</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-slate-900">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">₹{(u.wallet_balance || 0).toLocaleString("en-IN")}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-emerald-600">₹{(u.total_deposited || 0).toLocaleString("en-IN")}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-red-600">₹{(u.total_withdrawn || 0).toLocaleString("en-IN")}</p>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(u)}>
                        Adjust Balance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet Balance</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-sm text-slate-500">User: <span className="font-medium text-slate-900">{selectedUser.full_name}</span></p>
                <p className="text-sm text-slate-500">Current Balance: <span className="font-bold text-slate-900">₹{(selectedUser.wallet_balance || 0).toLocaleString("en-IN")}</span></p>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={type === "credit" ? "default" : "outline"}
                    onClick={() => setType("credit")}
                    className="flex-1"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" /> Credit
                  </Button>
                  <Button 
                    variant={type === "debit" ? "default" : "outline"}
                    onClick={() => setType("debit")}
                    className="flex-1"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" /> Debit
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Input 
                  placeholder="e.g. Compensation, Correction, Bonus" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {type === "credit" ? "Add Funds" : "Deduct Funds"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
