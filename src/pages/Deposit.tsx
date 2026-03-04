import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  QrCode, 
  Building2, 
  Copy, 
  Check, 
  Upload, 
  ArrowRight, 
  AlertCircle,
  Wallet,
  CheckCircle2,
  Sparkles,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function Deposit() {
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState("");
  const [method, setMethod] = useState("upi");

  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => (await ke.entities.SiteSettings.list())[0] || {}
  });

  const depositMutation = useMutation({
    mutationFn: async (data: any) => await ke.entities.SecurityDeposit.create(data),
    onSuccess: () => {
      toast.success("Deposit request submitted successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["myDeposits"] });
      setAmount("");
      setUtr("");
      setScreenshot(null);
    },
    onError: (error) => {
      console.error("Deposit error:", error);
      toast.error("Failed to submit deposit request. Please try again.");
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const { file_url } = await ke.integrations.Core.UploadFile({ file });
        setScreenshot(file_url);
        toast.success("Screenshot uploaded successfully!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload screenshot");
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (!numAmount || isNaN(numAmount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount < (settings?.min_deposit || 2000)) {
      toast.error(`Minimum deposit is ₹${settings?.min_deposit || 2000}`);
      return;
    }

    if (numAmount > (settings?.max_deposit || 100000)) {
      toast.error(`Maximum deposit is ₹${settings?.max_deposit || 100000}`);
      return;
    }

    if (!utr || utr.trim() === "") {
      toast.error("Please enter transaction ID / UTR number");
      return;
    }

    await depositMutation.mutateAsync({
      user_email: user?.email,
      amount: numAmount,
      payment_method: method,
      transaction_id: utr.trim(),
      screenshot_url: screenshot || "",
      status: "pending"
    });
  };

  const quickAmounts = settings?.quick_amounts 
    ? settings.quick_amounts.split(',').map((a: string) => parseInt(a.trim())).filter((a: number) => !isNaN(a) && a >= 2000)
    : [2000, 5000, 10000, 20000, 50000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 p-6 md:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span className="text-purple-200 text-sm font-semibold tracking-wide uppercase">FastPayz Wallet</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Security Deposit</h1>
            <p className="text-purple-200 text-lg">Quick & Secure Payment Processing</p>
            
            <div className="mt-6 p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm mb-1 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Current Balance
                  </p>
                  <p className="text-4xl font-extrabold text-white">₹{(user?.wallet_balance || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="hidden md:block p-4 bg-white/10 rounded-xl">
                  <Wallet className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl shadow-purple-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <QrCode className="w-6 h-6" />
              Select Payment Method
            </CardTitle>
            <CardDescription className="text-purple-100">Choose your preferred payment option</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={method} onValueChange={setMethod}>
              <TabsList className="grid w-full grid-cols-2 h-14 bg-gradient-to-r from-purple-100 to-indigo-100 p-1 rounded-xl">
                <TabsTrigger 
                  value="upi" 
                  disabled={!settings?.upi_enabled}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-base font-semibold rounded-lg transition-all"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  UPI Payment
                </TabsTrigger>
                <TabsTrigger 
                  value="imps" 
                  disabled={!settings?.imps_enabled}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white text-base font-semibold rounded-lg transition-all"
                >
                  <Building2 className="w-5 h-5 mr-2" />
                  Bank Transfer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upi" className="mt-6 space-y-6">
                {settings?.upi_qr_code && (
                  <div className="flex justify-center">
                    <div className="p-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl border-4 border-purple-300 shadow-xl">
                      <img src={settings.upi_qr_code} alt="UPI QR Code" className="w-56 h-56 md:w-64 md:h-64 rounded-2xl shadow-lg" />
                      <p className="text-center mt-4 text-sm font-semibold text-purple-700">Scan with any UPI app</p>
                    </div>
                  </div>
                )}
                
                {settings?.upi_id && (
                  <div className="p-5 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-purple-700 font-bold mb-2 uppercase tracking-wider">UPI ID</p>
                        <p className="font-mono font-bold text-xl text-slate-900">{settings.upi_id}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        onClick={() => copyToClipboard(settings.upi_id, "upi")}
                        className="border-2 border-purple-400 hover:bg-purple-200 transition-all"
                      >
                        {copiedId === "upi" ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-purple-600" />}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="imps" className="mt-6 space-y-4">
                {[
                  { label: "Account Name", value: settings?.imps_account_name, key: "name" },
                  { label: "Account Number", value: settings?.imps_account_number, key: "acc" },
                  { label: "IFSC Code", value: settings?.imps_ifsc, key: "ifsc" },
                  { label: "Bank Name", value: settings?.imps_bank_name, key: "bank" }
                ].map((item) => (
                  <div key={item.key} className="p-5 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-purple-700 font-bold mb-2 uppercase tracking-wider">{item.label}</p>
                        <p className="font-mono font-semibold text-lg text-slate-900">{item.value || "-"}</p>
                      </div>
                      {item.value && (
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={() => copyToClipboard(item.value, item.key)}
                          className="border-2 border-purple-400 hover:bg-purple-200 transition-all"
                        >
                          {copiedId === item.key ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-purple-600" />}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl shadow-purple-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <ArrowRight className="w-6 h-6" />
              Submit Deposit Request
            </CardTitle>
            <CardDescription className="text-indigo-100">Fill in the details after making payment</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Amount (₹) <span className="text-red-500">*</span>
                </Label>
                <Input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl h-16 border-3 border-purple-300 focus:border-purple-600 rounded-xl font-bold shadow-lg"
                  required
                />
                <div className="flex flex-wrap gap-3">
                  {quickAmounts.map((amt: number) => (
                    <Button 
                      key={amt}
                      type="button"
                      size="lg"
                      onClick={() => setAmount(amt.toString())}
                      className={cn(
                        "font-bold shadow-lg border-3 transition-all",
                        amount === amt.toString() 
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 transform scale-105" 
                          : "bg-white border-purple-300 text-purple-700 hover:bg-purple-50"
                      )}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-semibold text-purple-900">
                    Min: ₹{settings?.min_deposit || 2000} | Max: ₹{settings?.max_deposit?.toLocaleString('en-IN') || "1,00,000"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Transaction ID / UTR Number <span className="text-red-500">*</span>
                </Label>
                <Input 
                  placeholder="Enter 12-digit UTR number" 
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="h-14 border-3 border-purple-300 focus:border-purple-600 rounded-xl font-mono text-lg shadow-lg"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-bold text-slate-900">Payment Screenshot (Optional)</Label>
                <div className="border-4 border-dashed border-purple-400 rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-indigo-50">
                  {screenshot ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600 mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-bold text-lg">Screenshot uploaded successfully!</span>
                      </div>
                      <div className="relative">
                        <img src={screenshot} alt="Payment Screenshot" className="max-h-64 mx-auto rounded-2xl shadow-2xl border-4 border-purple-300" />
                        <Button 
                          type="button" 
                          size="icon" 
                          onClick={() => setScreenshot(null)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="screenshot-upload" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label htmlFor="screenshot-upload" className="cursor-pointer block">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-xl">
                          <Upload className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-xl font-bold text-slate-900 mb-2">
                          {isUploading ? "Uploading..." : "Click to upload payment screenshot"}
                        </p>
                        <p className="text-base text-slate-600 font-semibold">PNG, JPG up to 10MB</p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 border-3 border-indigo-400 rounded-2xl p-5 shadow-lg">
                <div className="flex gap-3">
                  <AlertCircle className="w-7 h-7 text-indigo-700 flex-shrink-0" />
                  <div className="text-sm text-indigo-900">
                    <p className="font-extrabold text-base mb-2">⚠️ Important Information</p>
                    <p className="font-semibold">
                      Please ensure the UTR number is correct. Incorrect details may delay your deposit approval. 
                      Our team will verify and approve within 24 hours.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 text-xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 shadow-2xl shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 border-0"
                disabled={depositMutation.isPending || isUploading}
              >
                {depositMutation.isPending ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Request...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    Submit Deposit Request
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
