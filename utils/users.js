class Users {
  constructor () {
    this.users = [];
  }
  addUser (id, name, friend_socket_id, gender, country) {
    var user = {id, name, friend_socket_id, gender, country};
    this.users.push(user);
    return user;
  }
  removeUser (id) {
    var user = this.getUser(id);

    if (user) {
      this.users = this.users.filter((user) => user.id !== id);
    }

    return user;
  }
  getUser (id) {
    return this.users.filter((user) => user.id === id)[0]
  }
  getUserFriendId (id) {
    var user = this.users.filter((user) => user.id === id)[0]
    return user.friend_socket_id;
  }
}

module.exports = {Users};