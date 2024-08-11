require('dotenv').config();
const express = require('express');
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const UserRoutes = require("./routes/User.routes");
const twitterRoutes = require("./routes/Twitter.routes");
const cors = require('cors');
const expressLayout = require("express-ejs-layouts");
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Create the Express application
const app = express();
app.use(express.json());

// Set the port
const PORT = 5000 ||process.env.PORT;

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://syedmutahir908:Mongoauth123@cluster0.da7uyp9.mongodb.net/';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error('Could not connect to MongoDB..', err));

app.use(express.static('public'));
app.use(cookieParser());

// Set up CORS options
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true
};
app.use(cors(corsOptions));

// Set up Express layouts and view engine
app.use(expressLayout);
app.set("layout", './layout/main');
app.set('view engine', "ejs");

// Use routes
app.use("/api", UserRoutes);
app.use("/api", twitterRoutes);

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Create HTTP server and initialize Socket.io
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"]
//   }
// });


let users = {}; // Object to store username: socket.id pairs

// // Handle Socket.io connections
// io.on('connection', (socket) => {
//     console.log('A user connected');
  
//     // When a user sets their username
//     socket.on('set username', (username) => {
//       console.log(`${username} is connected`);
//       users[username] = socket.id; // Store the username and socket.id pair
//       socket.username = username;
//     });
  
//     // When a user sends a private message
//     socket.on('private message', ({ recipient, message }) => {
//       const recipientSocketId = users[recipient];
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit('private message', {
//           sender: socket.username,
//           message: message,
//         });
//       }
//     });
  
//     // Handle typing notifications
//     socket.on('typing', (recipient) => {
//       const recipientSocketId = users[recipient];
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit('typing', `${socket.username} is typing...`);
//       }
//     });
  
//     socket.on('stop typing', (recipient) => {
//       const recipientSocketId = users[recipient];
//       if (recipientSocketId) {
//         io.to(recipientSocketId).emit('stop typing');
//       }
//     });
  
//     // When a user disconnects
//     socket.on('disconnect', () => {
//       if (socket.username) {
//         console.log(`${socket.username} disconnected`);
//         delete users[socket.username]; // Remove the user from the list
//       }
//     });
//   });
// // Start the server
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
