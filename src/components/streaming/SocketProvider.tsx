import { useEffect, useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { connectSocket, updateSocketToken, getSocket } from "@/lib/socket";
import { ScreenBlockOverlay } from "./ScreenBlockOverlay";

export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);

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

  // Set up socket listeners for concurrency restrictions
  useEffect(() => {
    const s = getSocket();

    const handleMaxScreens = (data: { message: string }) => {
      setBlockMessage(data.message || "your account is loggedin in 2 screen please manage");
    };

    const handleBlockRemoved = () => {
      setBlockMessage(null);
    };

    s.on("max_screens_exceeded", handleMaxScreens);
    s.on("block_removed", handleBlockRemoved);

    // If user logs out/unauthenticates, reset block state
    if (!isAuthenticated) {
      setBlockMessage(null);
    }

    return () => {
      s.off("max_screens_exceeded", handleMaxScreens);
      s.off("block_removed", handleBlockRemoved);
    };
  }, [isAuthenticated]);

  return (
    <>
      {children}
      {blockMessage && <ScreenBlockOverlay message={blockMessage} />}
    </>
  );
}
