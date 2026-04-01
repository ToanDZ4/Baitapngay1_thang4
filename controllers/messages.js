const messageModel = require("../schemas/messages");
const userModel = require("../schemas/users");

module.exports = {
  postMessage: async (req, res) => {
    try {
      const from = req.user._id;
      const { to, text } = req.body;

      if (!to) {
        return res.status(400).send({ message: "Thiếu trường to" });
      }

      const toUser = await userModel.findById(to);
      if (!toUser) {
        return res.status(404).send({ message: "Không tìm thấy người dùng" });
      }

      let type = "text";
      let content = text;

      if (req.file) {
        type = "file";
        content = req.file.path.replace(/\\/g, "/");
      }

      if (type === "text" && !content) {
         return res.status(400).send({ message: "Nội dung tin nhắn không được để trống" });
      }

      const newMessage = new messageModel({
        from,
        to,
        messageContent: {
          type,
          text: content
        }
      });

      await newMessage.save();

      return res.status(201).send({
        success: true,
        data: newMessage
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getConversation: async (req, res) => {
    try {
      const { userID } = req.params;
      const currentUserID = req.user._id;

      const messages = await messageModel.find({
        $or: [
          { from: currentUserID, to: userID },
          { from: userID, to: currentUserID }
        ]
      })
      .sort({ createdAt: 1 })
      .populate("from", "fullName username")
      .populate("to", "fullName username");

      return res.status(200).send({
        success: true,
        data: messages
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  },

  getLatestMessages: async (req, res) => {
    try {
      const currentUserID = req.user._id;

      const latestMessages = await messageModel.aggregate([
        {
          $match: {
            $or: [
              { from: currentUserID },
              { to: currentUserID }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$from", currentUserID] },
                "$to",
                "$from"
              ]
            },
            messageContent: { $first: "$messageContent" },
            createdAt: { $first: "$createdAt" },
            messageId: { $first: "$_id" },
            fromUser: { $first: "$from" },
            toUser: { $first: "$to" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            _id: 0,
            user: {
              _id: "$user._id",
              username: "$user.username",
              fullName: "$user.fullName",
              avatarUrl: "$user.avatarUrl"
            },
            messageContent: 1,
            createdAt: 1,
            messageId: 1,
            direction: {
              $cond: [
                { $eq: ["$fromUser", currentUserID] },
                "sent",
                "received"
              ]
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]);

      return res.status(200).send({
        success: true,
        data: latestMessages
      });
    } catch (error) {
      return res.status(500).send({ message: error.message });
    }
  }
};
