class NotConnectedUsers {
  constructor () {
    this.users = [];
  }
  addUser (id, name, gender, country) {
    var user = {id, name, gender, country};
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
  getUser () {
    return this.users[0]
  }
}

module.exports = {NotConnectedUsers};