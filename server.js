const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const formidable = require('formidable');
const os=require('os');  
const file_path = os.homedir();
const fs = require('fs');

const {generateMessage, generateUploadResponseMessage} = require('./utils/message');
const {Users} = require('./utils/users');
const {NotConnectedUsers} = require('./utils/notConnectedUsers');

const port = process.env.PORT || 3000;

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
var notConnectedUsers = new NotConnectedUsers();

const VIEW_TYPE_MY_MESSAGE = 1;
const VIEW_TYPE_FRIEND_MESSAGE = 2;
const VIEW_TYPE_OTHER_MESSAGE = 3;
const VIEW_TYPE_MY_IMAGE_MESSAGE = 4;
const VIEW_TYPE_FRIEND_IMAGE_MESSAGE = 5;

const MALE = 0;
const FEMALE = 1;

const APP_VERSION_CODE = 5;

// app.use(express.static(__dirname));

// app.get('/', (req, res) => {
// 	 res.writeHead(200, {'Content-Type': 'text/html'});
//     res.write('<form action="uploads" method="post" enctype="multipart/form-data">');
//     res.write('<input type="file" name="filetoupload"><br>');
//     res.write('<input type="submit">');
//     res.write('</form>');
//     return res.end();
// });

// app.post('/uploads',(req, res) =>{
// 	var form = new formidable.IncomingForm();
//     form.parse(req, function (err, fields, files) {
//     	if (err){
//     		console.log('Error occured in uploading file');
//     		res.write(generateUploadResponseMessage("Error", 1));
//         	res.end();
//     	}else{
//     		var oldpath = files.filetoupload.path;
//       		var newpath = __dirname + '/' + files.filetoupload.name;
//       		fs.rename(oldpath, newpath, function (err) {
//         	if (err) throw err;
//         	res.write(generateUploadResponseMessage(files.filetoupload.name, 0));
//         	res.end();
//       		});
//     	}
      
// 	}); 
// });

// app.get('/download', function(req, res){
//   var file = __dirname + '/'+ req.query.filename;
//   res.download(file); // Set disposition and send it.
// });

