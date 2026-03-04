import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '@/lib/sdk';
import { 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  Search, 
  Eye,
  Send,
  User,
  Headphones
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSupport() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["allTickets"],
    queryFn: () => ke.entities.SupportTicket.list("-created_date")
  });

  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, reply }: { ticketId: string, reply: string }) => {
      await ke.entities.SupportTicket.update(ticketId, {
        admin_reply: reply,
        status: "resolved",
        replied_at: new Date().toISOString()
      });

      const ticket = tickets.find((t: any) => t.id === ticketId);
      
      // Notify user
      await ke.entities.Notification.create({
        user_email: ticket.user_email,
        title: "Support Ticket Resolved",
        message: `Admin has replied to your ticket: "${ticket.subject}"`,
        type: "info",
        link: "/Support"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTickets"] });
      toast.success("Reply sent successfully");
      setSelectedTicket(null);
      setReplyMessage("");
    }
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-slate-100 text-slate-700"
    };
    return styles[status] || styles.open;
  };

  const filteredTickets = tickets.filter((t: any) => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch = !search || t.user_email?.toLowerCase().includes(search.toLowerCase()) || t.subject?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openCount = tickets.filter((t: any) => t.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 mt-1">Manage user support requests</p>
        </div>
        {openCount > 0 && (
          <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
            <MessageSquare className="w-4 h-4 mr-2" />
            {openCount} Open
          </Badge>
        )}
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={filter} onValueChange={setFilter} className="flex-1">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by email or subject..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-600">User</th>
                  <th className="text-left p-4 font-medium text-slate-600">Subject</th>
                  <th className="text-left p-4 font-medium text-slate-600">Category</th>
                  <th className="text-left p-4 font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 font-medium text-slate-600">Date</th>
                  <th className="text-right p-4 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTickets.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{ticket.user_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-900 truncate max-w-[200px]">{ticket.subject}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="uppercase">{ticket.category}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadge(ticket.status)}>{ticket.status}</Badge>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {format(new Date(ticket.created_date), "dd MMM, hh:mm a")}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(ticket)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Support Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <User className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">User</p>
                  <p className="font-semibold text-slate-900">{selectedTicket.user_email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">{selectedTicket.subject}</h4>
                  <Badge variant="outline">{selectedTicket.category}</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
                <p className="text-xs text-slate-500 text-right">
                  Sent on {format(new Date(selectedTicket.created_date), "dd MMM yyyy, hh:mm a")}
                </p>
              </div>

              {selectedTicket.admin_reply ? (
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Admin Reply
                  </h4>
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
                  </div>
                  <p className="text-xs text-slate-500 text-right">
                    Replied on {selectedTicket.replied_at && format(new Date(selectedTicket.replied_at), "dd MMM yyyy, hh:mm a")}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Your Reply</Label>
                    <Textarea 
                      placeholder="Type your response here..." 
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="h-32"
                    />
                  </div>
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 border-0"
                    onClick={() => replyMutation.mutate({ ticketId: selectedTicket.id, reply: replyMessage })}
                    disabled={replyMutation.isPending || !replyMessage}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply & Resolve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
