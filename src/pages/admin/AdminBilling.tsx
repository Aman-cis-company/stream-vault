import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, StatCard } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Search, 
  Download, 
  Mail, 
  Eye, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  FileSpreadsheet,
  X 
} from "lucide-react";
import { useSocketEvent } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socket";

export default function AdminBilling() {
  return (
    <Protected roles={["super_admin"]}>
      <AdminBillingPage />
    </Protected>
  );
}

interface InvoiceDetail {
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
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  subscription?: {
    id: number;
    stripe_subscription_id: string;
    plan?: {
      name: string;
      price: string;
      billing_cycle: string;
    };
  };
  payment?: {
    payment_method: string;
    stripe_payment_intent_id: string;
    stripe_session_id: string;
  };
}

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  failedPayments: number;
}

function AdminBillingPage() {
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    failedPayments: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadAdminBilling = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const { data } = await api.get(`/admin/invoices?${params.toString()}`);
      setInvoices(data.data.invoices || []);
      setTotal(data.data.total || 0);
      if (data.data.stats) {
        setStats(data.data.stats);
      }
    } catch {
      toast.error("Failed to load admin billing data");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadAdminBilling();
  }, [loadAdminBilling]);

  // Real-time updates: refresh metrics and invoice grid immediately
  useSocketEvent(SOCKET_EVENTS.PAYMENT_INVOICE, () => {
    loadAdminBilling();
  });
  useSocketEvent(SOCKET_EVENTS.SUBSCRIPTION_CREATED, () => {
    loadAdminBilling();
  });
  useSocketEvent(SOCKET_EVENTS.PAYMENT_COMPLETED, () => {
    loadAdminBilling();
  });

  const handleDownload = async (invoiceId: number, invoiceNumber: string) => {
    setActionLoadingId(invoiceId);
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
      toast.success(`Invoice ${invoiceNumber} downloaded successfully`);
    } catch (error) {
      toast.error("Failed to download PDF invoice");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendEmail = async (invoiceId: number) => {
    setActionLoadingId(invoiceId);
    try {
      await api.post(`/admin/invoices/${invoiceId}/resend`);
      toast.success("Invoice email resent successfully to the customer");
    } catch (error) {
      toast.error("Failed to resend invoice email");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get("/admin/invoices/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "invoices-export.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Billing CSV exported successfully");
    } catch {
      toast.error("Failed to export invoices CSV");
    } finally {
      setExporting(false);
    }
  };

  const openInvoiceDetails = async (invoiceId: number) => {
    try {
      const { data } = await api.get(`/admin/invoices/${invoiceId}`);
      setSelectedInvoice(data.data.invoice);
      setModalOpen(true);
    } catch {
      toast.error("Failed to load invoice details");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
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
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
            {status}
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout title="Billing &amp; Invoice Management">
      <div className="space-y-6">
        
        {/* Statistics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
          />
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            hint="Last 30 days"
            trend="up"
            icon={TrendingUp}
          />
          <StatCard
            label="Total Invoices"
            value={String(stats.totalInvoices)}
            icon={FileText}
          />
          <StatCard
            label="Paid Invoices"
            value={String(stats.paidInvoices)}
            hint={`${stats.totalInvoices ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}% success rate`}
            icon={CheckCircle2}
          />
          <StatCard
            label="Failed Payments"
            value={String(stats.failedPayments)}
            hint="Requires attention"
            trend={stats.failedPayments > 0 ? "down" : undefined}
            icon={XCircle}
          />
        </div>

        {/* Filters and Actions Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-card space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-4 flex-1">
              {/* Search */}
              <div className="space-y-1.5">
                <Label htmlFor="search" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Search Invoices
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Invoice # or User Email"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Payment Status
                </Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 rounded-xl border border-border/65 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  From Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  To Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            {/* CSV Export & Clear */}
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="h-10 rounded-xl font-bold"
              >
                Clear
              </Button>
              <Button
                disabled={exporting}
                onClick={handleExportCSV}
                className="h-10 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="size-4" />
                )}
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Grid / Table */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="size-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold text-base text-white">No Invoices Found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                No billing records match your search query or selected filter criteria.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-secondary/20 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
                      <th className="px-6 py-3.5">Invoice No</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Plan</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Total Amount</th>
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
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-white">
                              {inv.user ? `${inv.user.first_name} ${inv.user.last_name}` : "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {inv.user?.email || ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">
                          {inv.subscription?.plan?.name || "Premium Monthly"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(inv.issued_at)}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-white">
                          {formatCurrency(inv.total_amount, inv.currency)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openInvoiceDetails(inv.id)}
                              className="rounded-lg h-8 text-xs font-semibold text-muted-foreground hover:text-white hover:bg-secondary"
                              title="View Invoice Details"
                            >
                              <Eye className="size-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoadingId === inv.id}
                              onClick={() => handleDownload(inv.id, inv.invoice_number)}
                              className="rounded-lg h-8 text-xs font-semibold border-white/10 hover:bg-white/5"
                              title="Download PDF"
                            >
                              {actionLoadingId === inv.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Download className="size-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={actionLoadingId === inv.id}
                              onClick={() => handleResendEmail(inv.id)}
                              className="rounded-lg h-8 text-xs font-semibold text-muted-foreground hover:text-white"
                              title="Resend Invoice Email"
                            >
                              <Mail className="size-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="flex items-center justify-between border-t border-border/40 px-6 py-4 bg-secondary/10">
                  <span className="text-xs text-muted-foreground">
                    Showing { (page - 1) * limit + 1 } to { Math.min(page * limit, total) } of { total } entries
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      className="rounded-lg text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * limit >= total}
                      onClick={() => setPage(prev => prev + 1)}
                      className="rounded-lg text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invoice Details Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/80 text-white rounded-2xl shadow-2xl p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <div>
              <DialogTitle className="text-xl font-extrabold text-white">
                Invoice Details
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Reference ID: #{selectedInvoice?.id}
              </p>
            </div>
          </DialogHeader>

          {selectedInvoice && (
            <div className="py-4 space-y-6">
              
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-primary tracking-tight">StreamVault</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">StreamVault Billing Support</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-white">{selectedInvoice.invoice_number}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Issued: {formatDate(selectedInvoice.issued_at)}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              {/* Customer / Payment info */}
              <div className="grid grid-cols-2 gap-6 border-t border-b border-border/30 py-4 bg-secondary/5 px-3 rounded-xl">
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Customer Information
                  </h5>
                  <div className="text-sm font-bold text-white mt-1.5">
                    {selectedInvoice.user ? `${selectedInvoice.user.first_name} ${selectedInvoice.user.last_name}` : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedInvoice.user?.email}
                  </div>
                  {selectedInvoice.user?.phone && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {selectedInvoice.user.phone}
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    Payment Information
                  </h5>
                  <div className="text-xs mt-1.5 space-y-1">
                    <p className="text-muted-foreground">
                      Method: <span className="font-bold text-white">{selectedInvoice.payment?.payment_method?.toUpperCase() || "CARD"}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Transaction ID: <span className="font-bold text-white font-mono break-all">{selectedInvoice.payment?.stripe_payment_intent_id || "N/A"}</span>
                    </p>
                    {selectedInvoice.subscription?.stripe_subscription_id && (
                      <p className="text-muted-foreground">
                        Stripe Sub: <span className="font-bold text-white font-mono break-all">{selectedInvoice.subscription.stripe_subscription_id}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Item breakdown */}
              <div>
                <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2">
                  Subscription Summary
                </h5>
                <div className="rounded-xl border border-border/40 overflow-hidden text-sm">
                  <div className="bg-secondary/25 px-4 py-2 flex font-bold border-b border-border/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="flex-1">Description</span>
                    <span className="w-16 text-center">Qty</span>
                    <span className="w-24 text-right">Amount</span>
                  </div>
                  <div className="px-4 py-3 flex items-center">
                    <span className="flex-1 text-white font-bold">
                      {selectedInvoice.subscription?.plan?.name || "Premium Monthly Plan"} Subscription
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                        Cycle: {selectedInvoice.subscription?.plan?.billing_cycle || "monthly"}
                      </span>
                    </span>
                    <span className="w-16 text-center text-muted-foreground">1</span>
                    <span className="w-24 text-right text-white font-bold">
                      {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Calculation details */}
              <div className="flex justify-end pt-2 border-t border-border/40">
                <div className="w-64 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (18% GST)</span>
                    <span>{formatCurrency(selectedInvoice.tax_amount, selectedInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-white text-base border-t border-border/30 pt-2">
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedInvoice.total_amount, selectedInvoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border/40 pt-4 flex gap-2 sm:justify-between items-center w-full">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Close Details
            </Button>
            {selectedInvoice && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleResendEmail(selectedInvoice.id)}
                  className="rounded-xl text-xs font-bold text-muted-foreground hover:text-white"
                >
                  <Mail className="size-3.5 mr-1" />
                  Resend Invoice
                </Button>
                <Button
                  onClick={() => handleDownload(selectedInvoice.id, selectedInvoice.invoice_number)}
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white"
                >
                  <Download className="size-3.5 mr-1" />
                  Download PDF
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
