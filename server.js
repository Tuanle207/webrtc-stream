const express = require('express');
const app = express();

const socketio = require('socket.io');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/chat.html');
})

const server = app.listen(8000);

const io = socketio(server);



io.on('connection', socket => {
    const room = 'stream';
    socket.join(room);
    console.log('1 user joined!');

    socket.on('offer', data => {
        console.log(`offering...${data.id}, ${data.description}`);
        io.to(room).emit('offer', data);
    });
    socket.on('answer', data => {
        console.log(`answering...${data.id}, ${data.description}`);
        io.to(room).emit('answer', data);
    });
    socket.on('candidate', data => {
        io.to(room).emit('candidate', data);
    });
});