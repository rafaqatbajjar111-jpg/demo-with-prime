import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  ArrowDownToLine, 
  Wallet, 
  Building2, 
  ArrowRight, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Withdrawal() {
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState("");
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => (await ke.entities.SiteSettings.list())[0] || {}
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["myBankAccounts", user?.email],
    queryFn: async () => (await ke.entities.BankAccount.list()).filter((b: any) => b.user_email === user?.email),
    enabled: !!user
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: any) => {
      const me = await ke.auth.me();
      const currentBalance = me.wallet_balance || 0;
      
      // Deduct balance immediately (optimistic update handled by server logic usually, but here we do it explicitly)
      const newBalance = currentBalance - data.amount;
      await ke.auth.updateMe({ wallet_balance: newBalance });

      // Check for auto-approval
      const siteSettings = (await ke.entities.SiteSettings.list())[0] || {};
      let status = "pending";
      let processedAt = null;
      let utr = null;

      if (siteSettings.auto_approve_withdrawals && data.amount <= (siteSettings.auto_approve_withdrawal_limit || 5000)) {
        status = "completed";
        processedAt = new Date().toISOString();
        utr = "AUTO" + Date.now().toString().slice(-10);
        
        // Update total withdrawn
        await ke.entities.User.update(me.id, { total_withdrawn: (me.total_withdrawn || 0) + data.amount });
        
        // Send success email
        await ke.integrations.Core.SendEmail({
          to: me.email,
          subject: "✅ Withdrawal Auto-Approved",
          body: `
            <h2>Withdrawal Completed</h2>
            <p>Your withdrawal has been automatically approved and processed:</p>
            <p><strong>Amount:</strong> ₹${data.amount.toLocaleString('en-IN')}</p>
            <p><strong>UTR:</strong> ${utr}</p>
            <p><strong>Status:</strong> Completed</p>
          `
        });
      } else {
        // Send pending email
        await ke.integrations.Core.SendEmail({
          to: me.email,
          subject: "📤 Withdrawal Request Submitted",
          body: `
            <h2>Withdrawal Request</h2>
            <p>Your withdrawal request has been submitted:</p>
            <p><strong>Amount:</strong> ₹${data.amount.toLocaleString('en-IN')}</p>
            <p><strong>Status:</strong> Pending</p>
            <p>Your request will be processed within 24 hours.</p>
          `
        });
      }

      return await ke.entities.Withdrawal.create({
        ...data,
        status,
        processed_at: processedAt,
        utr_number: utr,
        processed_by: status === "completed" ? "AUTO-SYSTEM" : null
      });
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["myWithdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setAmount("");
      setBankId("");
    },
    onError: (error) => {
      console.error("Withdrawal error:", error);
      toast.error("Failed to submit withdrawal request");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const balance = user?.wallet_balance || 0;
    const minWdr = settings?.min_withdrawal || 500;
    const maxWdr = settings?.max_withdrawal || 50000;
    const chargePercent = settings?.withdrawal_charge_percent || 0;
    const charge = (numAmount * chargePercent) / 100;

    if (numAmount < minWdr) {
      toast.error(`Minimum withdrawal is ₹${minWdr}`);
      return;
    }

    if (numAmount > maxWdr) {
      toast.error(`Maximum withdrawal is ₹${maxWdr.toLocaleString('en-IN')}`);
      return;
    }

    if (numAmount + charge > balance) {
      toast.error("Insufficient wallet balance");
      return;
    }

    if (!bankId) {
      toast.error("Please select a bank account");
      return;
    }

    withdrawMutation.mutate({
      user_email: user?.email,
      amount: numAmount,
      bank_account_id: bankId,
      status: "pending"
    });
  };

  const amountVal = parseFloat(amount) || 0;
  const chargePercent = settings?.withdrawal_charge_percent || 0;
  const chargeAmount = (amountVal * chargePercent) / 100;
  const finalAmount = amountVal - chargeAmount;
  
  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Request Withdrawal</h1>
        <p className="text-slate-500 mt-1">Withdraw funds to your bank account</p>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Available Balance</p>
              <p className="text-3xl font-bold mt-1">₹{(user?.wallet_balance || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
          <CardDescription>Enter amount and select bank account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                placeholder="Enter amount" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg h-12"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {quickAmounts.map((amt) => (
                  <Button 
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className={cn(
                      amount === amt.toString() && "border-emerald-500 bg-emerald-50 text-emerald-700"
                    )}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Min: ₹{settings?.min_withdrawal || 500} | Max: ₹{settings?.max_withdrawal?.toLocaleString('en-IN') || "50,000"}
              </p>
            </div>

            {amountVal > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Withdrawal Amount</span>
                  <span className="font-medium">₹{amountVal.toLocaleString('en-IN')}</span>
                </div>
                {chargePercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Charges ({chargePercent}%)</span>
                    <span className="font-medium text-red-500">-₹{chargeAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium text-slate-900">You'll Receive</span>
                  <span className="font-bold text-emerald-600">₹{finalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Select Bank Account</Label>
              {bankAccounts.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 mb-3">No bank accounts added</p>
                    <Link to="/Bank-Accounts">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bank Account
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <RadioGroup value={bankId} onValueChange={setBankId}>
                  {bankAccounts.map((bank: any) => (
                    <div key={bank.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={bank.id} id={bank.id} />
                      <Label 
                        htmlFor={bank.id}
                        className="flex-1 flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{bank.bank_name}</p>
                            <p className="text-sm text-slate-500">****{bank.account_number.slice(-4)}</p>
                          </div>
                        </div>
                        {bank.is_primary && (
                          <Badge className="bg-amber-100 text-amber-700">Primary</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Processing Time</p>
                <p>Withdrawals are usually processed within 24 hours during business days.</p>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0"
              disabled={withdrawMutation.isPending || bankAccounts.length === 0}
            >
              {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
