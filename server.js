const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'mysecretkey';
//middleware
app.use(express.static('public')); 
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
//db conn
mongoose.connect('mongodb://localhost:27017/chatdb') 
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect:', err));
//user schema
const userSchema = new mongoose.Schema({ 
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);
//chat schema
const chatSchema = new mongoose.Schema({ 
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', chatSchema);
//signup
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
});
//login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: '12h' });
    res.json({ token, username: user.username });
});
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        req.user = user;
        next();
    });
};
//verify token route
app.get('/verify-token', authenticateToken, (req, res) => {
    res.json({ username: req.user.username });
});
// socket.io handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    //chat history
    socket.on('requestChatHistory', async () => {
        try {
            const messages = await Chat.find().sort({ timestamp: 1 });
            socket.emit('chatHistory', messages);
        } catch (error) {
            console.error('Failed to load chat history:', error);
        }
    });
    //new messages
    socket.on('chatMessage', async (data) => {
        try {
            const { msg, username, token } = data;

            if (!token || !username) {
                console.log('Unauthorized message attempt');
                return;
            }
            jwt.verify(token.split(' ')[1], SECRET_KEY, async (err, user) => {
                if (err) {
                    console.log('Invalid token:', err);
                    return;
                }
                const chatMessage = new Chat({
                    username,
                    message: msg
                });
                await chatMessage.save();
                io.emit('chatMessage', { username, msg });
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});