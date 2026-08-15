import { Connection } from "../model/connection.model.js";
import { Message } from "../model/message.model.js";

const connectionDetails = (query) =>
  query
    .populate("fromUser", "username fullName avatar")
    .populate("toUser", "username fullName avatar")
    .populate("bookId", "title coverImage");

export const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const [incoming, outgoing, accepted] = await Promise.all([
      connectionDetails(
        Connection.find({ toUser: userId, status: "pending" }).sort({ createdAt: -1 })
      ),
      connectionDetails(
        Connection.find({ fromUser: userId, status: "pending" }).sort({ createdAt: -1 })
      ),
      connectionDetails(
        Connection.find({ $or: [{ fromUser: userId }, { toUser: userId }], status: "accepted" }).sort({ updatedAt: -1 })
      ),
    ]);

    res.json({ success: true, data: { incoming, outgoing, accepted } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not load chats" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user.id;
    const connection = await Connection.findOne({
      _id: connectionId,
      status: "accepted",
      $or: [{ fromUser: userId }, { toUser: userId }],
    });

    if (!connection) {
      return res.status(404).json({ success: false, message: "Chat not available" });
    }

    const messages = await Message.find({ connectionId })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: 1 });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, message: "Invalid chat" });
  }
};
