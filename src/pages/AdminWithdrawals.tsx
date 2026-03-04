import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye,
  ArrowDownRight,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminWithdrawals() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["allWithdrawals"],
    queryFn: () => ke.entities.Withdrawal.list("-created_date")
  });

  const updateMutation = useMutation({
    mutationFn: async ({ withdrawalId, status, reason }: { withdrawalId: string, status: string, reason?: string }) => {
      const withdrawal = withdrawals.find((w: any) => w.id === withdrawalId);
      
      await ke.entities.Withdrawal.update(withdrawalId, {
        status,
        rejection_reason: reason,
        processed_by: (await ke.auth.me()).email,
        processed_at: new Date().toISOString()
      });

      if (status === "completed") {
        // Notify user
        await ke.entities.Notification.create({
          user_email: withdrawal.user_email,
          title: "Withdrawal Completed",
          message: `Your withdrawal of ₹${withdrawal.amount?.toLocaleString('en-IN')} has been processed and sent to your bank account.`,
          type: "success"
        });
      } else if (status === "rejected") {
        // Refund user balance
        const users = await ke.entities.User.list();
        const user = users.find((u: any) => u.email === withdrawal.user_email);
        if (user) {
          await ke.entities.User.update(user.id, { 
            wallet_balance: (user.wallet_balance || 0) + withdrawal.amount 
          });
        }

        await ke.entities.Notification.create({
          user_email: withdrawal.user_email,
          title: "Withdrawal Rejected",
          message: `Your withdrawal of ₹${withdrawal.amount?.toLocaleString('en-IN')} was rejected and refunded to your wallet. Reason: ${reason}`,
          type: "error"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Withdrawal updated successfully");
      setSelectedWithdrawal(null);
      setRejectionReason("");
      setActionType(null);
    }
  });

  const handleAction = (type: "approve" | "reject") => {
    if (type === "approve") {
      updateMutation.mutate({ withdrawalId: selectedWithdrawal.id, status: "completed" });
    } else {
      if (!rejectionReason) {
        toast.error("Please provide rejection reason");
        return;
      }
      updateMutation.mutate({ withdrawalId: selectedWithdrawal.id, status: "rejected", reason: rejectionReason });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      processing: "bg-blue-100 text-blue-700"
    };
    return styles[status] || styles.pending;
  };

  const filteredWithdrawals = withdrawals.filter((w: any) => {
    const matchesFilter = filter === "all" || w.status === filter;
    const matchesSearch = !search || w.user_email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = withdrawals.filter((w: any) => w.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawal Management</h1>
          <p className="text-slate-500 mt-1">Review and process withdrawal requests</p>
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
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by email..." 
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
                  <th className="text-left p-4 font-medium text-slate-600">Bank Details</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Date</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredWithdrawals.map((wdr: any) => (
                  <tr key={wdr.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{wdr.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-red-600">₹{wdr.amount?.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-slate-500">Fee: ₹{wdr.fee || 0}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium">{wdr.bank_name}</p>
                      <p className="text-xs text-slate-500 font-mono">****{wdr.account_number?.slice(-4)}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadge(wdr.status)}>{wdr.status}</Badge>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(wdr.created_date), "dd MMM, hh:mm a")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedWithdrawal(wdr)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {wdr.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => { setSelectedWithdrawal(wdr); setActionType("approve"); }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => { setSelectedWithdrawal(wdr); setActionType("reject"); }}
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

      <Dialog open={!!selectedWithdrawal} onOpenChange={() => { setSelectedWithdrawal(null); setActionType(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Complete Withdrawal" : 
               actionType === "reject" ? "Reject Withdrawal" : 
               "Withdrawal Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Amount to Pay</p>
                  <p className="font-bold text-lg text-red-600">₹{selectedWithdrawal.amount?.toLocaleString("en-IN")}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Fee Deducted</p>
                  <p className="font-medium">₹{selectedWithdrawal.fee || 0}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">User Email</p>
                  <p className="font-medium">{selectedWithdrawal.user_email}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                <p className="text-sm font-medium text-blue-900">Bank Account Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-blue-600 text-xs">Bank Name</p>
                    <p className="font-medium">{selectedWithdrawal.bank_name}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs">Account Holder</p>
                    <p className="font-medium">{selectedWithdrawal.account_holder_name}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs">Account Number</p>
                    <p className="font-mono font-medium">{selectedWithdrawal.account_number}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs">IFSC Code</p>
                    <p className="font-mono font-medium">{selectedWithdrawal.ifsc_code}</p>
                  </div>
                </div>
              </div>

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

              {selectedWithdrawal.status !== "pending" && selectedWithdrawal.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">Rejection Reason</p>
                  <p className="text-red-700">{selectedWithdrawal.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {actionType === "approve" && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve")} disabled={updateMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Completed
              </Button>
            )}
            {actionType === "reject" && (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleAction("reject")} disabled={updateMutation.isPending}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject & Refund
              </Button>
            )}
            {!actionType && selectedWithdrawal?.status === "pending" && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setActionType("reject")}>Reject</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setActionType("approve")}>Complete</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
