import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  CreditCard,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BankAccounts() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: ""
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ["myBankAccounts", user?.email],
    queryFn: async () => (await ke.entities.BankAccount.list()).filter((b: any) => b.user_email === user?.email),
    enabled: !!user
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => await ke.entities.BankAccount.create({
      ...data,
      user_email: user?.email,
      is_primary: bankAccounts.length === 0
    }),
    onSuccess: () => {
      toast.success("Bank account added successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["myBankAccounts"] });
      setIsAddOpen(false);
      setFormData({
        account_holder_name: "",
        account_number: "",
        ifsc_code: "",
        bank_name: ""
      });
    },
    onError: (error) => {
      console.error("Bank account error:", error);
      toast.error("Failed to add bank account. Please try again.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ke.entities.BankAccount.delete(id),
    onSuccess: () => {
      toast.success("Bank account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["myBankAccounts"] });
      setDeleteId(null);
    }
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all other primary accounts
      for (const acc of bankAccounts) {
        if (acc.is_primary) {
          await ke.entities.BankAccount.update(acc.id, { is_primary: false });
        }
      }
      // Set the new primary account
      await ke.entities.BankAccount.update(id, { is_primary: true });
    },
    onSuccess: () => {
      toast.success("Primary account updated");
      queryClient.invalidateQueries({ queryKey: ["myBankAccounts"] });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.ifsc_code.length !== 11) {
      toast.error("IFSC code must be 11 characters");
      return;
    }
    await addMutation.mutateAsync(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-indigo-200 text-sm font-semibold tracking-wide uppercase">FastPayz Banking</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Bank Accounts</h1>
              <p className="text-indigo-200 text-lg">Manage your withdrawal bank accounts</p>
            </div>
            
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-purple-700 hover:bg-purple-50 font-bold shadow-xl h-14 px-6 border-0">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    Add Bank Account
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Enter your bank details for withdrawals
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-base font-bold">Account Holder Name *</Label>
                    <Input 
                      placeholder="Enter name as per bank" 
                      value={formData.account_holder_name}
                      onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                      className="h-12 border-2 border-purple-300 focus:border-purple-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-bold">Account Number *</Label>
                    <Input 
                      placeholder="Enter account number" 
                      value={formData.account_number}
                      onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                      className="h-12 border-2 border-purple-300 focus:border-purple-600 font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-bold">IFSC Code *</Label>
                    <Input 
                      placeholder="Enter IFSC code" 
                      value={formData.ifsc_code}
                      onChange={(e) => setFormData({...formData, ifsc_code: e.target.value.toUpperCase()})}
                      maxLength={11}
                      className="h-12 border-2 border-purple-300 focus:border-purple-600 font-mono uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-bold">Bank Name *</Label>
                    <Input 
                      placeholder="Enter bank name" 
                      value={formData.bank_name}
                      onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                      className="h-12 border-2 border-purple-300 focus:border-purple-600"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addMutation.isPending}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold text-lg shadow-xl border-0"
                    >
                      {addMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </div>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Add Account
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {bankAccounts.length === 0 ? (
          <Card className="border-0 shadow-2xl shadow-purple-200/50 overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-6">
                <Building2 className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Bank Accounts</h3>
              <p className="text-lg text-slate-600 mb-6">Add a bank account to request withdrawals</p>
              <Button 
                onClick={() => setIsAddOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 font-bold h-14 px-8 shadow-xl border-0"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5">
            {bankAccounts.map((account: any) => (
              <Card key={account.id} className="border-0 shadow-2xl shadow-purple-200/50 overflow-hidden hover:shadow-purple-300/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl">
                        <CreditCard className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-extrabold text-slate-900">{account.bank_name}</h3>
                          {account.is_primary && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1 font-bold shadow-lg">
                              <Star className="w-3 h-3 mr-1 fill-white" />
                              Primary
                            </Badge>
                          )}
                          {account.is_verified && (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1 font-bold shadow-lg">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-bold text-slate-700 mb-3">{account.account_holder_name}</p>
                        <div className="flex flex-wrap gap-4 text-sm font-semibold">
                          <div className="px-3 py-2 bg-purple-50 rounded-lg border-2 border-purple-200">
                            <span className="text-purple-700">A/C: ****{account.account_number.slice(-4)}</span>
                          </div>
                          <div className="px-3 py-2 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                            <span className="text-indigo-700">IFSC: {account.ifsc_code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!account.is_primary && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPrimaryMutation.mutate(account.id)}
                          disabled={setPrimaryMutation.isPending}
                          className="border-2 border-purple-400 text-purple-700 hover:bg-purple-50 font-bold"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Set Primary
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-2 border-red-400 text-red-600 hover:bg-red-50 font-bold"
                        onClick={() => setDeleteId(account.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-3 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-xl">
          <CardContent className="p-5">
            <div className="flex gap-3">
              <AlertCircle className="w-7 h-7 text-yellow-700 flex-shrink-0" />
              <div className="text-sm text-yellow-900">
                <p className="font-extrabold text-base mb-2">📌 Important Information</p>
                <ul className="list-disc list-inside space-y-2 font-semibold">
                  <li>Ensure account details are correct to avoid withdrawal delays</li>
                  <li>Primary account will be used as default for withdrawals</li>
                  <li>Account holder name must match your registered name</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold">Delete Bank Account?</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                This action cannot be undone. Are you sure you want to delete this bank account?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-500 hover:bg-red-600 font-bold border-0"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
