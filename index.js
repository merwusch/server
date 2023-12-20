require('dotenv').config();

const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const harperSaveMessage = require('./services/harper-save-message');
const net = require('net');
const CHAT_BOT = 'ChatBot';

console.log(process.env.HARPERDB_URL);

let chatRoom = ''; // example: javascript, node...
let allUsers = [];// all users in current chat room

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// // listen for when the client connects via socket.io-client
io.on('connection', (socket) => {
    
    console.log(`User connected ${socket.id}`);

    //add a user to a room
    socket.on('join_room', (data) =>{
        const {username, room} = data;
        socket.join(room);

        let __createdtime__ = Date.now();

        //send message to all users currently in the room
        //apart from the user that just joined
        socket.to(room).emit('receive_message', {
            message: `${username} has joined the room`,
            username: CHAT_BOT,
            __createdtime__
        });

        // Save the new user to the room
        chatRoom = room;
        allUsers.push({ id: socket.id, username, room });
        chatRoomUsers = allUsers.filter((user) => user.room === room);
        socket.to(room).emit('chatroom_users', chatRoomUsers);
        socket.emit('chatroom_users', chatRoomUsers);

        
        
        // Send welcome msg to user that just joined chat only
        socket.emit('receive_message', {
            message: `Welcome ${username}`,
            username: CHAT_BOT,
            __createdtime__,
        });

        socket.on('send_message', (data) => {
        const { message, username, room, __createdtime__ } = data;
        io.in(room).emit('receive_message', data); // Send to all users in room, including sender
        harperSaveMessage(message, username, room, __createdtime__) // Save message in db
        .then((response) => console.log(response))
        .catch((err) => console.log(err));
        });
    });
});

app.get('/', (req, res) => {
    res.send('Hello world');
});

server.listen(4000, () => 'Server is running on port 4000');

