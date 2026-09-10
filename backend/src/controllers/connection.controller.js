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
    .populate("toUser", "username fullName avatar")
    .populate("bookId", "title coverImage")
    .lean(); // .lean() returns plain objects — faster than Mongoose documents

export const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    const [incoming, outgoing, accepted] = await Promise.all([
      populateConnection(
        Connection.find({
          toUser: userId,
          status: "pending",
        }).sort({ createdAt: -1 }),
      ),
      populateConnection(
        Connection.find({
          fromUser: userId,
          status: "pending",
        }).sort({ createdAt: -1 }),
      ),
      populateConnection(
        Connection.find({
          $or: [{ fromUser: userId }, { toUser: userId }],
          status: "accepted",
          hiddenFor: { $ne: userId },
        }).sort({ updatedAt: -1 }),
      ),
    ]);

    return res.json({ success: true, data: { incoming, outgoing, accepted } });
  } catch (error) {
    console.error("getConnections error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Could not load chats" });
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
    const userId = req.user.id;

    const connection = await Connection.findOne({
      _id: connectionId,
      status: "accepted",
      $or: [{ fromUser: userId }, { toUser: userId }],
      hiddenFor: { $ne: userId },
    });

    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found or access denied" });
    }

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

export const deleteConnectionForUser = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id;

    const connection = await Connection.findOne({
      _id: connectionId,
      status: "accepted",
      $or: [{ fromUser: userId }, { toUser: userId }],
    });

    if (!connection) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found or access denied" });
    }

    if (!connection.hiddenFor.some((id) => id.toString() === userId)) {
      connection.hiddenFor.push(userId);
      await connection.save();
    }

    return res.json({
      success: true,
      message: "Chat hidden for you",
      data: { connectionId: connection._id },
    });
  } catch (error) {
    console.error("deleteConnectionForUser error:", error.message);
    return res
      .status(400)
      .json({ success: false, message: "Could not hide chat" });
  }
};
