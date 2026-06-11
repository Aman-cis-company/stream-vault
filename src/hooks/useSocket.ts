import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

/** Subscribe to a Socket.IO event; auto-cleans up on unmount. */
export function useSocketEvent<T = unknown>(
  event: string,
  handler: (data: T) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const wrapped = (data: T) => handlerRef.current(data);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [event]);
}

/** Returns true when the socket is connected. */
export function useSocketConnected(): boolean {
  return getSocket().connected;
}
