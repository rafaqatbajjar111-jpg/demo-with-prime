import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Gift, 
  TrendingUp, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Referrals() {
  const [isCopied, setIsCopied] = useState(false);
  const { user } = useAuth();

  const { data: myReferrals = [] } = useQuery({
    queryKey: ["myReferrals", user?.email],
    queryFn: async () => (await ke.entities.Referral.list("-created_date")).filter((d: any) => d.referrer_email === user?.email),
    enabled: !!user
  });

  const referralLink = `${window.location.origin}?ref=${user?.referral_code || ""}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const stats = [
    { title: "Total Referrals", value: myReferrals.length, icon: Users, color: "from-blue-500 to-blue-600" },
    { title: "Completed", value: myReferrals.filter((r: any) => r.status === "completed").length, icon: CheckCircle2, color: "from-green-500 to-green-600" },
    { title: "Pending", value: myReferrals.filter((r: any) => r.status === "pending").length, icon: Clock, color: "from-yellow-500 to-yellow-600" },
    { title: "Total Earnings", value: `₹${(user?.referral_earnings || 0).toLocaleString('en-IN')}`, icon: Gift, color: "from-purple-500 to-purple-600" }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Program</h1>
        <p className="text-slate-500 mt-1">Invite friends and earn rewards</p>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription className="text-purple-100">Share this link with friends to earn rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button onClick={handleCopy} className="bg-white text-purple-600 hover:bg-white/90 border-0">
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <p className="text-sm text-purple-100">🎁 <strong>Earn ₹100</strong> when your referral makes their first deposit</p>
            <p className="text-sm text-purple-100 mt-1">🎉 Your friend gets <strong>₹50 bonus</strong> on their first deposit</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={cn("p-3 bg-gradient-to-br rounded-xl", stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>Track your referred users</CardDescription>
        </CardHeader>
        <CardContent>
          {myReferrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No referrals yet</p>
              <p className="text-sm text-slate-400 mt-1">Share your referral link to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myReferrals.map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{ref.referred_email}</p>
                      <p className="text-sm text-slate-500">Joined {format(new Date(ref.created_date), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ref.status === "completed" && (
                      <span className="text-sm text-green-600 font-medium">+₹{ref.reward_amount}</span>
                    )}
                    <Badge className={cn(
                      ref.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {ref.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
