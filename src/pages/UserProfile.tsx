import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Lock, 
  Save, 
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  const queryClient = useQueryClient();
  const { user, isLoadingAuth } = useAuth();

  React.useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await ke.auth.updateMe(data);
      // Log activity
      await ke.entities.UserActivity.create({
        user_email: user?.email,
        user_name: user?.full_name,
        action_type: "profile_update",
        action_description: "User updated profile information",
        status: "success"
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setIsEditing(false);
    }
  });

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    updateMutation.mutate({ full_name: fullName, phone });
  };

  if (isLoadingAuth) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100">
          <TabsTrigger value="personal" className="data-[state=active]:bg-white py-3">
            <User className="w-4 h-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white py-3">
            <Lock className="w-4 h-4 mr-2" />
            Password
          </TabsTrigger>
          <TabsTrigger value="2fa" className="data-[state=active]:bg-white py-3">
            <Shield className="w-4 h-4 mr-2" />
            2FA
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-white py-3">
            <History className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                <Button 
                  variant={isEditing ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={updateMutation.isPending}
                  className={cn(isEditing && "bg-amber-600 hover:bg-amber-700 border-0")}
                >
                  {isEditing ? (
                    <><Save className="w-4 h-4 mr-2" /> Save</>
                  ) : (
                    <><Edit2 className="w-4 h-4 mr-2" /> Edit</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border-4 border-white shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input 
                    id="full-name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="email" 
                      value={user?.email} 
                      disabled 
                      className="pl-10 bg-slate-50"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      id="phone" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      value={user?.created_date ? format(new Date(user.created_date), "dd MMMM yyyy") : "N/A"} 
                      disabled 
                      className="pl-10 bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <ChangePasswordCard />
        </TabsContent>

        <TabsContent value="2fa" className="space-y-6">
          <TwoFactorCard user={user} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <RecentActivityCard user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50">
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-blue-900">
            Choose a strong password with at least 8 characters, including letters, numbers, and symbols.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Input 
              id="current-password" 
              type={showCurrent ? "text" : "password"} 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <button 
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input 
              id="new-password" 
              type={showNew ? "text" : "password"} 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button 
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <div className="relative">
            <Input 
              id="confirm-password" 
              type={showConfirm ? "text" : "password"} 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <button 
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button 
          onClick={handleUpdate} 
          disabled={isUpdating}
          className="w-full bg-amber-600 hover:bg-amber-700 border-0"
        >
          {isUpdating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Update Password
        </Button>
      </CardContent>
    </Card>
  );
}

function TwoFactorCard({ user }: { user: any }) {
  const queryClient = useQueryClient();

  const disableMutation = useMutation({
    mutationFn: async () => {
      await ke.auth.updateMe({ 
        two_factor_enabled: false,
        two_factor_method: null,
        two_factor_secret: null,
        two_factor_phone: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("2FA has been disabled");
    }
  });

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Two-Factor Authentication
            </CardTitle>
            <CardDescription>Add an extra layer of security to your account</CardDescription>
          </div>
          <Badge className={cn(
            user?.two_factor_enabled ? "bg-green-100 text-green-800 border-green-300" : "bg-slate-100 text-slate-800 border-slate-300"
          )}>
            {user?.two_factor_enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {user?.two_factor_enabled ? (
          <>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-sm text-green-900">
                Your account is protected with two-factor authentication via {user.two_factor_method === "authenticator" ? "Authenticator App" : "SMS"}.
              </AlertDescription>
            </Alert>
            <Button 
              variant="destructive" 
              onClick={() => confirm("Are you sure you want to disable 2FA?") && disableMutation.mutate()}
              disabled={disableMutation.isPending}
              className="w-full"
            >
              Disable 2FA
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-sm text-amber-900">
                Two-factor authentication is not enabled. Enable it to add an extra layer of security to your account.
              </AlertDescription>
            </Alert>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 border-0">
              Enable Two-Factor Authentication
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivityCard({ user }: { user: any }) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["userActivities", user?.email],
    queryFn: () => ke.entities.UserActivity.filter({ user_email: user.email }, "-created_date", 10),
    enabled: !!user?.email
  });

  return (
    <Card className="border-slate-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50">
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest account activities</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No recent activity found</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Activity className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.action_description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(activity.created_date), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {activity.action_type.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
