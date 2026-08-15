import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useChatSocket } from "../chat.context";
import { fetchConnections, fetchMessages } from "../services/chat.api";
import "./chats.scss";

const getId = (value) => value?._id || value;
const nameOf = (user) => user?.fullName || user?.username || "Reader";

const Chats = () => {
  const { user } = useAuth(); const { socket } = useChatSocket();
  const [connections, setConnections] = useState({ incoming: [], outgoing: [], accepted: [] });
  const [active, setActive] = useState(null); const [messages, setMessages] = useState([]);
  const [text, setText] = useState(""); const [status, setStatus] = useState("");
  const reload = async () => { try { const data = await fetchConnections(); setConnections(data); setActive((current) => data.accepted.find((item) => item._id === current?._id) || current); } catch (error) { setStatus(error.message); } };
  useEffect(() => { reload(); }, []);

  // Keeps requests visible even when the recipient was offline when they arrived.
  useEffect(() => {
    const interval = window.setInterval(reload, 5000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => { if (active?._id) fetchMessages(active._id).then(setMessages).catch((error) => setStatus(error.message)); }, [active?._id]);
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => reload();
    const onMessage = (message) => { if (getId(message.connectionId) === active?._id) setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]); };
    socket.on("connection:incoming", refresh); socket.on("connection:sent", refresh); socket.on("connection:accepted", refresh); socket.on("connection:rejected", refresh); socket.on("message:new", onMessage); socket.on("error", ({ message }) => setStatus(message));
    return () => { socket.off("connection:incoming", refresh); socket.off("connection:sent", refresh); socket.off("connection:accepted", refresh); socket.off("connection:rejected", refresh); socket.off("message:new", onMessage); socket.off("error"); };
  }, [socket, active?._id]);
  const respond = (event, requestId) => { if (!socket) return setStatus("Connecting to chat service..."); socket.emit(event, { requestId }, (result) => { if (!result?.ok) return setStatus(result?.message || "Could not update request"); setStatus(""); reload(); if (result.connection) setActive(result.connection); }); };
  const sendMessage = (event) => { event.preventDefault(); if (!text.trim() || !active || !socket) return; socket.emit("message:send", { connectionId: active._id, text }, (result) => { if (!result?.ok) setStatus(result?.message || "Could not send message"); }); setText(""); };
  const otherUser = useMemo(() => !active ? null : getId(active.fromUser) === user?._id ? active.toUser : active.fromUser, [active, user?._id]);
  return <main className="chats-page"><section className="chats-page__sidebar"><h1>Chats</h1><h2>Requests received</h2>{connections.incoming.length === 0 && <p className="chats-page__muted">No new requests.</p>}{connections.incoming.map((request) => <article className="request-card" key={request._id}><strong>{nameOf(request.fromUser)}</strong><span>{request.bookId?.title ? `About “${request.bookId.title}”` : "Wants to connect"}</span><div><button onClick={() => respond("connection:accept", request._id)}>Accept</button><button className="request-card__decline" onClick={() => respond("connection:reject", request._id)}>Decline</button></div></article>)}{connections.outgoing.length > 0 && <><h2>Requests sent</h2>{connections.outgoing.map((request) => <p className="chats-page__muted" key={request._id}>Waiting for {nameOf(request.toUser)} to accept.</p>)}</>}<h2>Conversations</h2>{connections.accepted.map((connection) => { const other = getId(connection.fromUser) === user?._id ? connection.toUser : connection.fromUser; return <button className={`chat-list-item ${active?._id === connection._id ? "chat-list-item--active" : ""}`} onClick={() => setActive(connection)} key={connection._id}>{nameOf(other)}<small>{connection.bookId?.title || "BookSwap chat"}</small></button>; })}</section><section className="chat-window">{active ? <><header><h2>{nameOf(otherUser)}</h2><p>{active.bookId?.title || "Connected on BookSwap"}</p></header><div className="chat-window__messages">{messages.map((message) => <p key={message._id} className={getId(message.sender) === user?._id ? "message message--mine" : "message"}>{message.text}</p>)}</div><form onSubmit={sendMessage}><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message..."/><button type="submit">Send</button></form></> : <div className="chat-window__empty">Accept a request or choose a conversation to start chatting.</div>}{status && <p className="chat-window__status">{status}</p>}</section></main>;
};
export default Chats;
