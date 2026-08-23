import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { Connection } from "../model/connection.model.js";
import { Message } from "../model/message.model.js";

// Track online users: userId → Set of socket IDs (handles multiple tabs)
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        // Allow any localhost port (dev) + known production origins
        if (
          !origin ||
          origin.startsWith("http://localhost") ||
          origin.endsWith(".vercel.app") ||
          origin.endsWith(".onrender.com") ||
          origin === process.env.CLIENT_URL ||
          origin === process.env.FRONTEND_URL
        ) {
          return callback(null, true);
        }
        callback(new Error("Socket CORS policy violation"));
      },
      credentials: true, // needed for cookie-based auth
    },
  });

  // ─── SOCKET AUTH MIDDLEWARE ──────────────────────────────────────────────────
  // Runs before every socket connection is established.
  //
  // Auth strategy (in order of preference):
  //   1. httpOnly cookie "token" — most secure, set by login/register
  //   2. socket.handshake.auth.token — fallback for clients that can't send cookies
  //      (e.g. React Native, Postman)
  //
  // PRIVACY: Without a valid JWT, the socket is rejected immediately.
  // This prevents unauthenticated users from joining any user rooms.

  io.use((socket, next) => {
    try {
      // 1. Try reading JWT from httpOnly cookie (preferred — most secure)
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const cookieToken = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="))
        ?.slice("token=".length);

      // 2. Fall back to auth token passed by client (for non-browser clients)
      const authToken = socket.handshake.auth?.token;

      const token = cookieToken || authToken;

      if (!token) {
        return next(new Error("Not authenticated — please log in"));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.id; // attach userId to every socket
      next();
    } catch {
      next(new Error("Invalid or expired session — please log in again"));
    }
  });

  // ─── CONNECTION HANDLER ──────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Track online users (supports multiple tabs/devices)
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Each user joins their own private room: "user:<userId>"
    // Messages and events are delivered to this room — only their sockets.
    socket.join(`user:${userId}`);

    // ─── CONNECTION REQUEST ──────────────────────────────────────────────────
    // Emitted when a user clicks "Connect" on a book listing.
    // Creates a pending Connection record and notifies the book owner.
    socket.on("connection:request", async ({ toUserId, bookId }, callback) => {
      try {
        // Can't connect with yourself
        if (!toUserId || toUserId === userId) {
          return callback?.({ ok: false, message: "You cannot connect with yourself" });
        }

        // Prevent duplicate pending requests for the same book
        const existing = await Connection.findOne({
          fromUser: userId,
          toUser: toUserId,
          bookId: bookId || null,
          status: "pending",
        });
        if (existing) {
          return callback?.({ ok: false, message: "You already sent a request for this book" });
        }

        const request = await Connection.create({
          fromUser: userId,
          toUser: toUserId,
          bookId: bookId || null,
        });

        const populated = await Connection.findById(request._id)
          .populate("fromUser", "username fullName avatar")
          .populate("bookId",   "title coverImage")
          .lean();

        // Notify book owner in real-time if they're online
        io.to(`user:${toUserId}`).emit("connection:incoming", populated);
        // Confirm to sender
        socket.emit("connection:sent", populated);
        callback?.({ ok: true, connection: populated });
      } catch (err) {
        console.error("connection:request error:", err.message);
        callback?.({ ok: false, message: "Could not send request" });
      }
    });

    // ─── ACCEPT REQUEST ──────────────────────────────────────────────────────
    // Only the recipient (toUser) can accept a request.
    // PRIVACY: query checks `toUser: userId` — prevents others from accepting.
    socket.on("connection:accept", async ({ requestId }, callback) => {
      try {
        const request = await Connection.findOne({
          _id: requestId,
          toUser: userId,       // PRIVACY: only the intended recipient can accept
          status: "pending",
        });

        if (!request) {
          return callback?.({ ok: false, message: "Request is no longer available" });
        }

        request.status = "accepted";
        await request.save();

        const populated = await Connection.findById(requestId)
          .populate("fromUser", "username fullName avatar")
          .populate("toUser",   "username fullName avatar")
          .populate("bookId",   "title coverImage")
          .lean();

        // Notify both participants — the chat is now open
        io.to(`user:${request.fromUser}`).emit("connection:accepted", populated);
        io.to(`user:${request.toUser}`  ).emit("connection:accepted", populated);
        callback?.({ ok: true, connection: populated });
      } catch (err) {
        console.error("connection:accept error:", err.message);
        callback?.({ ok: false, message: "Could not accept request" });
      }
    });

    // ─── REJECT REQUEST ──────────────────────────────────────────────────────
    // Only the recipient can reject. Notifies the sender their request was declined.
    socket.on("connection:reject", async ({ requestId }, callback) => {
      try {
        const request = await Connection.findOne({
          _id: requestId,
          toUser: userId,       // PRIVACY: only recipient can reject
          status: "pending",
        });

        if (!request) {
          return callback?.({ ok: false, message: "Request is no longer available" });
        }

        request.status = "rejected";
        await request.save();

        // Notify the sender their request was declined
        io.to(`user:${request.fromUser}`).emit("connection:rejected", { requestId });
        socket.emit("connection:rejected", { requestId });
        callback?.({ ok: true });
      } catch (err) {
        console.error("connection:reject error:", err.message);
        callback?.({ ok: false, message: "Could not decline request" });
      }
    });

    // ─── SEND MESSAGE ────────────────────────────────────────────────────────
    // PRIVACY: verifies sender is a participant BEFORE saving or delivering.
    // Only the two users in an accepted Connection can exchange messages.
    // A third user who guesses the connectionId cannot inject messages.
    socket.on("message:send", async ({ connectionId, text }, callback) => {
      try {
        if (!text?.trim()) {
          return callback?.({ ok: false, message: "Message cannot be empty" });
        }

        // PRIVACY CHECK: connection must be accepted AND sender must be a participant
        const connection = await Connection.findOne({
          _id: connectionId,
          status: "accepted",
          $or: [{ fromUser: userId }, { toUser: userId }], // must be a participant
        });

        if (!connection) {
          return callback?.({ ok: false, message: "Chat not found or access denied" });
        }

        const message = await Message.create({
          connectionId,
          sender: userId,
          text: text.trim(),
        });

        const populated = await Message.findById(message._id)
          .populate("sender", "username fullName avatar")
          .lean();

        // Determine the other participant's ID
        const otherUserId =
          connection.fromUser.toString() === userId
            ? connection.toUser.toString()
            : connection.fromUser.toString();

        // Deliver to both participants' rooms ONLY — never broadcast to others
        io.to(`user:${userId}`     ).emit("message:new", populated);
        io.to(`user:${otherUserId}`).emit("message:new", populated);
        callback?.({ ok: true });
      } catch (err) {
        console.error("message:send error:", err.message);
        callback?.({ ok: false, message: "Could not send message" });
      }
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
    });
  });

  return io;
};
