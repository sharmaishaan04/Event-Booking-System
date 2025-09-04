import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";
    const socket = io(url, { path: "/socket.io", autoConnect: true });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
