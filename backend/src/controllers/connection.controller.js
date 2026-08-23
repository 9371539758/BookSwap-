import { Connection } from "../model/connection.model.js";
import { Message } from "../model/message.model.js";

// ─── GET CONNECTIONS ───────────────────────────────────────────────────────────
// Returns only connections WHERE the logged-in user is involved.
// Chat privacy: users can ONLY see their own chats — never others' conversations.
//
// Returns three buckets:
//   incoming — pending requests sent TO this user (they haven't responded yet)
//   outgoing — pending requests this user sent TO others
//   accepted — active chats this user is a participant in

const populateConnection = (query) =>
  query
    .populate("fromUser", "username fullName avatar")
    .populate("toUser",   "username fullName avatar")
    .populate("bookId",   "title coverImage")
    .lean(); // .lean() returns plain objects — faster than Mongoose documents

export const getConnections = async (req, res) => {
  try {
    const userId = req.user.id; // set by authMiddleware from JWT cookie

    // Run all three queries in parallel for speed
    const [incoming, outgoing, accepted] = await Promise.all([
      // Requests where I am the recipient and haven't decided yet
      populateConnection(
        Connection.find({ toUser: userId, status: "pending" }).sort({ createdAt: -1 })
      ),
      // Requests I sent that are still pending
      populateConnection(
        Connection.find({ fromUser: userId, status: "pending" }).sort({ createdAt: -1 })
      ),
      // Chats I am part of (either as sender or receiver) — accepted only
      // PRIVACY: $or ensures only the two participants can see this chat
      populateConnection(
        Connection.find({
          $or: [{ fromUser: userId }, { toUser: userId }],
          status: "accepted",
        }).sort({ updatedAt: -1 })
      ),
    ]);

    return res.json({ success: true, data: { incoming, outgoing, accepted } });
  } catch (error) {
    console.error("getConnections error:", error.message);
    return res.status(500).json({ success: false, message: "Could not load chats" });
  }
};

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────
// Returns messages for a specific accepted connection.
//
// PRIVACY ENFORCEMENT:
//   The query includes `$or: [{ fromUser: userId }, { toUser: userId }]`
//   This means the connection is only found if the logged-in user is one
//   of the two participants. If someone guesses a connectionId from another
//   conversation, this query returns null → 404. Their messages are safe.

export const getMessages = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id; // verified JWT user — set by authMiddleware

    // Verify: connection must be accepted AND user must be a participant
    const connection = await Connection.findOne({
      _id: connectionId,
      status: "accepted",
      $or: [{ fromUser: userId }, { toUser: userId }], // PRIVACY CHECK
    });

    if (!connection) {
      // Don't reveal whether the chat exists — just say not available
      return res.status(404).json({ success: false, message: "Chat not found or access denied" });
    }

    // Load messages in chronological order (oldest first for chat display)
    const messages = await Message.find({ connectionId })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, data: messages });
  } catch (error) {
    console.error("getMessages error:", error.message);
    return res.status(400).json({ success: false, message: "Invalid chat" });
  }
};
