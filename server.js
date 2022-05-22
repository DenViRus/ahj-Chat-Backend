const http = require("http");
const Koa = require("koa");
const cors = require("@koa/cors");
const Router = require("koa-router");
const WS = require("ws");
const koaBody = require("koa-body");
const User = require("./User.js");
const Message = require("./Message");
const utils = require("./utils.js");

const app = new Koa();

const users = [];
const messages = [];

const randomItem = (arr) => {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
};

const getNewUser = (name = randomItem(utils.names), color = randomItem(utils.colors), status = "bot") => {
  const userName = name;
  const userColor = color;
  const userStatus = status;
  const newUser = new User(userName, userColor, userStatus);
  users.push(newUser);
  return newUser;
};
getNewUser();
getNewUser();
getNewUser();
getNewUser();
getNewUser();

const getNewMessage = (user = randomItem(users.filter((item) => item.status === "bot" && item.checked === true)), message = randomItem(utils.phrases)) => {
  if (user) {
    const currentUser = user;
    const currentMessage = message;
    const newMessage = new Message(currentUser.id, currentUser.status, currentUser.name, currentUser.color, currentMessage);
    messages.push(newMessage);
    if (messages.length > 10) {
      messages.splice(0, 1);
    }
    return newMessage;
  }
  return;
};
getNewMessage();
getNewMessage();
getNewMessage();
getNewMessage();
getNewMessage();

app.use(
  koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
  })
);

app.use(cors());

const router = new Router();

router.get("users", async (ctx) => {
  ctx.response.body = users;
});

router.get("messages", async (ctx) => {
  ctx.response.body = messages;
});

router.post("users", async (ctx) => {
  const { name, color, status } = ctx.request.body;
  if (checkUserName(name)) {
    const user = getNewUser(name, color, status);
    ctx.response.body = users;
  } else {
    ctx.response.body = "This nickname already exists, choose another name!";
    ctx.response.status = 404;
  }
});

router.post("messages/:id", async (ctx) => {
  const { text } = ctx.request.body;
  const user = users.find(({ id }) => id === ctx.params.id);
  if (user) {
    const message = getNewMessage(user, text);
    ctx.response.body = messages;
  } else {
    ctx.response.status = 404;
  }
});

router.put("users/:id", async (ctx) => {
  const user = users.find(({ id }) => id === ctx.params.id);
  if (user) {
    user.checked = user.checked === true ? false : true;
    ctx.response.body = users;
  } else {
    ctx.response.status = 404;
  }
});

router.delete("users/:id", async (ctx) => {
  const index = users.findIndex(({ id }) => id === ctx.params.id);
  if (index !== -1) {
    users.splice(index, 1);
    ctx.response.body = users;
  } else {
    ctx.response.status = 404;
  }
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

const wsServer = new WS.Server({ server });

wsServer.on("connection", (ws, req) => {
  const allcolors = "allcolors";
  const checkUserName = "checkUserName";
  const allUsers = "allUsers";
  const allMessages = "allMessages";
  const createUser = "createUser";
  const createMessage = "createMessage";
  const removeUser = "removeUser";
  const checkUser = "checkUser";

  const dataColors = JSON.stringify({
    event: allcolors,
    colors: utils.colors,
  });
  ws.send(dataColors);

  const newMessages = () => {
    const message = getNewMessage();
    if (message) {
      const data = JSON.stringify({
        event: createMessage,
        message: message,
      });
      ws.send(data);
    }
  };

  const tolking = () => {
    const message = getNewMessage();
    if (message) {
      const data = JSON.stringify({
        event: createMessage,
        message: message,
      });
      ws.send(data);
    }
    conversation = setTimeout(tolking, 10000);
  };

  let conversation = null;

  ws.on("message", (msg) => {
    const request = JSON.parse(msg);
    let data = null;

    if (request.event === checkUserName) {
      const user = users.find(({ name }) => name.toLowerCase() === request.data.name.toLowerCase());
      if (user) {
        data = JSON.stringify({
          event: checkUserName,
          error: "This nickname already exists, choose another name!",
        });
      } else {
        data = JSON.stringify({
          event: checkUserName,
        });
      }
    }

    if (request.event === allUsers) {
      data = JSON.stringify({
        event: allUsers,
        users: users,
      });
    }

    if (request.event === allMessages) {
      data = JSON.stringify({
        event: allMessages,
        messages: messages,
      });
    }

    if (request.event === createUser) {
      const { name, color, status } = request.data;
      const user = getNewUser(name, color, status);
      data = JSON.stringify({
        event: createUser,
        user: user,
      });
      conversation = setTimeout(tolking, 10000);
    }

    if (request.event === createMessage) {
      const { id, text } = request.data;
      const user = users.find((item) => item.id === id);
      if (user) {
        const message = getNewMessage(user, text);
        data = JSON.stringify({
          event: createMessage,
          message: message,
        });
      }
      setTimeout(newMessages, 2000);
      setTimeout(newMessages, 3000);
    }

    if (request.event === checkUser) {
      const user = users.find(({ id }) => id === request.data.id);
      if (user) {
        user.checked = user.checked === true ? false : true;
        data = JSON.stringify({
          event: checkUser,
          id: user.id,
          checked: user.checked,
        });
      }
    }

    if (request.event === removeUser) {
      const user = users.find(({ id }) => id === request.data.id);
      if (user) {
        const index = users.findIndex(({ id }) => id === request.data.id);
        users.splice(index, 1);
        if (user.status === "user") {
          clearTimeout(conversation);
          data = dataColors;
        } else {
          data = JSON.stringify({
            event: removeUser,
            id: user.id,
          });
        }
      }
    }
    [...wsServer.clients].filter((o) => o.readyState === WS.OPEN).forEach((o) => o.send(data));
  });
});

server.listen(port, () => console.log("Server started!!"));

// netstat -ano | findstr :7070
// taskkill //PID ... //F
