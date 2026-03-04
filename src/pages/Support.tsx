import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ke } from '../lib/sdk';
import { 
  Headphones, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Send,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from '../components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Support() {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    message: "",
    category: "account"
  });

  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: myTickets = [], isLoading } = useQuery({
    queryKey: ["myTickets", user?.email],
    queryFn: async () => (await ke.entities.SupportTicket.list("-created_date")).filter((t: any) => t.user_email === user?.email),
    enabled: !!user
  });

  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: async () => (await ke.entities.SiteSettings.list())[0] || {}
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => ke.entities.SupportTicket.create({
      ...data,
      user_email: user?.email,
      status: "open"
    }),
    onSuccess: () => {
      toast.success("Support ticket created successfully!");
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
      setIsNewTicketOpen(false);
      setNewTicket({ subject: "", message: "", category: "account" });
    }
  });

  const getStatusInfo = (status: string) => {
    const infos: Record<string, any> = {
      open: { class: "bg-blue-100 text-blue-700 border-blue-200", icon: MessageSquare },
      in_progress: { class: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      resolved: { class: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
      closed: { class: "bg-slate-100 text-slate-700 border-slate-200", icon: CheckCircle2 }
    };
    return infos[status] || infos.open;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) {
      toast.error("Please fill all fields");
      return;
    }
    createMutation.mutate(newTicket);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support</h1>
          <p className="text-slate-500 mt-1">Get help with your account</p>
        </div>
        
        <Dialog open={isNewTicketOpen} onOpenChange={setIsNewTicketOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-0">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Describe your issue and we'll get back to you</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newTicket.category} 
                  onValueChange={(val) => setNewTicket({...newTicket, category: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit Issue</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal Issue</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input 
                  placeholder="Brief description of your issue" 
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea 
                  placeholder="Explain your issue in detail..." 
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                  className="h-32"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Send className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-gradient-to-r from-slate-900 to-slate-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <p className="text-slate-300 text-sm">Email</p>
                <p className="text-white font-medium">{settings.contact_email}</p>
              </a>
            )}
            {settings?.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <p className="text-slate-300 text-sm">Phone</p>
                <p className="text-white font-medium">{settings.contact_phone}</p>
              </a>
            )}
            {settings?.whatsapp_link && (
              <a href={settings.whatsapp_link} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <p className="text-slate-300 text-sm">WhatsApp</p>
                <p className="text-white font-medium">Chat Now</p>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {myTickets.length === 0 ? (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="p-12 text-center">
            <Headphones className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Support Tickets</h3>
            <p className="text-slate-500 mb-4">Create a ticket if you need help</p>
            <Button onClick={() => setIsNewTicketOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myTickets.map((ticket: any) => {
            const statusInfo = getStatusInfo(ticket.status);
            const StatusIcon = statusInfo.icon;
            const isExpanded = selectedTicket?.id === ticket.id;

            return (
              <Card 
                key={ticket.id} 
                className="border-0 shadow-lg shadow-slate-200/50 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => setSelectedTicket(isExpanded ? null : ticket)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={statusInfo.class}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900">{ticket.subject}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {format(new Date(ticket.created_date), "dd MMM yyyy, hh:mm a")}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 mb-1">Your Message</p>
                        <p className="text-slate-700">{ticket.message}</p>
                      </div>
                      {ticket.admin_reply && (
                        <div className="bg-emerald-50 rounded-xl p-4">
                          <p className="text-xs text-emerald-600 mb-1">
                            Admin Reply • {ticket.replied_at && format(new Date(ticket.replied_at), "dd MMM, hh:mm a")}
                          </p>
                          <p className="text-slate-700">{ticket.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
