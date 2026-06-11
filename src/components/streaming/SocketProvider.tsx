import { useEffect, type ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { connectSocket, updateSocketToken } from "@/lib/socket";

export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connectSocket(accessToken);
    } else {
      connectSocket(null);
    }
    // No cleanup: SocketProvider wraps the entire app and should never unmount.
    // React StrictMode double-invokes effects; adding disconnectSocket() here would
    // kill the WebSocket mid-handshake and produce "WebSocket is closed before
    // the connection is established" errors.
  }, []);

  // Update socket auth whenever the token changes (e.g. after refresh)
  useEffect(() => {
    updateSocketToken(isAuthenticated ? accessToken : null);
  }, [accessToken, isAuthenticated]);

  return <>{children}</>;
}
