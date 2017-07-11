var generateMessage = (name,socket_id, friend_socket_id,text,gender,country,notification) =>{
	return{
		name,
		socket_id,
		friend_socket_id,
		text,
		country,
		gender,
		notification,
		createdAt: new Date().getTime()
	};
};

module.exports = {generateMessage};