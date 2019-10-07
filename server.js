const express = require('express')
const fs = require('fs')
const https = require('https')
const app = express()


app.get('/', function (req, res) {
  res.send('hello world')
})

const server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app);
server.listen(3000, function () {
  console.log('Example app listening on port 3000! Go to https://localhost:3000/')
});

const io = require('socket.io')(server);
io.on('connection', (socket) => { 
    console.log('SocketIO connected');
    socket.emit('event', {payload: 'Hello!!!'});
    socket.on('sendRfqMessageEvent', (data) => {
        console.log('Got event from client', data);
    });
});

/*setInterval(() => {
    io.emit('serverEvent', {payload: new Date()});
}, 1000)*/
