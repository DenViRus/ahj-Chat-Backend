const uuid = require("uuid");

class User {
  constructor(name, color, status) {
    this.name = name;
    this.color = color;
    this.status = status;
    this.id = uuid.v4();
    this.checked = true;
  }
}
module.exports = User;