import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Protected } from "@/components/streaming/Protected";
import { apiClient } from "@/services/api";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ArrowLeft,
  Users,
  Shield,
  Mail,
  Phone,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminTeam() {
  return (
    <Protected roles={["super_admin"]}>
      <TeamManagementPage />
    </Protected>
  );
}

interface TeamMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: "active" | "inactive";
  role_id: number;
  last_login: string | null;
  created_at: string;
  invited_by: number | null;
  role?: {
    id: number;
    name: string;
    description: string;
  };
}

interface RoleOption {
  id: number;
  name: string;
  description: string;
}

interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string; // JSON details
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role?: {
      name: string;
    };
  };
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_manager: "Content Manager",
  finance_manager: "Finance Manager",
  affiliate_manager: "Affiliate Manager",
  support_agent: "Support Agent",
};

function TeamManagementPage() {
  // Members List State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>("all");
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>("all");
  const [memberPage, setMemberPage] = useState(1);
  const [memberTotalPages, setMemberTotalPages] = useState(1);
  const [memberLimit] = useState(10);

  // Roles state
  const [roles, setRoles] = useState<RoleOption[]>([]);

  // Modals state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  
  const [inviteForm, setInviteForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role_id: "",
  });

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    role_id: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusToggling, setStatusToggling] = useState<number | null>(null);

  // Activity Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logSearch, setLogSearch] = useState("");
  const [logActionFilter, setLogActionFilter] = useState<string>("all");
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // API fetches
  const loadRoles = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/team-members/roles");
      setRoles(data.data.roles || []);
    } catch {
      toast.error("Failed to load roles");
    }
  }, []);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: memberPage,
        limit: memberLimit,
      };
      if (memberSearch.trim()) params.search = memberSearch.trim();
      if (memberRoleFilter !== "all") params.roleId = Number(memberRoleFilter);
      if (memberStatusFilter !== "all") params.status = memberStatusFilter;

      const { data } = await apiClient.get("/team-members", { params });
      setMembers(data.data.teamMembers || []);
      setMemberTotalPages(data.meta?.totalPages || 1);
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setMembersLoading(false);
    }
  }, [memberPage, memberLimit, memberSearch, memberRoleFilter, memberStatusFilter]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: logPage,
        limit: 10,
      };
      if (logSearch.trim()) params.search = logSearch.trim();
      if (logActionFilter !== "all") params.action = logActionFilter;

      const { data } = await apiClient.get("/team-members/activity-logs", { params });
      setLogs(data.data.logs || []);
      setLogTotalPages(data.meta?.totalPages || 1);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLogsLoading(false);
    }
  }, [logPage, logSearch, logActionFilter]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Inviting user
  const handleInvite = async () => {
    if (!inviteForm.first_name.trim() || !inviteForm.last_name.trim() || !inviteForm.email.trim() || !inviteForm.role_id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/team-members/invite", {
        first_name: inviteForm.first_name.trim(),
        last_name: inviteForm.last_name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        phone: inviteForm.phone.trim() || undefined,
        role_id: Number(inviteForm.role_id),
      });
      toast.success("Team invitation sent successfully.");
      setInviteOpen(false);
      setInviteForm({ first_name: "", last_name: "", email: "", phone: "", role_id: "" });
      loadMembers();
      loadLogs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to send invitation";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Editing user
  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone || "",
      role_id: String(member.role_id),
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingMember) return;
    if (!editForm.first_name.trim() || !editForm.last_name.trim() || !editForm.role_id) {
      toast.error("First name, Last name, and Role are required.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.put(`/team-members/${editingMember.id}`, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone: editForm.phone.trim() || null,
        role_id: Number(editForm.role_id),
      });
      toast.success("Team member updated successfully.");
      setEditOpen(false);
      loadMembers();
      loadLogs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update member";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggling status
  const handleToggleStatus = async (member: TeamMember) => {
    setStatusToggling(member.id);
    try {
      const { data } = await apiClient.post(`/team-members/${member.id}/toggle-status`);
      toast.success(data.message || `Member successfully updated`);
      loadMembers();
      loadLogs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to change status";
      toast.error(msg);
    } finally {
      setStatusToggling(null);
    }
  };

  // Deleting user
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/team-members/${deleteTarget.id}`);
      toast.success(`Team member "${deleteTarget.first_name} ${deleteTarget.last_name}" deleted.`);
      setDeleteTarget(null);
      loadMembers();
      loadLogs();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to delete team member";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "super_admin":
        return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      case "admin":
        return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "content_manager":
        return "border-cyan-500/30 text-cyan-400 bg-cyan-500/10";
      case "finance_manager":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "affiliate_manager":
        return "border-violet-500/30 text-violet-400 bg-violet-500/10";
      case "support_agent":
        return "border-blue-500/30 text-blue-400 bg-blue-500/10";
      default:
        return "border-muted-foreground/30 text-muted-foreground";
    }
  };

  const formatActivityDetails = (detailsStr: string) => {
    try {
      const parsed = JSON.parse(detailsStr);
      return (
        <pre className="text-[11px] font-mono bg-secondary/40 p-3 rounded-lg overflow-x-auto text-muted-foreground max-h-48 border border-border/40">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-xs text-muted-foreground">{detailsStr}</span>;
    }
  };

  const cleanActivityActionName = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <DashboardLayout title="Team Management">
      <div className="space-y-6">
        {/* Header / Back Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" asChild className="rounded-lg w-fit">
            <Link to="/admin">
              <ArrowLeft className="mr-1 size-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Tabs for Team Members & Activity Logs */}
        <Tabs defaultValue="members" className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <TabsList className="h-10 rounded-xl p-1 bg-secondary/50 border border-border/60">
              <TabsTrigger
                value="members"
                className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:shadow-sm"
              >
                <Users className="size-3.5" /> Team Members
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-lg text-xs font-semibold gap-1.5 data-[state=active]:shadow-sm"
              >
                <Activity className="size-3.5" /> Platform Activity Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-0">
              <Button onClick={() => setInviteOpen(true)} className="h-9 rounded-xl font-bold shadow-glow-sm">
                <Plus className="mr-1.5 size-4" /> Invite Member
              </Button>
            </TabsContent>
          </div>

          {/* ── Team Members Tab ── */}
          <TabsContent value="members" className="space-y-6 mt-0">
            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="relative col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMemberPage(1);
                  }}
                  placeholder="Search name, email..."
                  className="pl-9 h-10 rounded-xl bg-card border-border/60"
                />
              </div>
              <div>
                <Select
                  value={memberRoleFilter}
                  onValueChange={(val) => {
                    setMemberRoleFilter(val);
                    setMemberPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border/60">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border/60">
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {ROLE_DISPLAY_NAMES[r.name] || r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={memberStatusFilter}
                  onValueChange={(val) => {
                    setMemberStatusFilter(val);
                    setMemberPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border/60">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border/60">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Members Table */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
              {membersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                    <Users className="size-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-semibold">No team members found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                    Try adjusting your filters or invite a new team member to get started.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="px-6 py-3.5 font-bold">Member Info</th>
                          <th className="px-6 py-3.5 font-bold">Role</th>
                          <th className="px-6 py-3.5 font-bold">Status</th>
                          <th className="px-6 py-3.5 font-bold">Last Login</th>
                          <th className="px-6 py-3.5 font-bold">Joined</th>
                          <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-secondary/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                                  {member.first_name[0]}{member.last_name[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm">
                                    {member.first_name} {member.last_name}
                                  </p>
                                  <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1">
                                      <Mail className="size-3 text-muted-foreground/60 shrink-0" />
                                      {member.email}
                                    </span>
                                    {member.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="size-3 text-muted-foreground/60 shrink-0" />
                                        {member.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {member.role ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(member.role.name)}`}
                                >
                                  <Shield className="size-3 mr-1 shrink-0" />
                                  {ROLE_DISPLAY_NAMES[member.role.name] || member.role.name}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  member.status === "active"
                                    ? "border-success/40 text-success bg-success/10"
                                    : "border-warning/40 text-warning bg-warning/10"
                                }`}
                              >
                                {member.status === "active" ? (
                                  <>
                                    <CheckCircle className="size-3 mr-1 shrink-0" /> Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="size-3 mr-1 shrink-0" /> Pending/Inactive
                                  </>
                                )}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                              {member.last_login ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3 text-muted-foreground/50 shrink-0" />
                                  {new Date(member.last_login).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50 italic">Never logged in</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                              {new Date(member.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(member)}
                                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-white"
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={statusToggling === member.id}
                                  onClick={() => handleToggleStatus(member)}
                                  className={`h-8 px-2.5 text-xs font-semibold rounded-lg ${
                                    member.status === "active"
                                      ? "text-warning hover:bg-warning/10 hover:text-warning"
                                      : "text-success hover:bg-success/10 hover:text-success"
                                  }`}
                                >
                                  {statusToggling === member.id ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : member.status === "active" ? (
                                    "Disable"
                                  ) : (
                                    "Enable"
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTarget(member)}
                                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  {memberTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/60 px-6 py-3.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        Page {memberPage} of {memberTotalPages}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={memberPage === 1}
                          onClick={() => setMemberPage((prev) => Math.max(1, prev - 1))}
                          className="h-8 w-8 p-0 rounded-lg border-border/60 bg-transparent hover:bg-secondary/20"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={memberPage === memberTotalPages}
                          onClick={() => setMemberPage((prev) => Math.min(memberTotalPages, prev + 1))}
                          className="h-8 w-8 p-0 rounded-lg border-border/60 bg-transparent hover:bg-secondary/20"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Activity Logs Tab ── */}
          <TabsContent value="activity" className="space-y-6 mt-0">
            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={logSearch}
                  onChange={(e) => {
                    setLogSearch(e.target.value);
                    setLogPage(1);
                  }}
                  placeholder="Search logs by action, details, user name/email..."
                  className="pl-9 h-10 rounded-xl bg-card border-border/60"
                />
              </div>
              <div>
                <Select
                  value={logActionFilter}
                  onValueChange={(val) => {
                    setLogActionFilter(val);
                    setLogPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-card border-border/60">
                    <SelectValue placeholder="Filter by Action" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border/60">
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="user_login">User Login</SelectItem>
                    <SelectItem value="team_member_invited">Team Invited</SelectItem>
                    <SelectItem value="team_member_activated">Team Activated</SelectItem>
                    <SelectItem value="team_member_updated">Team Updated</SelectItem>
                    <SelectItem value="team_member_deleted">Team Deleted</SelectItem>
                    <SelectItem value="team_member_status_toggled">Team Status Toggled</SelectItem>
                    <SelectItem value="movie_created">Movie Created</SelectItem>
                    <SelectItem value="movie_updated">Movie Updated</SelectItem>
                    <SelectItem value="movie_deleted">Movie Deleted</SelectItem>
                    <SelectItem value="invoice_sent">Invoice Actions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
              {logsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
                    <Activity className="size-6 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-semibold">No activity logs found</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                    System actions and team changes will be logged here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="px-6 py-3.5 font-bold">Action</th>
                          <th className="px-6 py-3.5 font-bold">User Info</th>
                          <th className="px-6 py-3.5 font-bold">IP & Device</th>
                          <th className="px-6 py-3.5 font-bold">Timestamp</th>
                          <th className="px-6 py-3.5 font-bold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                            <td className="px-6 py-4">
                              <Badge variant="secondary" className="font-semibold text-xs tracking-wide">
                                {cleanActivityActionName(log.action)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {log.user ? (
                                <div>
                                  <p className="font-semibold text-sm">
                                    {log.user.first_name} {log.user.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{log.user.email}</p>
                                  {log.user.role && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] uppercase font-bold tracking-wider mt-1 px-1 bg-secondary/50"
                                    >
                                      {ROLE_DISPLAY_NAMES[log.user.role.name] || log.user.role.name}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic font-medium">System/External</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-muted-foreground font-medium space-y-0.5">
                                <p className="font-mono text-[11px] bg-secondary/50 px-1.5 py-0.5 rounded-md w-fit">
                                  {log.ip_address || "127.0.0.1"}
                                </p>
                                <p className="truncate max-w-[200px]" title={log.user_agent || ""}>
                                  {log.user_agent || "Server Agent"}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                              {new Date(log.created_at).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                                className="h-8 rounded-lg text-xs gap-1 font-bold text-primary hover:bg-primary/10 hover:text-primary"
                              >
                                <Info className="size-3.5" /> Inspect
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  {logTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border/60 px-6 py-3.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        Page {logPage} of {logTotalPages}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logPage === 1}
                          onClick={() => setLogPage((prev) => Math.max(1, prev - 1))}
                          className="h-8 w-8 p-0 rounded-lg border-border/60 bg-transparent hover:bg-secondary/20"
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={logPage === logTotalPages}
                          onClick={() => setLogPage((prev) => Math.min(logTotalPages, prev + 1))}
                          className="h-8 w-8 p-0 rounded-lg border-border/60 bg-transparent hover:bg-secondary/20"
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── MODAL: Invite Member ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-popover border border-border/60 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Invite Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send an invitation email to a new team member. They will set a password to activate their account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inv-first" className="text-xs font-semibold">First Name <span className="text-primary">*</span></Label>
                <Input
                  id="inv-first"
                  value={inviteForm.first_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                  placeholder="e.g. John"
                  className="h-9 rounded-lg border-border/60 bg-secondary/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inv-last" className="text-xs font-semibold">Last Name <span className="text-primary">*</span></Label>
                <Input
                  id="inv-last"
                  value={inviteForm.last_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                  placeholder="e.g. Doe"
                  className="h-9 rounded-lg border-border/60 bg-secondary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-email" className="text-xs font-semibold">Email Address <span className="text-primary">*</span></Label>
              <Input
                id="inv-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="e.g. john.doe@stream-vault.com"
                className="h-9 rounded-lg border-border/60 bg-secondary/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-phone" className="text-xs font-semibold">Phone Number (Optional)</Label>
              <Input
                id="inv-phone"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                placeholder="e.g. +919876543210"
                className="h-9 rounded-lg border-border/60 bg-secondary/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-role" className="text-xs font-semibold">Assigned RBAC Role <span className="text-primary">*</span></Label>
              <Select
                value={inviteForm.role_id}
                onValueChange={(val) => setInviteForm({ ...inviteForm, role_id: val })}
              >
                <SelectTrigger id="inv-role" className="h-9 rounded-lg border-border/60 bg-secondary/20">
                  <SelectValue placeholder="Select a team role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border/60">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {ROLE_DISPLAY_NAMES[r.name] || r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {inviteForm.role_id && roles.find((r) => String(r.id) === inviteForm.role_id) && (
                <p className="text-[11px] text-muted-foreground italic mt-1 font-medium bg-secondary/30 px-2 py-1 rounded">
                  {roles.find((r) => String(r.id) === inviteForm.role_id)?.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => setInviteOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleInvite}
              className="rounded-lg font-bold shadow-glow-sm"
            >
              {submitting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Edit Team Member ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-popover border border-border/60 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Edit Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify details or update role permissions for the selected team member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-first" className="text-xs font-semibold">First Name <span className="text-primary">*</span></Label>
                <Input
                  id="edit-first"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  placeholder="e.g. John"
                  className="h-9 rounded-lg border-border/60 bg-secondary/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-last" className="text-xs font-semibold">Last Name <span className="text-primary">*</span></Label>
                <Input
                  id="edit-last"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  placeholder="e.g. Doe"
                  className="h-9 rounded-lg border-border/60 bg-secondary/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Email Address (Cannot change)</Label>
              <Input
                value={editingMember?.email || ""}
                disabled
                className="h-9 rounded-lg border-border/40 bg-secondary/10 text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-xs font-semibold">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="e.g. +919876543210"
                className="h-9 rounded-lg border-border/60 bg-secondary/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-role" className="text-xs font-semibold">Assigned RBAC Role <span className="text-primary">*</span></Label>
              <Select
                value={editForm.role_id}
                onValueChange={(val) => setEditForm({ ...editForm, role_id: val })}
              >
                <SelectTrigger id="edit-role" className="h-9 rounded-lg border-border/60 bg-secondary/20">
                  <SelectValue placeholder="Select a team role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border/60">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {ROLE_DISPLAY_NAMES[r.name] || r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.role_id && roles.find((r) => String(r.id) === editForm.role_id) && (
                <p className="text-[11px] text-muted-foreground italic mt-1 font-medium bg-secondary/30 px-2 py-1 rounded">
                  {roles.find((r) => String(r.id) === editForm.role_id)?.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={submitting}
              onClick={() => setEditOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleEdit}
              className="rounded-lg font-bold shadow-glow-sm"
            >
              {submitting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Delete Confirm ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-popover border border-border/60 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-1.5">
              Delete Team Member?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>? This action is permanent and revoke all platform accesses.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              className="rounded-lg font-bold"
            >
              {deleting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Inspect Activity Log ── */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="bg-popover border border-border/60 max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Activity Log Inspection</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Inspecting execution metadata, parameters, and actor payload.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3 bg-secondary/20 p-3.5 rounded-xl border border-border/40">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Action Type</p>
                  <p className="font-semibold text-xs mt-0.5">{cleanActivityActionName(selectedLog.action)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Actor</p>
                  <p className="font-semibold text-xs mt-0.5">
                    {selectedLog.user ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}` : "System"}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">IP Address</p>
                  <p className="font-mono text-xs mt-0.5">{selectedLog.ip_address || "127.0.0.1"}</p>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Date / Time</p>
                  <p className="text-xs font-semibold mt-0.5">
                    {new Date(selectedLog.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground">Device / User Agent</p>
                <p className="text-xs bg-secondary/20 px-3 py-2 rounded-lg text-muted-foreground border border-border/40 font-medium break-all">
                  {selectedLog.user_agent || "Server Process"}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-bold text-muted-foreground">Action Metadata Payload (JSON)</p>
                {formatActivityDetails(selectedLog.details)}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="rounded-lg w-full sm:w-auto"
            >
              Close Inspector
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
