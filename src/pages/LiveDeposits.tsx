import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Wallet, 
  Award, 
  History,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const USER_NAMES = ["Aakash", "Ajay", "Ankit", "Uttam", "Himanshu", "Aayush", "Anish", "Anmol", "Rohit", "Vikash", "Rahul", "Amit", "Sumit", "Nitin", "Vishal", "Akshay"];
const PLATFORMS = ["91 Club", "OK Win", "Yono Slots", "Jaiho Arcade", "YonoArcade", "1Win", "4xBet", "Fun88", "Daman Games", "Big Mumbai", "Color Prediction", "Aviator", "Teen Patti", "Rummy Circle"];

function generateRandomDeposit(min: number, max: number) {
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;
  const commission = Math.floor(amount * 0.1);
  const userName = USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)];
  const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
  const utr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  
  return { amount, commission, userName, platform, utr };
}

export default function LiveDeposits() {
  const [currentDeposit, setCurrentDeposit] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => (await ke.entities.SiteSettings.list())[0] || {}
  });

  const { data: myLiveDeposits = [] } = useQuery({
    queryKey: ["myLiveDeposits", user?.email],
    queryFn: async () => (await ke.entities.LiveDeposit.list("-created_date", 50)).filter((d: any) => d.user_email === user?.email),
    enabled: !!user,
    refetchInterval: 5000
  });

  const depositMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await ke.entities.LiveDeposit.create(data);
      
      // Update user stats
      const me = await ke.auth.me();
      const newTotalLive = (me.total_live_deposits || 0) + data.amount;
      
      await ke.auth.updateMe({
        live_deposit_total: (me.live_deposit_total || 0) + data.amount,
        total_commission: (me.total_commission || 0) + data.commission,
        wallet_balance: (me.wallet_balance || 0) + data.commission,
        total_live_deposits: newTotalLive
      });

      // Send notification email
      await ke.integrations.Core.SendEmail({
        to: me.email,
        subject: "🎉 New Live Deposit Received!",
        body: `
          <h2>Live Deposit Alert</h2>
          <p>You received a new deposit:</p>
          <p><strong>Amount:</strong> ₹${data.amount.toLocaleString('en-IN')}</p>
          <p><strong>Commission (10%):</strong> ₹${data.commission.toLocaleString('en-IN')}</p>
          <p><strong>Source:</strong> ${data.source}</p>
          <p><strong>Transaction ID:</strong> ${data.transaction_id}</p>
          <p>Commission has been added to your wallet balance.</p>
        `
      });

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLiveDeposits"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    }
  });

  useEffect(() => {
    if (!user?.account_activated || !settings?.live_deposit_enabled) return;

    const min = settings.live_deposit_min || 100;
    const max = settings.live_deposit_max || 1000;

    const triggerDeposit = () => {
      // Check time window (7 AM to 7 PM)
      const hour = new Date().getHours();
      if (hour < 7 || hour >= 19) return;

      // Check limit
      const currentTotal = user?.total_live_deposits || 0;
      const limit = user?.live_deposit_limit || 0;
      if (limit > 0 && currentTotal >= limit) return;

      const deposit = generateRandomDeposit(min, max);
      setCurrentDeposit(deposit);
      
      depositMutation.mutate({
        user_email: user.email,
        amount: deposit.amount,
        commission: deposit.commission,
        source: deposit.platform,
        transaction_id: deposit.utr
      });

      setTimeout(() => setCurrentDeposit(null), 3000);
    };

    // Initial trigger
    triggerDeposit();

    const interval = setInterval(triggerDeposit, (settings.live_deposit_interval || 3) * 1000);
    return () => clearInterval(interval);
  }, [user?.account_activated, user?.total_live_deposits, user?.live_deposit_limit, settings?.live_deposit_enabled, settings?.live_deposit_min, settings?.live_deposit_max, settings?.live_deposit_interval]);

  if (!user?.account_activated) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Deposits</h1>
          <p className="text-slate-500 mt-1">Real-time deposit tracking</p>
        </div>

        <Card className="border-0 shadow-lg shadow-slate-200/50 border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Account Not Activated</h3>
            <p className="text-slate-600 mb-4">Submit activation request with your bank details to start receiving live deposits</p>
            <Link to="/AccountActivation">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all border-0">
                Go to Account Activation
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-6">
            <h4 className="font-semibold text-slate-900 mb-3">How to activate:</h4>
            <ol className="space-y-2 text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">1.</span>
                <span>Go to "Account Activation" page from sidebar</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">2.</span>
                <span>Fill all your bank and card details</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">3.</span>
                <span>Submit for admin approval</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">4.</span>
                <span>Once approved, live deposits will start automatically!</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Live Deposits</h1>
        <p className="text-slate-500 mt-1">Your earnings are growing in real-time!</p>
      </div>

      <AnimatePresence>
        {currentDeposit && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">{currentDeposit.userName} - New Deposit!</p>
                  <p className="text-2xl font-bold">₹{currentDeposit.amount.toLocaleString('en-IN')}</p>
                  <p className="text-sm opacity-90">Commission: +₹{currentDeposit.commission}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">{currentDeposit.platform}</p>
                <p className="text-xs opacity-75 font-mono">UTR: {currentDeposit.utr}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-green-900">Live Deposits Active</p>
            <p className="text-sm text-green-700">Receiving deposits every {settings?.live_deposit_interval || 3} seconds</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-emerald-500 to-emerald-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Total Deposits</p>
            </div>
            <p className="text-3xl font-bold">₹{(user?.live_deposit_total || 0).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-amber-500 to-amber-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Total Commission (10%)</p>
            </div>
            <p className="text-3xl font-bold">₹{(user?.total_commission || 0).toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-br from-blue-500 to-blue-600">
          <CardContent className="p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 opacity-80" />
              <p className="text-sm opacity-90">Deposits Count</p>
            </div>
            <p className="text-3xl font-bold">{myLiveDeposits.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Recent Live Deposits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myLiveDeposits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Waiting for deposits...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
              <AnimatePresence initial={false}>
                {myLiveDeposits.map((dep: any) => (
                  <motion.div
                    key={dep.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{dep.source}</p>
                        <p className="text-xs text-slate-500 font-mono">{dep.transaction_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">+₹{dep.amount.toLocaleString('en-IN')}</p>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 mt-1">
                        Commission: ₹{dep.commission}
                      </Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(dep.created_date), "hh:mm:ss a")}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
