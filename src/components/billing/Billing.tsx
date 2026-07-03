import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  CreditCard, 
  Download, 
  Mail, 
  Calendar, 
  DollarSign, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw 
} from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

interface Invoice {
  id: number;
  invoice_number: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  status: 'paid' | 'unpaid' | 'failed' | 'refunded';
  invoice_pdf_url: string | null;
  issued_at: string;
  paid_at: string | null;
  created_at: string;
  subscription?: {
    id: number;
    plan?: {
      name: string;
      billing_cycle: string;
    };
  };
  payment?: {
    payment_method: string;
    stripe_payment_intent_id: string;
  };
}

interface Subscription {
  id: number;
  stripe_subscription_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired';
  plan?: {
    name: string;
    price: string;
    billing_cycle: string;
    currency: string;
  };
}

export function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const loadBillingData = useCallback(async () => {
    try {
      const [subRes, invRes] = await Promise.all([
        api.get("/stripe/subscription-status"),
        api.get("/invoices"),
      ]);
      setSubscription(subRes.data.data.subscription || null);
      setInvoices(invRes.data.data.invoices || []);
    } catch (err: any) {
      console.error("Failed to load billing details", err);
      toast.error("Failed to load billing & invoice data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Real-time updates: refresh billing info immediately upon successful payment or invoice creation
  useSocketEvent(SOCKET_EVENTS.PAYMENT_INVOICE, () => {
    toast.success("New invoice generated!");
    loadBillingData();
  });
  useSocketEvent(SOCKET_EVENTS.SUBSCRIPTION_CREATED, () => {
    toast.success("Subscription updated!");
    loadBillingData();
  });
  useSocketEvent(SOCKET_EVENTS.PAYMENT_COMPLETED, () => {
    toast.success("Payment completed successfully!");
    loadBillingData();
  });

  const handleDownload = async (invoiceId: number, invoiceNumber: string) => {
    setDownloadingId(invoiceId);
    try {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(`Downloaded ${invoiceNumber}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleResendEmail = async (invoiceId: number) => {
    setResendingId(invoiceId);
    try {
      await api.post(`/invoices/${invoiceId}/resend`);
      toast.success("Invoice email resent successfully");
    } catch (error) {
      toast.error("Failed to resend invoice email");
    } finally {
      setResendingId(null);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | string, currency = "INR") => {
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.toUpperCase() === "INR" ? "INR" : currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(numericAmount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "active":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
            Paid
          </Badge>
        );
      case "failed":
      case "expired":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/25 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Billing & Invoices">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Find the latest successful payment invoice to show as the active subscription pricing details
  const activeInvoice = invoices.find(inv => inv.status === 'paid');

  return (
    <DashboardLayout title="Billing & Invoices">
      <div className="space-y-6 max-w-5xl">
        {/* Active Subscription Details */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-border/60 bg-card p-6 shadow-card relative overflow-hidden flex flex-col justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                  Active Subscription
                </span>
                {subscription ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                    {subscription.status === 'active' ? 'Active' : subscription.status}
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 text-[10px] font-bold uppercase tracking-wider">
                    No Active Plan
                  </Badge>
                )}
              </div>

              {subscription ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                      {subscription.plan?.name || "Premium Plan"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Next renewal date:{" "}
                      <span className="font-semibold text-foreground">
                        {formatDate(subscription.end_date)}
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Billing Price
                      </p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {formatCurrency(subscription.plan?.price || "0.00", subscription.plan?.currency)}
                        <span className="text-xs text-muted-foreground font-normal">
                          /{subscription.plan?.billing_cycle === "yearly" ? "yr" : "mo"}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Payment Method
                      </p>
                      <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1">
                        <CreditCard className="size-4 text-primary" />
                        {activeInvoice?.payment?.payment_method?.toUpperCase() || "CARD"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You do not have an active subscription. Subscribe now to enjoy unlimited, high-quality 4K streaming.
                  </p>
                  <Button className="mt-4 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white" asChild>
                    <a href="/pricing">Browse Streaming Plans</a>
                  </Button>
                </div>
              )}
            </div>

            {subscription && (
              <div className="mt-6 flex gap-3 border-t border-border/40 pt-4">
                <Button variant="outline" className="rounded-xl text-xs font-bold" asChild>
                  <a href="/pricing">Manage Subscription</a>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={loadBillingData}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="size-3.5 mr-1" />
                  Sync Status
                </Button>
              </div>
            )}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid gap-4 flex-col justify-between">
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                  Last Amount Paid
                </p>
                <p className="mt-2.5 text-2xl font-extrabold tracking-tight">
                  {activeInvoice 
                    ? formatCurrency(activeInvoice.total_amount, activeInvoice.currency) 
                    : "₹0.00"
                  }
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                {activeInvoice ? formatDate(activeInvoice.paid_at || activeInvoice.issued_at) : "No payments"}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
                  Last Transaction ID
                </p>
                <p className="mt-2.5 text-xs font-mono font-bold tracking-tight truncate text-muted-foreground">
                  {activeInvoice?.payment?.stripe_payment_intent_id || "N/A"}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="size-3 text-primary" />
                Linked to {activeInvoice?.invoice_number || "none"}
              </p>
            </div>
          </div>
        </div>

        {/* Complete Payment & Invoice History */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          <div className="border-b border-border/60 px-6 py-4 flex items-center justify-between">
            <h2 className="font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Invoice &amp; Billing History
            </h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px]">
              {invoices.length} Invoices
            </Badge>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="size-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base text-foreground">No Invoices Found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                Once you complete your first subscription payment, your full billing history will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/20 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                    <th className="px-6 py-3.5">Invoice No</th>
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Plan</th>
                    <th className="px-6 py-3.5">Amount</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {invoices.map((inv) => (
                    <tr 
                      key={inv.id} 
                      className="hover:bg-secondary/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(inv.issued_at)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {inv.subscription?.plan?.name || "Premium Monthly"}
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {formatCurrency(inv.total_amount, inv.currency)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={downloadingId === inv.id}
                            onClick={() => handleDownload(inv.id, inv.invoice_number)}
                            className="rounded-lg h-8 text-xs font-semibold border-white/10 hover:bg-white/5"
                            title="Download Invoice PDF"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="size-3 animate-spin mr-1" />
                            ) : (
                              <Download className="size-3 mr-1" />
                            )}
                            PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={resendingId === inv.id}
                            onClick={() => handleResendEmail(inv.id)}
                            className="rounded-lg h-8 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/45"
                            title="Resend Invoice Email"
                          >
                            {resendingId === inv.id ? (
                              <Loader2 className="size-3 animate-spin mr-1" />
                            ) : (
                              <Mail className="size-3 mr-1" />
                            )}
                            Resend
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
