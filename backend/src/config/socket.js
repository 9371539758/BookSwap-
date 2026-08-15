import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { Connection } from "../model/connection.model.js";
import { Message } from "../model/message.model.js";
import { userModel } from "../model/user.model.js";

// userId -> Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "https://book-swap-blond.vercel.app",
          "https://book-swap-puce.vercel.app",
          "https://bookswap-frontend-4ayc.onrender.com",
          process.env.CLIENT_URL,
          process.env.FRONTEND_URL,
        ].filter(Boolean);

        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) {
          return callback(null, true);
        }
        callback(new Error("CORS policy violation"));
      },
      credentials: true,
    },
  });

  // Auth middleware for every socket connection
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
        socket.handshake.headers?.cookie
          ?.split(";")
          .map((item) => item.trim())
          .find((item) => item.startsWith("token="))
          ?.slice("token=".length);

      if (!token) {
        return next(new Error("Not authenticated"));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Track online
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);

    // ─── Connection request ─────────────────────────────────
    socket.on("connection:request", async ({ toUserId, bookId }, callback) => {
      try {
        if (!toUserId || toUserId === userId) {
          return callback?.({ ok: false, message: "You cannot connect with yourself" });
        }

        // Avoid duplicate pending request
        const existing = await Connection.findOne({
          fromUser: userId,
          toUser: toUserId,
          bookId: bookId || null,
          status: "pending",
        });
        if (existing) {
          socket.emit("error", { message: "Request already sent" });
          return callback?.({ ok: false, message: "Request already sent" });
        }

        const request = await Connection.create({
          fromUser: userId,
          toUser: toUserId,
          bookId: bookId || null,
        });

        const populated = await Connection.findById(request._id)
          .populate("fromUser", "username fullName avatar")
          .populate("bookId", "title coverImage");

        // Live notify the target user
        io.to(`user:${toUserId}`).emit("connection:incoming", populated);
        socket.emit("connection:sent", populated);
        callback?.({ ok: true, connection: populated });
      } catch (err) {
        socket.emit("error", { message: err.message });
        callback?.({ ok: false, message: "Could not send request" });
      }
    });

    // ─── Accept ─────────────────────────────────────────────
    socket.on("connection:accept", async ({ requestId }, callback) => {
      try {
        const request = await Connection.findById(requestId);
        if (!request || request.toUser.toString() !== userId || request.status !== "pending") {
          return callback?.({ ok: false, message: "Request is no longer available" });
        }

        request.status = "accepted";
        await request.save();

        const populated = await Connection.findById(requestId)
          .populate("fromUser", "username fullName avatar")
          .populate("toUser", "username fullName avatar")
          .populate("bookId", "title coverImage");

        // Both users get notified
        io.to(`user:${request.fromUser}`).emit("connection:accepted", populated);
        io.to(`user:${request.toUser}`).emit("connection:accepted", populated);
        callback?.({ ok: true, connection: populated });
      } catch (err) {
        socket.emit("error", { message: err.message });
        callback?.({ ok: false, message: "Could not accept request" });
      }
    });

    // ─── Reject ─────────────────────────────────────────────
    socket.on("connection:reject", async ({ requestId }, callback) => {
      try {
        const request = await Connection.findById(requestId);
        if (!request || request.toUser.toString() !== userId || request.status !== "pending") {
          return callback?.({ ok: false, message: "Request is no longer available" });
        }

        request.status = "rejected";
        await request.save();

        io.to(`user:${request.fromUser}`).emit("connection:rejected", {
          requestId,
        });
        socket.emit("connection:rejected", { requestId });
        callback?.({ ok: true });
      } catch (err) {
        socket.emit("error", { message: err.message });
        callback?.({ ok: false, message: "Could not decline request" });
      }
    });

    // ─── Send message ───────────────────────────────────────
    socket.on("message:send", async ({ connectionId, text }, callback) => {
      try {
        if (!text?.trim()) {
          return callback?.({ ok: false, message: "Message cannot be empty" });
        }

        const connection = await Connection.findById(connectionId);
        if (!connection || connection.status !== "accepted") {
          socket.emit("error", { message: "Chat not available" });
          return;
        }

        const isMember =
          connection.fromUser.toString() === userId ||
          connection.toUser.toString() === userId;
        if (!isMember) {
          return callback?.({ ok: false, message: "You are not part of this chat" });
        }

        const message = await Message.create({
          connectionId,
          sender: userId,
          text: text.trim(),
        });

        const populated = await Message.findById(message._id).populate(
          "sender",
          "username fullName avatar"
        );

        const otherUserId =
          connection.fromUser.toString() === userId
            ? connection.toUser.toString()
            : connection.fromUser.toString();

        // Send to both
        io.to(`user:${userId}`).emit("message:new", populated);
        io.to(`user:${otherUserId}`).emit("message:new", populated);
        callback?.({ ok: true });
      } catch (err) {
        socket.emit("error", { message: err.message });
        callback?.({ ok: false, message: "Could not send message" });
      }
    });

    // ─── Disconnect ─────────────────────────────────────────
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
