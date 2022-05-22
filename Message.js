class Message {
  constructor(userId, userStatus, userName, userColor, userText) {
    this.userId = userId;
    this.userStatus = userStatus;
    this.userName = userName;
    this.userColor = userColor;
    this.userText = userText;
    this.created = new Date().toLocaleString();
  }
}
module.exports = Message;