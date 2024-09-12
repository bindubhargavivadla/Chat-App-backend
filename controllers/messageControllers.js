const asyncHandler = require('express-async-handler')
const Message = require('../models/messageModel')
const Chat = require('../models/chatModel')
const User = require('../models/userModel')

const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body
    if (!content && !chatId) {
        console.log("Invalid data passed into request")
        return res.sendStatus(400)
    }

    let newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    }

    try {
        let message = await Message.create(newMessage)

        message = await message.populate("sender", "name pic")
        message = await message.populate("chat")
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email"
        })

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: message
        })

        res.json(message)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const allMessage = asyncHandler(async (req, res) => {
    try {
        const message = await Message.find({ chat: req.params.chatId })
        .populate("sender", "name pic email")
        .populate("chat")

        res.json(message)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const likeMessage = asyncHandler(async (req, res) => {
    try {
        const likes = await Message.findByIdAndUpdate(
            req.params.messageId, 
            {
                $push: { likes: req.body.userId}
            },
            { new: true }
        ).populate("sender", "name pic email")
        .populate("chat")

        res.json(likes)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})
module.exports = { sendMessage, allMessage, likeMessage }