io.on('connection', (socket) =>{
	io.to(socket.id).emit('appVersion', {
		'versionCode': APP_VERSION_CODE
	});
	socket.on('join', (params, callback) =>{
		callback(0);
		var user = notConnectedUsers.getUser();
		io.to(socket.id).emit('onWaiting', generateMessage(params.name, socket.id, null,
		 'Waiting for another user...', params.gender, params.country, false,
		  VIEW_TYPE_OTHER_MESSAGE));
		if(user){ 
			users.removeUser(user.id);
			notConnectedUsers.removeUser(user.id);
			users.addUser(user.id, user.name, socket.id, user.gender, user.country);
			var gender = null;
			if(params.gender === MALE){
				gender = 'Male';
			}else if(params.gender === FEMALE){
				gender = 'Female';
			}
			io.to(user.id).emit('onConnected', generateMessage(user.name, user.id, socket.id,
			 `Connected ${gender} Partner`, user.gender, user.country, true,
			  VIEW_TYPE_OTHER_MESSAGE));
			console.log(`users added: ${users.getUser(user.id).name}`);
			users.removeUser(socket.id);
			users.addUser(socket.id, params.name, user.id, params.gender, params.country);
			if(user.gender === MALE){
				gender = 'Male';
			}else if(user.gender === FEMALE){
				gender = 'Female';
			}
			io.to(socket.id).emit('onConnected', generateMessage(params.name, socket.id, user.id, 
				`Connected ${gender} Partner`, params.gender, params.country, true,
				 VIEW_TYPE_OTHER_MESSAGE));
			console.log(`users added: ${users.getUser(socket.id).name}`);
		}else{
			var user = notConnectedUsers.removeUser(socket.id);
			if(user)
				console.log(`notConnectedUsers Removed: 
					${notConnectedUsers.getUser(socket.id).name}`);
			notConnectedUsers.addUser(socket.id, params.name, params.gender, params.country);
			console.log(`notConnectedUsers added: ${notConnectedUsers.getUser(socket.id).name}`);
		}
		
	});

	socket.on('createMessage', (message, callback) =>{
		var user = users.getUser(socket.id);
		if(user){
			io.to(user.friend_socket_id).emit('newMessage', generateMessage(message.name, user.id,
			 user.friend_socket_id, message.text, user.gender, user.country, false,
			  VIEW_TYPE_FRIEND_MESSAGE));

			io.to(user.id).emit('newMessage', generateMessage(message.name, user.id,
			 user.friend_socket_id, message.text, user.gender, user.country, false,
			  VIEW_TYPE_MY_MESSAGE));

		}

		callback();
	});

	socket.on('createImageMessage', (message, callback) =>{
		var user = users.getUser(socket.id);
		if(user){
			io.to(user.friend_socket_id).emit('newImageMessage', generateMessage(message.name, user.id,
			 user.friend_socket_id, message.text, user.gender, user.country, false,
			  VIEW_TYPE_FRIEND_IMAGE_MESSAGE));

			io.to(user.id).emit('newImageMessage', generateMessage(message.name, user.id,
			 user.friend_socket_id, message.text, user.gender, user.country, false,
			  VIEW_TYPE_MY_IMAGE_MESSAGE));

		}

		callback();
	});

	socket.on('partnerLeft', (message, callback) =>{
		var unConnectedUser = notConnectedUsers.removeUser(socket.id);
		var user = users.removeUser(socket.id);
		var partner;
		if(unConnectedUser){
			console.log(`${unConnectedUser.name} left`);
			// io.to(socket.id).emit('partnerLeft', generateMessage(unConnectedUser.name,
			//  unConnectedUser.id, null, 'You left', unConnectedUser.gender, unConnectedUser.country,
			//   false, VIEW_TYPE_OTHER_MESSAGE));
		}
		if(user){
			console.log(`${user.name} left`);
			partner = users.removeUser(user.friend_socket_id);
			// io.to(socket.id).emit('partnerLeft', generateMessage(user.name,
			//  user.id, partner.id, `${partner.name} left.`,
			//   user.gender, user.country, false, VIEW_TYPE_OTHER_MESSAGE));
		}
		if(partner){
			console.log(`${partner.name} left`);
			io.to(partner.id).emit('partnerLeft', generateMessage(partner.name, partner.id,
			 user.id, `Partner left.`, partner.gender, partner.country, false,
			  VIEW_TYPE_OTHER_MESSAGE));
		}
		callback();
	});
	socket.on('disconnect', () =>{
		var unConnectedUser = notConnectedUsers.removeUser(socket.id);
		var user = users.removeUser(socket.id);
		var partner;
		if(unConnectedUser){
			console.log(`${unConnectedUser.name} left`);
			// io.to(socket.id).emit('partnerLeft', generateMessage(unConnectedUser.name,
			//  unConnectedUser.id, null, 'Left', unConnectedUser.gender, unConnectedUser.country,
			//   false, VIEW_TYPE_OTHER_MESSAGE));
		}
		if(user){
			console.log(`${user.name} left`);
			partner = users.removeUser(user.friend_socket_id);
			// io.to(socket.id).emit('partnerLeft', generateMessage(user.name, user.id,
			//  partner.id, `${partner.name} left.`, user.gender, user.country, false,
			//   VIEW_TYPE_OTHER_MESSAGE));
		}
		if(partner){
			console.log(`${partner.name} left`);
			io.to(partner.id).emit('partnerLeft', generateMessage(partner.name, partner.id,
			 user.id, `Partner left.`, partner.gender, partner.country, false,
			  VIEW_TYPE_OTHER_MESSAGE));
		}
	});
	socket.on('getUserListConnected', () =>{
		io.to(socket.id).emit('userListConnected', users);
	});
	socket.on('getUserListNotConnected', () =>{
		io.to(socket.id).emit('userListNotConnected', notConnectedUsers);
	});
});

server.listen(port, () =>{
	console.log(`Server is up on port ${port}`);
});