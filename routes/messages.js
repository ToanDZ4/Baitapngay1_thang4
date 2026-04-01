const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messages");
const { CheckLogin } = require("../utils/authHandler");
const { uploadFile } = require("../utils/uploadHandler");

router.post("/", CheckLogin, uploadFile.single("file"), messageController.postMessage);

router.get("/:userID", CheckLogin, messageController.getConversation);

router.get("/", CheckLogin, messageController.getLatestMessages);

module.exports = router;
