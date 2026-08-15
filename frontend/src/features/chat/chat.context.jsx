import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/hooks/useAuth";

const ChatContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:3000";
const getToken = () => localStorage.getItem("bookswap_token") || sessionStorage.getItem("bookswap_token") || "";

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setSocket(null); setIsConnected(false); return undefined; }
    const client = io(SOCKET_URL, { auth: { token: getToken() }, withCredentials: true });
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    client.on("connect", onConnect);
    client.on("disconnect", onDisconnect);
    setSocket(client);
    return () => { client.disconnect(); setSocket(null); setIsConnected(false); };
  }, [isAuthenticated]);

  return <ChatContext.Provider value={useMemo(() => ({ socket, isConnected }), [socket, isConnected])}>{children}</ChatContext.Provider>;
};

export const useChatSocket = () => useContext(ChatContext);
