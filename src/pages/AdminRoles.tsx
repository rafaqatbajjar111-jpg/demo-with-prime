import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  Shield, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  MoreVertical, 
  Trash2, 
  Plus,
  Lock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AdminRoles() {
  const [search, setSearch] = useState("");
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => ke.entities.User.list("-created_date")
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      await ke.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User role updated successfully");
      setIsAssignOpen(false);
      setSelectedUser(null);
    }
  });

  const filteredUsers = users.filter((u: any) => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = users.filter((u: any) => u.role === "admin");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-500 mt-1">Manage administrative access and permissions</p>
        </div>
        <Button 
          onClick={() => setIsAssignOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 border-0"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Assign New Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-0 shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-lg">Admin List</CardTitle>
            <CardDescription>Users with administrative access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {admins.map((admin: any) => (
              <div key={admin.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{admin.full_name}</p>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => updateRoleMutation.mutate({ userId: admin.id, role: "user" })}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Revoke Admin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {admins.length === 0 && (
              <p className="text-center text-slate-500 py-4">No admins assigned</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-0 shadow-lg shadow-slate-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Users</CardTitle>
                <CardDescription>Manage roles for all platform users</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search users..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-600">User</th>
                    <th className="text-left p-4 font-medium text-slate-600">Current Role</th>
                    <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={u.role === "admin" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}>
                          {u.role || "user"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newR = u.role === "admin" ? "user" : "admin";
                            updateRoleMutation.mutate({ userId: u.id, role: newR });
                          }}
                        >
                          {u.role === "admin" ? "Make User" : "Make Admin"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Admin Role</DialogTitle>
            <DialogDescription>Search for a user to grant administrative privileges</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by email..." 
                onChange={(e) => {
                  const u = users.find((u: any) => u.email === e.target.value);
                  setSelectedUser(u);
                }}
                className="pl-10"
              />
            </div>
            {selectedUser && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{selectedUser.full_name}</p>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                  <Badge variant="outline">{selectedUser.role || "user"}</Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
            <Button 
              disabled={!selectedUser || selectedUser.role === "admin" || updateRoleMutation.isPending}
              onClick={() => updateRoleMutation.mutate({ userId: selectedUser.id, role: "admin" })}
              className="bg-amber-600 hover:bg-amber-700 border-0"
            >
              Grant Admin Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
