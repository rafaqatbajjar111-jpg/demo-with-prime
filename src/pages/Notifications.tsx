import React from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  XCircle,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["myNotifications", user?.email],
    queryFn: async () => {
      const all = await ke.entities.Notification.list("-created_date");
      return all.filter((n: any) => n.user_email === user?.email || n.user_email === "all");
    },
    enabled: !!user
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => ke.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n: any) => !n.is_read);
      for (const n of unread) {
        await ke.entities.Notification.update(n.id, { is_read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
    }
  });

  const getTypeStyles = (type: string) => {
    const styles: Record<string, any> = {
      info: { icon: Info, color: "text-blue-500 bg-blue-100" },
      success: { icon: CheckCircle2, color: "text-green-500 bg-green-100" },
      warning: { icon: AlertCircle, color: "text-amber-500 bg-amber-100" },
      error: { icon: XCircle, color: "text-red-500 bg-red-100" }
    };
    return styles[type] || styles.info;
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification(s)` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-slate-500">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: any) => {
            const styles = getTypeStyles(notif.type);
            const Icon = styles.icon;

            return (
              <Card 
                key={notif.id} 
                className={cn(
                  "border-0 shadow-lg shadow-slate-200/50 transition-all",
                  !notif.is_read && "bg-amber-50/50 ring-1 ring-amber-200"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className={cn("p-3 rounded-xl flex-shrink-0", styles.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{notif.title}</h3>
                          <p className="text-slate-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {format(new Date(notif.created_date), "dd MMM yyyy, hh:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {notif.link && (
                            <Link to={notif.link}>
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                          )}
                          {!notif.is_read && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => markReadMutation.mutate(notif.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
