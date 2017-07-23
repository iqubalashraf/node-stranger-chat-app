var generateMessage = (name,socket_id, friend_socket_id,text,gender,country,notification,viewType) =>{
	return{
		name,
		socket_id,
		friend_socket_id,
		text,
		country,
		gender,
		notification,
		viewType,
		createdAt: new Date().getTime()
	};
};

var generateUploadResponseMessage = (filename, status) =>{
	return `{"filename":"${filename}", "status":${status}}`
};

module.exports = {generateMessage,generateUploadResponseMessage};