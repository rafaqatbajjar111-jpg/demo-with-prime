import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye,
  Plus,
  ArrowUpRight
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
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { cn } from '../lib/utils';

export default function AdminDeposits() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const queryClient = useQueryClient();

  const { data: deposits = [], isLoading } = useQuery({
    queryKey: ["allDeposits"],
    queryFn: () => ke.entities.SecurityDeposit.list("-created_date")
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list()
  });

  const updateMutation = useMutation({
    mutationFn: async ({ depositId, status, reason }: { depositId: string, status: string, reason?: string }) => {
      const deposit = deposits.find((d: any) => d.id === depositId);
      
      await ke.entities.SecurityDeposit.update(depositId, {
        status,
        rejection_reason: reason,
        approved_by: (await ke.auth.me()).email,
        approved_at: new Date().toISOString()
      });

      if (status === "approved") {
        // Find user and update balance
        const user = allUsers.find((u: any) => u.email === deposit.user_email);
        if (user) {
          const newTotalDeposited = (user.total_deposited || 0) + deposit.amount;
          
          // Update live deposit limit based on total deposited
          let newLimit = user.live_deposit_limit || 0;
          if (deposit.amount >= 10000) newLimit = 10000000; // 1 Cr
          else if (deposit.amount >= 5000) newLimit = 500000; // 5 Lakh
          else if (deposit.amount >= 2000) newLimit = 200000; // 2 Lakh
          
          await ke.entities.User.update(user.id, { 
            wallet_balance: (user.wallet_balance || 0) + deposit.amount,
            total_deposited: newTotalDeposited,
            live_deposit_limit: newLimit
          });

          // Check for referral reward if this is the first approved deposit
          const userDeposits = deposits.filter((d: any) => d.user_email === user.email && d.status === "approved");
          if (userDeposits.length === 1 && user.referred_by) {
            const referrer = allUsers.find((u: any) => u.referral_code === user.referred_by);
            if (referrer) {
              // Reward referrer
              await ke.entities.User.update(referrer.id, {
                wallet_balance: (referrer.wallet_balance || 0) + 100,
                referral_earnings: (referrer.referral_earnings || 0) + 100
              });
              
              // Reward referred user
              await ke.entities.User.update(user.id, {
                wallet_balance: (user.wallet_balance || 0) + deposit.amount + 50
              });

              // Update referral status
              const referral = (await ke.entities.Referral.list()).find((r: any) => 
                r.referred_email === user.email && r.referrer_email === referrer.email
              );
              if (referral) {
                await ke.entities.Referral.update(referral.id, { 
                  status: "completed",
                  reward_amount: 100,
                  referred_bonus: 50
                });
              }

              await ke.entities.Notification.create({
                user_email: referrer.email,
                title: "🎉 Referral Reward",
                message: "You earned ₹100 from referral!",
                type: "success"
              });

              await ke.entities.Notification.create({
                user_email: user.email,
                title: "🎁 Referral Bonus",
                message: "You received ₹50 welcome bonus!",
                type: "success"
              });
            }
          }
        }
        
        // Notify user
        await ke.entities.Notification.create({
          user_email: deposit.user_email,
          title: "Deposit Approved",
          message: `Your deposit of ₹${deposit.amount?.toLocaleString('en-IN')} has been approved and added to your wallet.`,
          type: "success"
        });
      } else if (status === "rejected") {
        await ke.entities.Notification.create({
          user_email: deposit.user_email,
          title: "Deposit Rejected",
          message: `Your deposit of ₹${deposit.amount?.toLocaleString('en-IN')} was rejected. Reason: ${reason}`,
          type: "error"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Deposit updated successfully");
      setSelectedDeposit(null);
      setRejectionReason("");
      setActionType(null);
    }
  });

  const handleAction = (type: "approve" | "reject") => {
    if (type === "approve") {
      updateMutation.mutate({ depositId: selectedDeposit.id, status: "approved" });
    } else {
      if (!rejectionReason) {
        toast.error("Please provide rejection reason");
        return;
      }
      updateMutation.mutate({ depositId: selectedDeposit.id, status: "rejected", reason: rejectionReason });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700"
    };
    return styles[status] || styles.pending;
  };

  const filteredDeposits = deposits.filter((d: any) => {
    const matchesFilter = filter === "all" || d.status === filter;
    const matchesSearch = !search || d.user_email?.toLowerCase().includes(search.toLowerCase()) || d.transaction_id?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = deposits.filter((d: any) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deposit Management</h1>
          <p className="text-slate-500 mt-1">Manage all deposit requests</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 text-lg px-4 py-2">
            <Clock className="w-4 h-4 mr-2" />
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={filter} onValueChange={setFilter} className="flex-1">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by email or UTR..." 
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">User</th>
                  <th className="text-left p-4 font-medium text-slate-600">Amount</th>
                  <th className="text-left p-4 font-medium text-slate-600">Method</th>
                  <th className="text-left p-4 font-medium text-slate-600">UTR</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Date</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDeposits.map((dep: any) => (
                  <tr key={dep.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{dep.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-emerald-600">₹{dep.amount?.toLocaleString("en-IN")}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="uppercase">{dep.payment_method}</Badge>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-sm">{dep.transaction_id}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadge(dep.status)}>{dep.status}</Badge>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(dep.created_date), "dd MMM, hh:mm a")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedDeposit(dep)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {dep.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => { setSelectedDeposit(dep); setActionType("approve"); }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => { setSelectedDeposit(dep); setActionType("reject"); }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDeposit} onOpenChange={() => { setSelectedDeposit(null); setActionType(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Deposit" : 
               actionType === "reject" ? "Reject Deposit" : 
               "Deposit Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-bold text-lg text-emerald-600">₹{selectedDeposit.amount?.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Method</p>
                  <p className="font-medium uppercase">{selectedDeposit.payment_method}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">User Email</p>
                  <p className="font-medium">{selectedDeposit.user_email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">Transaction ID / UTR</p>
                  <p className="font-mono">{selectedDeposit.transaction_id}</p>
                </div>
              </div>

              {selectedDeposit.screenshot_url && (
                <div>
                  <Label className="text-xs text-slate-500">Screenshot</Label>
                  <a href={selectedDeposit.screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img src={selectedDeposit.screenshot_url} alt="Payment Screenshot" className="mt-2 rounded-lg max-h-48 w-full object-contain bg-slate-100" />
                  </a>
                </div>
              )}

              {actionType === "reject" && (
                <div className="space-y-2">
                  <Label>Rejection Reason</Label>
                  <Textarea 
                    placeholder="Enter reason for rejection..." 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}

              {selectedDeposit.status !== "pending" && selectedDeposit.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">Rejection Reason</p>
                  <p className="text-red-700">{selectedDeposit.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {actionType === "approve" && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve")} disabled={updateMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve & Credit Wallet
              </Button>
            )}
            {actionType === "reject" && (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleAction("reject")} disabled={updateMutation.isPending}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Deposit
              </Button>
            )}
            {!actionType && selectedDeposit?.status === "pending" && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setActionType("reject")}>Reject</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setActionType("approve")}>Approve</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
