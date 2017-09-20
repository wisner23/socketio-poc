const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.use('/modules', express.static(__dirname + '/node_modules/'))
server.listen(3000)

app.get('/', (req, res) => {
    res.sendFile(__dirname +  '/index.html')
})

let users = {}
let messages = {}

io.on('connection', (socket) => {

    socket.join('global')
    socket.room = 'global'

    socket.emit('connected', { socket_id: socket.id})
    
    socket.on('connected-ack', (data) =>{
        connect(data.name)
    })

    socket.on('disconnect', () => {
        disconnect()
    })

    socket.on('new-message', (data) =>{
        messages[socket.room].push({name: socket.name, id: socket.id, msg: data.msg})
        io.in(socket.room).emit('user-new-message', {messages : messages[socket.room]})
    })

    socket.on('join-room',(data) =>{
        socket.leave(socket.room)
        disconnect()

        socket.join(data.room)
        socket.room = data.room

        connect(socket.name)
    })

    function connect(name){
        _initialize()
        socket.name = name
        users[socket.room].push({id: socket.id, name: socket.name})
        io.in(socket.room).emit('user-connected', {users: users[socket.room], messages: messages[socket.room]})

        console.log("user connected: "+ socket.name)
    }

    function disconnect(){
        _initialize()

        users[socket.room] = users[socket.room].filter( (u) =>{

            console.log("user disconnected: "+ u.name)
            return u.id !== socket.id
        })

        io.in(socket.room).emit('user-connected', {users : users[socket.room]})
    }

    function _initialize(){
        if (users[socket.room] === undefined){
            users[socket.room] = []
        }
    
        if (messages[socket.room] === undefined){
            messages[socket.room] = []
        }
    }
})


