import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
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

export default function AdminActivation() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["allActivationRequests"],
    queryFn: () => ke.entities.AccountActivationRequest.list("-created_date")
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list()
  });

  const updateMutation = useMutation({
    mutationFn: async ({ requestId, status, reason }: { requestId: string, status: string, reason?: string }) => {
      const request = requests.find((r: any) => r.id === requestId);
      
      await ke.entities.AccountActivationRequest.update(requestId, {
        status,
        rejection_reason: reason,
        approved_by: (await ke.auth.me()).email,
        approved_at: new Date().toISOString()
      });

      if (status === "approved") {
        // Find user and update activated status
        const user = allUsers.find((u: any) => u.email === request.user_email);
        if (user) {
          await ke.entities.User.update(user.id, { account_activated: true });
        }
        
        // Notify user
        await ke.entities.Notification.create({
          user_email: request.user_email,
          title: "🎉 Account Activated!",
          message: "Your account has been activated. You will now start receiving live deposits.",
          type: "success"
        });
      } else if (status === "rejected") {
        await ke.entities.Notification.create({
          user_email: request.user_email,
          title: "❌ Activation Request Rejected",
          message: `Your activation request was rejected. Reason: ${reason}`,
          type: "error"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allActivationRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Request updated successfully");
      setSelectedRequest(null);
      setRejectionReason("");
      setActionType(null);
    }
  });

  const handleAction = (type: "approve" | "reject") => {
    if (type === "approve") {
      updateMutation.mutate({ requestId: selectedRequest.id, status: "approved" });
    } else {
      if (!rejectionReason) {
        toast.error("Please provide rejection reason");
        return;
      }
      updateMutation.mutate({ requestId: selectedRequest.id, status: "rejected", reason: rejectionReason });
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

  const filteredRequests = requests.filter((r: any) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch = !search || r.user_email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Activation Requests</h1>
          <p className="text-slate-500 mt-1">Review and approve activation requests</p>
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
                  <th className="text-left p-4 font-medium text-slate-600">Mobile</th>
                  <th className="text-left p-4 font-medium text-slate-600">Account</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Date</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{req.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-600">{req.mobile_number}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-sm">****{req.account_number?.slice(-4)}</p>
                      <p className="text-xs text-slate-500">{req.ifsc_code}</p>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadge(req.status)}>{req.status}</Badge>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(req.created_date), "dd MMM, hh:mm a")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedRequest(req)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {req.status === "pending" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => { setSelectedRequest(req); setActionType("approve"); }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => { setSelectedRequest(req); setActionType("reject"); }}
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

      <Dialog open={!!selectedRequest} onOpenChange={() => { setSelectedRequest(null); setActionType(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Activation" : 
               actionType === "reject" ? "Reject Request" : 
               "Activation Request Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">User Email</p>
                  <p className="font-medium">{selectedRequest.user_email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Account Number</p>
                  <p className="font-mono">{selectedRequest.account_number}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">IFSC Code</p>
                  <p className="font-mono">{selectedRequest.ifsc_code}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Mobile Number</p>
                  <p className="font-medium">{selectedRequest.mobile_number}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Net Banking User ID</p>
                  <p className="font-medium">{selectedRequest.net_banking_user_id || "-"}</p>
                </div>
              </div>

              {(selectedRequest.id_proof_url || selectedRequest.address_proof_url || selectedRequest.bank_statement_url || selectedRequest.selfie_url) && (
                <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                  <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Uploaded Documents
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRequest.id_proof_url && (
                      <a href={selectedRequest.id_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">ID Proof</span>
                        <ExternalLink className="w-3 h-3 ml-auto text-blue-600" />
                      </a>
                    )}
                    {selectedRequest.address_proof_url && (
                      <a href={selectedRequest.address_proof_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Address Proof</span>
                        <ExternalLink className="w-3 h-3 ml-auto text-blue-600" />
                      </a>
                    )}
                    {selectedRequest.bank_statement_url && (
                      <a href={selectedRequest.bank_statement_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Bank Statement</span>
                        <ExternalLink className="w-3 h-3 ml-auto text-blue-600" />
                      </a>
                    )}
                    {selectedRequest.selfie_url && (
                      <a href={selectedRequest.selfie_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Selfie with ID</span>
                        <ExternalLink className="w-3 h-3 ml-auto text-blue-600" />
                      </a>
                    )}
                  </div>
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

              {selectedRequest.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600">Rejection Reason</p>
                  <p className="text-red-700">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {actionType === "approve" && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve")} disabled={updateMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve & Activate Account
              </Button>
            )}
            {actionType === "reject" && (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => handleAction("reject")} disabled={updateMutation.isPending}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Request
              </Button>
            )}
            {!actionType && selectedRequest?.status === "pending" && (
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
