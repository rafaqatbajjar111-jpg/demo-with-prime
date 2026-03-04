import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Ban, 
  CheckCircle2, 
  Wallet, 
  Shield,
  Loader2,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [blockUser, setBlockUser] = useState<any>(null);
  const [blockReason, setBlockReason] = useState("");
  const [walletUser, setWalletUser] = useState<any>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletAction, setWalletAction] = useState<"add" | "subtract">("add");

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list("-created_date")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => ke.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User updated successfully");
      setBlockUser(null);
      setWalletUser(null);
      setBlockReason("");
      setWalletAmount("");
    }
  });

  const handleBlock = async () => {
    const isBlocking = !blockUser.is_blocked;
    updateMutation.mutate({
      id: blockUser.id,
      data: { is_blocked: isBlocking, block_reason: isBlocking ? blockReason : "" }
    });
  };

  const handleWalletUpdate = () => {
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    const currentBalance = walletUser.wallet_balance || 0;
    const newBalance = walletAction === "add" ? currentBalance + amount : Math.max(0, currentBalance - amount);
    updateMutation.mutate({
      id: walletUser.id,
      data: { wallet_balance: newBalance }
    });
  };

  const filteredUsers = users.filter((u: any) => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
        <p className="text-slate-500 mt-1">Manage all registered users</p>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name or email..." 
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
                  <th className="text-left p-4 font-medium text-slate-600">Balance</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Joined</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900">
                            <AvatarFallback className="bg-transparent text-white font-medium">
                              {u.full_name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{u.full_name}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">₹{(u.wallet_balance || 0).toLocaleString("en-IN")}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {u.is_blocked ? (
                            <Badge className="bg-red-100 text-red-700">Blocked</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          )}
                          {u.account_activated && (
                            <Badge className="bg-purple-100 text-purple-700">Live</Badge>
                          )}
                          {u.role === "admin" && (
                            <Badge className="bg-amber-100 text-amber-700">Admin</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500">
                        {u.created_date ? new Date(u.created_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedUser(u)}>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              updateMutation.mutate({ id: u.id, data: { account_activated: !u.account_activated } });
                            }}>
                              <Zap className="w-4 h-4 mr-2" /> {u.account_activated ? "Deactivate" : "Activate"} Account
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setWalletUser(u)}>
                              <Wallet className="w-4 h-4 mr-2" /> Update Wallet
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setBlockUser(u)}
                              className={u.is_blocked ? "text-green-600" : "text-red-600"}
                            >
                              {u.is_blocked ? (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Unblock User</>
                              ) : (
                                <><Ban className="w-4 h-4 mr-2" /> Block User</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-amber-600">
                  <AvatarFallback className="text-3xl text-white font-bold">
                    {selectedUser.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-slate-900">{selectedUser.full_name}</h3>
                <p className="text-slate-600">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Wallet Balance</p>
                  <p className="text-2xl font-bold text-slate-900">₹{(selectedUser.wallet_balance || 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Total Commission</p>
                  <p className="text-2xl font-bold text-slate-900">₹{(selectedUser.total_commission || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Referral Code</p>
                    <p className="font-medium">{selectedUser.referral_code || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Referred By</p>
                    <p className="font-medium">{selectedUser.referred_by || "-"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Live Deposit Limit</p>
                    <p className="font-medium">₹{(selectedUser.live_deposit_limit || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Joined Date</p>
                    <p className="font-medium">{selectedUser.created_date ? new Date(selectedUser.created_date).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog open={!!blockUser} onOpenChange={() => setBlockUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blockUser?.is_blocked ? "Unblock User" : "Block User"}</DialogTitle>
            <DialogDescription>
              {blockUser?.is_blocked 
                ? `Are you sure you want to unblock ${blockUser.full_name}?` 
                : `This will block ${blockUser?.full_name} from accessing the platform.`}
            </DialogDescription>
          </DialogHeader>
          {!blockUser?.is_blocked && (
            <div className="space-y-2">
              <Label>Reason for blocking</Label>
              <Textarea 
                placeholder="Enter reason..." 
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockUser(null)}>Cancel</Button>
            <Button 
              onClick={handleBlock}
              variant={blockUser?.is_blocked ? "default" : "destructive"}
              disabled={updateMutation.isPending}
            >
              {blockUser?.is_blocked ? "Unblock" : "Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wallet Update Dialog */}
      <Dialog open={!!walletUser} onOpenChange={() => setWalletUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Wallet Balance</DialogTitle>
            <DialogDescription>
              Current balance: ₹{(walletUser?.wallet_balance || 0).toLocaleString("en-IN")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant={walletAction === "add" ? "default" : "outline"}
                onClick={() => setWalletAction("add")}
                className="flex-1"
              >
                Add Money
              </Button>
              <Button 
                variant={walletAction === "subtract" ? "default" : "outline"}
                onClick={() => setWalletAction("subtract")}
                className="flex-1"
              >
                Deduct Money
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                placeholder="Enter amount" 
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletUser(null)}>Cancel</Button>
            <Button onClick={handleWalletUpdate} disabled={updateMutation.isPending}>
              Update Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
