import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  Settings, 
  Save, 
  Globe, 
  Shield, 
  Wallet, 
  Bell,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => (await ke.entities.SiteSettings.list())[0] || {}
  });

  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (settings.id) {
        return ke.entities.SiteSettings.update(settings.id, data);
      } else {
        return ke.entities.SiteSettings.create(data);
      }
    },
    onSuccess: () => {
      toast.success("Settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    }
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">Configure global platform parameters</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isPending}
          className="bg-amber-600 hover:bg-amber-700 border-0"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100">
          <TabsTrigger value="general" className="py-3">General</TabsTrigger>
          <TabsTrigger value="financial" className="py-3">Financial</TabsTrigger>
          <TabsTrigger value="contact" className="py-3">Contact</TabsTrigger>
          <TabsTrigger value="security" className="py-3">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Site Configuration
              </CardTitle>
              <CardDescription>Basic platform information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input 
                    value={formData.site_name || ""} 
                    onChange={(e) => handleChange("site_name", e.target.value)}
                    placeholder="Bigdream"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site URL</Label>
                  <Input 
                    value={formData.site_url || ""} 
                    onChange={(e) => handleChange("site_url", e.target.value)}
                    placeholder="https://bigdream.app"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Maintenance Mode</Label>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                  <div>
                    <p className="font-medium">Enable Maintenance Mode</p>
                    <p className="text-sm text-slate-500">Prevents users from accessing the platform</p>
                  </div>
                  <Switch 
                    checked={formData.maintenance_mode || false}
                    onCheckedChange={(val) => handleChange("maintenance_mode", val)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Financial Rules
              </CardTitle>
              <CardDescription>Configure deposits, withdrawals and fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Deposit (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.min_deposit || ""} 
                    onChange={(e) => handleChange("min_deposit", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Min Withdrawal (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.min_withdrawal || ""} 
                    onChange={(e) => handleChange("min_withdrawal", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Withdrawal Fee (%)</Label>
                  <Input 
                    type="number"
                    value={formData.withdrawal_fee_percent || ""} 
                    onChange={(e) => handleChange("withdrawal_fee_percent", parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referral Bonus (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.referral_bonus || ""} 
                    onChange={(e) => handleChange("referral_bonus", parseFloat(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-4">
                <h4 className="font-semibold text-amber-900">Payment Details (Admin)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Admin UPI ID</Label>
                    <Input 
                      value={formData.admin_upi_id || ""} 
                      onChange={(e) => handleChange("admin_upi_id", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Bank Account</Label>
                    <Input 
                      value={formData.admin_bank_account || ""} 
                      onChange={(e) => handleChange("admin_bank_account", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </CardTitle>
              <CardDescription>How users can reach support</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input 
                    value={formData.contact_email || ""} 
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Phone</Label>
                  <Input 
                    value={formData.contact_phone || ""} 
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Support Link</Label>
                  <Input 
                    value={formData.whatsapp_link || ""} 
                    onChange={(e) => handleChange("whatsapp_link", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telegram Support Link</Label>
                  <Input 
                    value={formData.telegram_link || ""} 
                    onChange={(e) => handleChange("telegram_link", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Platform security and access control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border">
                <div>
                  <p className="font-medium">Auto-Approve Withdrawals</p>
                  <p className="text-sm text-slate-500">Automatically approve withdrawals below a certain amount</p>
                </div>
                <Switch 
                  checked={formData.auto_approve_withdrawals || false}
                  onCheckedChange={(val) => handleChange("auto_approve_withdrawals", val)}
                />
              </div>
              {formData.auto_approve_withdrawals && (
                <div className="space-y-2">
                  <Label>Auto-Approve Limit (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.auto_approve_limit || ""} 
                    onChange={(e) => handleChange("auto_approve_limit", parseFloat(e.target.value))}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
