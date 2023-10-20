// Require the packages we will use:
const http = require("http"),
  fs = require("fs");

const port = 3456;
const file = "client.html";
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, res) {
  // This callback runs when a new connection is made to our HTTP server.

  fs.readFile(file, function (err, data) {
    // This callback runs when the client.html file has been read from the filesystem.

    if (err) return res.writeHead(500);
    res.writeHead(200);
    res.end(data);
  });
});
server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
  wsEngine: "ws",
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
const users = {};
const room_list = {
  Lobby: {
    online_users: [],
    banned_users: [],
    muted_users: [],
    room_owner: "root",
    password: null,
  },
};
const prive_msg_friend_list = {};
io.sockets.on("connection", function (socket) {
  // This callback runs when a new Socket.IO connection is established.
  io.sockets.emit("room_list", room_list);
  //online
  socket.on("login", function (data) {
    // saving username to object with socket username
    if (Object.hasOwn(users, data.username)) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_login",
        message: "Username already exist.",
      });
      return;
    }
    socket.user = data.username;
    console.log("user " + data.username + " connected");
    users[data.username] = socket.id;
    socket.join("Lobby");
    console.log(data.username + " in lobby");
    socket.room = "Lobby";
    room_list["Lobby"]["online_users"].push(data.username);
    // console.log(room_list);

    //tell user they have login
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_login",
      message: "Hello, " + data.username,
    });

    //update room list
    io.sockets.emit("room_list", room_list);
    io.in("Lobby").emit("user_list", {
      room_name: "Lobby",
      room_owner: "root",
      users: room_list["Lobby"]["online_users"],
      banned_users: room_list["Lobby"]["banned_users"],
      muted_users: room_list["Lobby"]["muted_users"],
    });
    io.to(socket.id).emit("login_update", { username: socket.user });
  });

  //offline
  socket.on("disconnect", function () {
    console.log("user " + users[socket.id] + " disconnected");
    // remove saved socket from users object
    delete users[socket.id];
  });

  //create room
  socket.on("create_room", function (data) {
    if (Object.hasOwn(room_list, data["room_name"])) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_create_room",
        message: "Room name already exists.",
      });
      return;
    }
    console.log("room: " + data.room_name + " created");
    // TODO password改进
    password = data.room_pwd !== "" ? data.room_pwd : null;
    room_list[data.room_name] = {
      online_users: [],
      banned_users: [],
      muted_users: [],
      room_owner: socket.user,
      password: password,
    };
    io.sockets.emit("room_list", room_list);
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_create_room",
      message: "Room " + data.room_name + " created",
    });
  });

  socket.on("join_room", function (data) {
    var current_room = socket.room;
    var new_room = data.room_name;
    const entered_pwd = data.room_pwd;
    // check if user already in room
    if (current_room == new_room) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_create_room",
        message: "You are currently in " + new_room,
      });
      return;
    }
    // check if the room exist
    if (!Object.hasOwn(room_list, new_room)) {
      console.log("room dne");
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_create_room",
        message: "Room does not exist.",
      });
      return;
    }
    // check the entered password
    if (room_list[new_room]["password"] != null) {
      if (entered_pwd != room_list[new_room]["password"]) {
        io.to(socket.id).emit("server_to_client_msg", {
          section: "msg_to_client_create_room",
          message: "Password is incorrect.",
        });
        return;
      }
    }
    // check if user is on the banned list
    if (room_list[new_room]["banned_users"].indexOf(socket.user) != -1) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_create_room",
        message: "You are banned from this room",
      });
      return;
    }
    // pass all checks, move user and update all lists
    socket.leave(current_room);
    socket.room = new_room;
    socket.join(new_room);

    //https://www.freecodecamp.org/news/how-to-remove-an-element-from-a-javascript-array-removing-a-specific-item-in-js/#:~:text=You%20can%20remove%20the%20element,of%20the%20element%20to%20remove.
    room_list[current_room]["online_users"].splice(
      room_list[current_room]["online_users"].indexOf(socket.user),
      1
    );

    room_list[new_room]["online_users"].push(socket.user);

    //broadcast change room information to each room
    io.in(current_room).emit("server_to_client_msg", {
      section: "msg_to_client",
      message: socket.user + " left.",
    });
    io.in(new_room).emit("server_to_client_msg", {
      section: "msg_to_client",
      message: socket.user + " joined.",
    });
    // refresh the user lists for relvant rooms
    io.in(current_room).emit("user_list", {
      room_name: current_room,
      room_owner: room_list[current_room]["room_owner"],
      users: room_list[current_room]["online_users"],
      banned_users: room_list[current_room]["banned_users"],
      muted_users: room_list[current_room]["muted_users"],
    });
    io.in(new_room).emit("user_list", {
      room_name: new_room,
      room_owner: room_list[new_room]["room_owner"],
      users: room_list[new_room]["online_users"],
      banned_users: room_list[new_room]["banned_users"],
      muted_users: room_list[current_room]["muted_users"],
    });
    // refresh room list due to number of users changed
    io.sockets.emit("room_list", room_list);
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_create_room",
      message: "Joined " + new_room,
    });
  });

  socket.on("message_to_server", function (data) {
    // This callback runs when the server receives a new message from the client.
    //check if user is on the mute list
    if (room_list[socket.room]["muted_users"].indexOf(socket.user) != -1) {
      io.to(socket.id).emit("message_to_client", {
        message: "You are muted by the room owner",
      });
      return;
    }
    if (data["pm_user"] != "everyone") {
      io.to(users[data["pm_user"]]).emit("message_to_client", {
        message: "(private message) " + socket.user + ": " + data["message"],
      });
      io.to(socket.id).emit("message_to_client", {
        message: "(private message) " + socket.user + ": " + data["message"],
      });
      return;
    }
    console.log(socket.user + ": " + data["message"]); // log it to the Node.JS output
    io.sockets.in(socket.room).emit("message_to_client", {
      message: socket.user + ": " + data["message"],
    }); // broadcast the message to other users
  });

  socket.on("ban_user", function (data) {
    // check if author is the room owner
    if (data["author"] != room_list[socket.room]["room_owner"]) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "Action fail because you are not the owner of this room.",
      });
      return;
    }
    // check if action user is in the room
    if (
      room_list[socket.room]["online_users"].indexOf(data["action_user"]) == -1
    ) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "User is not in this room.",
      });
      return;
    }
    // add to ban list
    room_list[socket.room]["banned_users"].push(data["action_user"]);

    // move user back to lobby
    io.to(users[data["action_user"]]).emit("forced_move", {
      user: data["action_user"],
      new_room: "Lobby",
    });

    // inform author action succeed
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_owner_tool",
      message: data["action_user"] + " banned and forced back to lobby.",
    });

    // update user_list
    io.in(socket.room).emit("user_list", {
      room_owner: room_list[socket.room]["room_owner"],
      users: room_list[socket.room]["online_users"],
      banned_users: room_list[socket.room]["banned_users"],
      muted_users: room_list[socket.room]["muted_users"],
    });
  });

  //handle unban request
  socket.on("unban_user", function (data) {
    // return if the initiator of this action is not the room's admin
    if (data["author"] != room_list[socket.room]["room_owner"]) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "Action fail because you are not the owner of this room.",
      });
      return;
    }
    var unban_user_position = room_list[socket.room]["banned_users"].indexOf(
      data["action_user"]
    );
    // check if user is ban
    if (unban_user_position == -1) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "This user is not on the banned list",
      });
      return;
    }
    // remove
    room_list[socket.room]["banned_users"].splice(unban_user_position, 1);

    // inform author action succeed
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_owner_tool",
      message: data["action_user"] + " unbanned",
    });

    // update user_list
    io.in(socket.room).emit("user_list", {
      room_owner: room_list[socket.room]["room_owner"],
      users: room_list[socket.room]["online_users"],
      banned_users: room_list[socket.room]["banned_users"],
      muted_users: room_list[socket.room]["muted_users"],
    });
  });

  //handle kick request
  socket.on("kick_user", function (data) {
    // check if the author != room owner
    if (data["author"] != room_list[socket.room]["room_owner"]) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "Action fail because you are not the owner of this room.",
      });
      return;
    }

    //check if user is in the room
    if (
      room_list[socket.room]["online_users"].indexOf(data["action_user"]) == -1
    ) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "User is not in this room.",
      });
      return;
    }

    // move user back to lobby
    io.to(users[data["action_user"]]).emit("forced_move", {
      user: data["action_user"],
      new_room: "Lobby",
    });

    // inform author action succeed
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_owner_tool",
      message: data["action_user"] + " kicked back to lobby.",
    });

    // update user_list
    io.in(socket.room).emit("user_list", {
      room_owner: room_list[socket.room]["room_owner"],
      users: room_list[socket.room]["online_users"],
      banned_users: room_list[socket.room]["banned_users"],
      muted_users: room_list[socket.room]["muted_users"],
    });
  });

  //handle invite user
  socket.on("invite_user", function (data) {
    //check if user is in the room
    if (
      room_list[socket.room]["online_users"].indexOf(data["action_user"]) != -1
    ) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "User is already in the room.",
      });
      return;
    }
    //check if user exist
    if (!Object.hasOwn(users, data["action_user"])) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "User does not exist.",
      });
      return;
    }
    //TODO how to send private msg // send invitation
    console.log(users[socket.id]);
    io.to(users[data["action_user"]]).emit("message_to_client", {
      message:
        users[socket.id] +
        " is invite you to room " +
        socket.room +
        " pwd is " +
        room_list[socket.room]["password"],
    });
  });

  //handle mute user
  socket.on("mute_user", function (data) {
    // check if author is the room owner
    if (data["author"] != room_list[socket.room]["room_owner"]) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "Action fail because you are not the owner of this room.",
      });
      return;
    }
    // check if action user is in the room
    if (
      room_list[socket.room]["online_users"].indexOf(data["action_user"]) == -1
    ) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "User is not in this room.",
      });
      return;
    }
    // add to mute list
    room_list[socket.room]["muted_users"].push(data["action_user"]);

    // inform author action succeed
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_owner_tool",
      message: data["action_user"] + " is muted.",
    });

    // update user_list
    io.in(socket.room).emit("user_list", {
      room_owner: room_list[socket.room]["room_owner"],
      users: room_list[socket.room]["online_users"],
      banned_users: room_list[socket.room]["banned_users"],
      muted_users: room_list[socket.room]["muted_users"],
    });
  });

  //handle unmute user
  socket.on("unmute_user", function (data) {
    // check if the author != room owner
    if (data["author"] != room_list[socket.room]["room_owner"]) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "Action fail because you are not the owner of this room.",
      });
      return;
    }
    var unmute_user_position = room_list[socket.room]["muted_users"].indexOf(
      data["action_user"]
    );
    // check if user is muted
    if (unmute_user_position == -1) {
      io.to(socket.id).emit("server_to_client_msg", {
        section: "msg_to_client_owner_tool",
        message: "This user is not on the muted list",
      });
      return;
    }
    // remove
    room_list[socket.room]["muted_users"].splice(unmute_user_position, 1);

    // inform author action succeed
    io.to(socket.id).emit("server_to_client_msg", {
      section: "msg_to_client_owner_tool",
      message: data["action_user"] + " is unmuted.",
    });

    // update user_list
    io.in(socket.room).emit("user_list", {
      room_owner: room_list[socket.room]["room_owner"],
      users: room_list[socket.room]["online_users"],
      banned_users: room_list[socket.room]["banned_users"],
      muted_users: room_list[socket.room]["muted_users"],
    });
  });
});
