const express = require('express')
const connectDB = require('./config/db')
const userRoutes = require('./routes/userRoutes')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')
const chatRoutes = require('./routes/chatRoutes')
const messageRoute = require('./routes/messageRoutes')
const path = require('path')

const app = express()
require('dotenv').config()
connectDB()

app.use(express.json())

app.use('/api/user', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoute)

app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 5000
const server = app.listen(port, (req, res) => {
    console.log(`Server running on port: ${port}`)
})

const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000"
    }
})

io.on("connection", (socket) => {
    console.log("connected to socket.io")

    socket.on('setup', (userData) => {
        console.log(userData._id)
        socket.join(userData._id)
        socket.emit('connected')
    })

    socket.on('join chat', (room) => {
        socket.join(room)
        console.log("User Joined Room: " + room)
    })

    socket.on('typing', (room) => {
        socket.in(room).emit("typing")
    })

    socket.on('stop typing', (room) => {
        socket.in(room).emit("stop typing")
    })

    socket.on("new message", (newMessageReceived) => {
        let chat = newMessageReceived.chat

        if (!chat.users) return console.log("chat.users not defined")

        chat.users.forEach(user => {
            if (user._id === newMessageReceived.sender._id) return

            socket.in(user._id).emit("message received", newMessageReceived)
        })
    })

    socket.off('setup', () => {
        console.log("USER DISCONNECTED")
        socket.leave(userData._id)
    })

})