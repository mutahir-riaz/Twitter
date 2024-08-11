<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Group Chat</title>
  <style>
    * {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background-color: #f4f4f9;
}

.container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 25%;
  background-color: #2d2f36;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile {
  text-align: center;
  padding: 20px;
}

.profile img {
  border-radius: 50%;
}

.users {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.user {
  padding: 15px;
  text-align: center;
  cursor: pointer;
  border-bottom: 1px solid #41444b;
}

.user:hover {
  background-color: #41444b;
}

.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}

.messages {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.messages li {
  padding: 10px;
  margin-bottom: 10px;
  background-color: #ececec;
  border-radius: 5px;
}

.input-container {
  display: flex;
  gap: 10px;
}

input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  padding: 10px;
  background-color: #2d2f36;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #41444b;
}
#userImage{
  width: 50px;
  height: 50px;
}
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="profile">
        <img src="https://via.placeholder.com/50" alt="User Image" id="userImage">
        <h2 id="userhai">Username</h2>
      </div>
      <ul class="users">
        <li class="user">User 1</li>
        <li class="user">User 2</li>
        <li class="user">User 3</li>
      </ul>
    </div>
    <div class="chat">
      <ul class="messages" id="messages"></ul>
      <div id="typing"></div>
      <div class="input-container">
        <input id="username" placeholder="Enter username" />
        <input id="message" placeholder="Enter message" />
        <input type="file" id="fileInput" placeholder="Select an image" />
        <button onclick="sendMessage()">Send</button>
      </div>
    </div>
  </div>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io('http://localhost:8000');
let typingTimeout;

document.getElementById('username').addEventListener('change', (event) => {
const username = event.target.value;
document.getElementById('userhai').textContent = username;
socket.emit('set username', username);
});

document.getElementById('message').addEventListener('input', () => {
socket.emit('typing');
clearTimeout(typingTimeout);
typingTimeout = setTimeout(() => {
  socket.emit('stop typing');
}, 3000);
});

function sendMessage() {
const message = document.getElementById('message').value;
socket.emit('chat message', message);
document.getElementById('message').value = '';
socket.emit('stop typing');
}

document.getElementById('fileInput').addEventListener('change', (event) => {
const file = event.target.files[0];
if (file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    // Assuming you want to display the image in the profile section
    document.getElementById('userImage').src = e.target.result;
  };
  reader.readAsDataURL(file);
}
});

socket.on('chat message', (data) => {
const messageElement = document.createElement('li');
messageElement.textContent = `${data.username}: ${data.message}`;
document.getElementById('messages').appendChild(messageElement);
});

socket.on('user connected', (msg) => {
const messageElement = document.createElement('li');
messageElement.textContent = msg;
document.getElementById('messages').appendChild(messageElement);
document.getElementById('userhai').TEXT_NODE(messageElement);
});

socket.on('user disconnected', (msg) => {
const messageElement = document.createElement('li');
messageElement.textContent = msg;
document.getElementById('messages').appendChild(messageElement);
});

socket.on('typing', (msg) => {
document.getElementById('typing').textContent = msg;
});

socket.on('stop typing', () => {
document.getElementById('typing').textContent = '';
});

  </script>
</body>
</html>
