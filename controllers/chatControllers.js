const asyncHandler = require('express-async-handler')
const Chat = require('../models/chatModel')
const User = require('../models/userModel')
const { ObjectId } = require('mongodb');


const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body

    if (!userId) {
        console.log("UserId param not sent with request")
        return res.sendStatus(400)
    }

    let isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } }
        ]
    }).populate("users", "-password")
    .populate("latestMessage")

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: "name pic email",
    })

    if (isChat.length > 0) {
        res.send(isChat[0])
    } else {
        let chatData = {
            chatName: 'sender',
            isGroupChat: false,
            users: [req.user._id, userId]
        }
        try {
            const createChat = await Chat.create(chatData)

            const fullChat = await Chat.findOne({_id: createChat._id})
            .populate("users", "-password")

            res.status(200).send(fullChat)
        } catch (error) {
            res.status(400)
            throw new Error(error.message)
        }
    }
})

const fetchChats = asyncHandler(async (req, res) => {
    try {
        Chat.find({users: { $elemMatch: { $eq: req.user._id } } })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({ updatedAt: -1})
        .then(async (result) => {
            result = await User.populate(result, {
                path: "latesyMessage.sender",
                select: "name pic email"
            })

            res.status(200).send(result)})
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const createGroupChat = asyncHandler(async (req, res) => {
    try {
        if (!req.body.users || !req.body.name) {
            return res.status(400).send({ message: "Please fill all the fields"})
        }
        let users = JSON.parse(req.body.users)

        if (users.length < 2) {
            return res.status(400).send("More then 2 users are required to form a  group chat")
        }

        users.push(req.user);

        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user
        })

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")

        res.status(200).json(fullGroupChat)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body

    const groupAdmin = await Chat.find({groupAdmin: req.user._id, _id: new ObjectId(`${chatId}`)})

    if (!groupAdmin.length) throw new Error("Only Admins can edit group!")

    const updatedChat = await Chat.findByIdAndUpdate(chatId, 
        {
            chatName
        }, {
            new: true
        }
    ).populate("users", "-password")
    .populate("groupAdmin", "-password")

    if (!updatedChat) {
        res.status(400)
        throw new Error("Chat Not Found")
    } else {
        res.status(200).json(updatedChat)
    }
})

const addToGroup = asyncHandler(async (req, res) => {
    try {
        const { chatId, userId } = req.body
        
        const groupAdmin = await Chat.find({groupAdmin: req.user._id, _id: new ObjectId(`${chatId}`)})

        if (!groupAdmin.length) throw new Error("Only Admins can add someone!")

        const added = await Chat.findByIdAndUpdate(
            chatId, 
            {
                $push: { users: userId}
            },
            { new: true }
        ).populate("users", "-password")
        .populate("groupAdmin", "-password")

        if (!added) {
            res.status(404)
            throw new Error("Chat Not Found")
        } else {
            res.json(added)
        }
    } catch (error) {
        console.log(error)
        res.status(400)
        throw new Error(error.message)
    }
})

const removeFromGroup = asyncHandler(async (req, res) => {
    try {
        const { chatId, userId } = req.body

        const groupAdmin = await Chat.find({groupAdmin: req.user._id, _id: new ObjectId(`${chatId}`)})

        if (!groupAdmin.length) throw new Error("Only Admins can remove someone!")

        const removed = await Chat.findByIdAndUpdate(
            chatId, 
            {
                $pull: { users: userId}
            },
            { new: true }
        ).populate("users", "-password")
        .populate("groupAdmin", "-password")

        if (!removed) {
            res.status(404)
            throw new Error("Chat Not Found")
        } else {
            res.json(removed)
        }
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})


module.exports = { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup }