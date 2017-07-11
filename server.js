const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage} = require('./utils/message');
const {Users} = require('./utils/users');
const {NotConnectedUsers} = require('./utils/notConnectedUsers');

const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
var notConnectedUsers = new NotConnectedUsers();

app.use(express.static(__dirname));

io.on('connection', (socket) =>{

	socket.on('join', (params, callback) =>{
		var user = notConnectedUsers.getUser();
		io.to(socket.id).emit('onWaiting', generateMessage(params.name, socket.id, null, 'Waiting for another user...', params.gender, params.country, false));
		if(user){
			users.removeUser(user.id);
			notConnectedUsers.removeUser(user.id);
			users.addUser(user.id, user.name, socket.id, user.gender, user.country);
			io.to(user.id).emit('onConnected', generateMessage(user.name, user.id, socket.id, `Connected with ${params.name}`, user.gender, user.country, true));
			console.log(`users added: ${users.getUser(user.id).name}`);
			users.removeUser(socket.id);
			users.addUser(socket.id, params.name, user.id, params.gender, params.country);
			io.to(socket.id).emit('onConnected', generateMessage(params.name, socket.id, user.id, `Connected with ${user.name}`, params.gender, params.country, true));
			console.log(`users added: ${users.getUser(socket.id).name}`);
		}else{
			var user = notConnectedUsers.removeUser(socket.id);
			if(user)
				console.log(`notConnectedUsers Removed: ${notConnectedUsers.getUser(socket.id).name}`);
			notConnectedUsers.addUser(socket.id, params.name, params.gender, params.country);
			console.log(`notConnectedUsers added: ${notConnectedUsers.getUser(socket.id).name}`);
		}
		
	});

	socket.on('createMessage', (message, callback) =>{
		var user = users.getUser(socket.id);
		if(user){
			io.to(user.friend_socket_id).emit('newMessage', generateMessage(message.name, user.id, user.friend_socket_id, message.text, user.gender, user.country, false));
		}

		callback();
	});
	socket.on('partnerLeft', (message, callback) =>{
		var unConnectedUser = notConnectedUsers.removeUser(socket.id);
		var user = users.removeUser(socket.id);
		var partner;
		if(unConnectedUser){
			console.log(`${unConnectedUser.name} left`);
			io.to(socket.id).emit('partnerLeft', generateMessage(unConnectedUser.name, unConnectedUser.id, null, null, unConnectedUser.gender, unConnectedUser.country, false));
		}
		if(user){
			console.log(`${user.name} left`);
			partner = users.removeUser(user.friend_socket_id);
			io.to(socket.id).emit('partnerLeft', generateMessage(user.name, user.id, partner.id, `${partner.name} left.`, user.gender, user.country, false));
		}
		if(partner){
			console.log(`${partner.name} left`);
			io.to(partner.id).emit('partnerLeft', generateMessage(partner.name, partner.id, user.id, `${user.name} left.`, partner.gender, partner.country, false));
		}
		callback();
	});
	socket.on('disconnect', () =>{
		var unConnectedUser = notConnectedUsers.removeUser(socket.id);
		var user = users.removeUser(socket.id);
		var partner;
		if(unConnectedUser){
			console.log(`${unConnectedUser.name} left`);
			io.to(socket.id).emit('partnerLeft', generateMessage(unConnectedUser.name, unConnectedUser.id, null, null, unConnectedUser.gender, unConnectedUser.country, false));
		}
		if(user){
			console.log(`${user.name} left`);
			partner = users.removeUser(user.friend_socket_id);
			io.to(socket.id).emit('partnerLeft', generateMessage(user.name, user.id, partner.id, `${partner.name} left.`, user.gender, user.country, false));
		}
		if(partner){
			console.log(`${partner.name} left`);
			io.to(partner.id).emit('partnerLeft', generateMessage(partner.name, partner.id, user.id, `${user.name} left.`, partner.gender, partner.country, false));
		}
	});
});

server.listen(port, () =>{
	console.log(`Server is up on port ${port}`);
});