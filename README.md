
# Twitter Clone Backend

This backend application is the server-side component of a Twitter clone, built using Node.js and Express.js. It handles various functionalities that mirror the core features of Twitter, with a focus on scalability, security, and real-time communication.

## Key Features

### API Routes
- **User Management:** 
  - User registration, login, profile management, following/unfollowing users, and retrieving user timelines.
- **Tweet Management:**
  - CRUD operations for tweets: create, read, update, delete, like, and retweet.
- **Comments and Likes:**
  - Add comments to tweets, like comments, and view comment threads.
- **Search and Hashtags:**
  - Search functionality for users, tweets, and hashtags.

### Schemas
- **User Schema:**
  - Stores user information: username, email, password, bio, profile picture, followers, and following lists.
- **Tweet Schema:**
  - Manages tweet content, author, timestamps, comments, and likes references.
- **Comment Schema:**
  - Handles comment content, linking them to both the tweet and the author.

### Authentication & Authorization
- **JWT Authentication:**
  - Secures API endpoints with JWT tokens, ensuring only authenticated users can access protected routes.
- **Role-Based Access Control:**
  - Restricts access to certain routes based on user roles (e.g., admin, user).

### Email Sending with Nodemailer
- **Email Verification:**
  - Sends a verification email to new users during registration to confirm their email addresses.
- **Password Reset:**
  - Implements an OTP (One-Time Password) system for password resets, where users receive an OTP via email to verify their identity before resetting their password.

### Real-Time Chat with Socket.io
- **Direct Messaging:**
  - Enables real-time direct messaging between users using Socket.io for seamless communication.
- **Notifications:**
  - Real-time notifications for mentions, replies, and messages, enhancing user engagement.

### OTP for Password Reset
- **Secure OTP Generation:**
  - Generates secure, time-limited OTPs for password reset functionality.
- **Verification Process:**
  - Users receive an OTP via email, which they must enter to proceed with resetting their password, ensuring enhanced security.

## Tech Stack
- **Node.js & Express.js:** For building the server and API routes.
- **MongoDB & Mongoose:** For database management and schema definitions.
- **JWT:** For handling authentication and securing API endpoints.
- **Socket.io:** For enabling real-time communication between users.
- **Nodemailer:** For sending emails, including OTPs and verification emails.
- **BCrypt:** For securely hashing and storing user passwords.

This backend is optimized for performance and designed to handle a large number of concurrent users while maintaining the integrity and security of user data. It lays the foundation for a full-featured Twitter clone, providing robust API endpoints and real-time features essential for a social media platform.
