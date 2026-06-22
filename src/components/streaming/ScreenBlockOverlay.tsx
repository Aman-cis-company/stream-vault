import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Monitor, Loader2, ShieldAlert } from "lucide-react";
import { apiClient } from "@/services/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function ScreenBlockOverlay({ message }: { message: string }) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogoutOthers = async () => {
    setLoading(true);
    try {
      const refreshToken = localStorage.getItem("sv.refresh_token");
      const socket = getSocket();
      await apiClient.post("/auth/logout-others", {
        refresh_token: refreshToken,
        socketId: socket.id,
      });
      toast.success("Other screens logged out successfully!");
    } catch (err: any) {
      toast.error("Failed to logout other screens", {
        description: err.response?.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl p-4 animate-in fade-in duration-500">
      {/* Cinematic ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-rose-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md p-8 text-center shadow-[0_0_80px_rgba(239,68,68,0.12)] space-y-6">
        {/* Pulsing Icon */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-b from-red-500/20 to-red-500/5 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse">
          <Monitor className="size-10 text-red-500" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Limit Exceeded
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        {/* Context Info Box */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 text-left">
          <ShieldAlert className="size-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400 leading-normal">
            StreamVault plans enforce active screen limits. Revoking older sessions will log out other devices instantly.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleLogoutOthers}
            disabled={loading}
            className="w-full h-12 font-bold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all duration-300 transform active:scale-[0.98] shadow-[0_4px_20px_rgba(220,38,38,0.3)] text-white border-0 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Managing screens...
              </>
            ) : (
              "Logout Other Screens"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => logout()}
            className="w-full h-12 font-semibold rounded-xl text-zinc-500 hover:text-white transition-all duration-200 hover:bg-white/5 cursor-pointer"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
