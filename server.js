import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { parseISO, isSameDay, addMinutes } from 'date-fns';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB Setup
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('\x1b[31m%s\x1b[0m', 'CRITICAL ERROR: MONGODB_URI is not defined in .env');
  console.log('Please add your MongoDB connection string to the .env file.');
}

// Mongoose Schemas
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String },
  gmailAppPassword: { type: String }
});
const User = mongoose.model('User', userSchema);

// strict: false allows dynamic fields from frontend without defining everything
const todoSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  id: { type: Number, required: true }
}, { strict: false });
const Todo = mongoose.model('Todo', todoSchema);


// Initialize Firebase Admin SDK
let isFirebaseInitialized = false;
try {
  if (fs.existsSync('./serviceAccountKey.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
    if (serviceAccount.project_id && serviceAccount.project_id !== "your-project-id") {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      isFirebaseInitialized = true;
      console.log('Firebase Admin initialized successfully.');
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
}

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, gmailAppPassword } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const newUser = new User({
      id: Date.now().toString(),
      email: normalizedEmail,
      password,
      name,
      gmailAppPassword
    });
    
    await newUser.save();
    res.json({ id: newUser.id, email: newUser.email, name: newUser.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase(), password });
    
    if (user) {
      res.json({ id: user.id, email: user.email, name: user.name, gmailAppPassword: user.gmailAppPassword });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (user) {
      await Todo.deleteMany({ userId: user.id });
      await User.deleteOne({ email });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/todos', async (req, res) => {
  try {
    const { userId } = req.query;
    // Sort by _id descending to keep the unshift behavior
    const todos = await Todo.find({ userId }).sort({ _id: -1 }).lean();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { userId, todo } = req.body;
    const newTodo = new Todo({ ...todo, userId });
    await newTodo.save();
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { userId, todo } = req.body;
    const id = parseInt(req.params.id);
    
    // Replace the entire document with the new one except _id and userId
    const updateResult = await Todo.findOneAndReplace(
      { userId, id }, 
      { ...todo, userId },
      { returnDocument: 'after' }
    );
    
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const id = parseInt(req.params.id);
    await Todo.deleteOne({ userId, id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backward compatibility
app.post('/api/email', async (req, res) => {
  const { email, password, to, subject, text } = req.body;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: email, pass: password },
    });
    const info = await transporter.sendMail({ from: `"Todo App" <${email}>`, to, subject, text });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cron Job for Offline Alarms
setInterval(async () => {
  if (mongoose.connection.readyState !== 1) return; // Wait until connected
  
  try {
    const now = new Date();
    // Find all users who have a gmail app password
    const users = await User.find({ gmailAppPassword: { $exists: true, $ne: '' } });
    
    for (const user of users) {
      // Find all active alarms for this user
      const userTodos = await Todo.find({ 
        userId: user.id, 
        completed: false, 
        hasAlarm: true, 
        time: { $exists: true, $ne: null }, 
        alarmTriggered: { $ne: true } 
      });

      for (const todo of userTodos) {
        const offsetNow = addMinutes(now, todo.get('alarmOffset') || 0);
        const checkHours = offsetNow.getHours().toString().padStart(2, '0');
        const checkMinutes = offsetNow.getMinutes().toString().padStart(2, '0');
        const checkTimeString = `${checkHours}:${checkMinutes}`;

        if (todo.get('time') === checkTimeString) {
          const createdAt = todo.get('createdAt');
          const dueDate = todo.get('dueDate');
          const todoDate = dueDate ? parseISO(dueDate) : (createdAt ? parseISO(createdAt) : now);
          
          if (isSameDay(todoDate, now)) {
            // Mark as triggered
            await Todo.updateOne({ _id: todo._id }, { $set: { alarmTriggered: true } });
            
            console.log(`[CRON] Alarm triggered for ${user.email} - Task: ${todo.get('text')}`);
            
            try {
              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: user.email, pass: user.gmailAppPassword },
              });

              await transporter.sendMail({
                from: `"Todo App" <${user.email}>`,
                to: user.email,
                subject: 'Todo Alarm!',
                text: todo.get('alarmMessage') || `Hello, this is a reminder for your task: ${todo.get('text')}`,
              });
              console.log(`[CRON] Email successfully sent to ${user.email}`);
            } catch (err) {
              console.error(`[CRON] Failed to send email to ${user.email}:`, err.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Error processing alarms:', err.message);
  }
}, 30000); // Check every 30 seconds

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
  if (!isFirebaseInitialized) {
    console.log('\x1b[33m%s\x1b[0m', 'WARNING: Firebase Admin not configured. Push notifications will not work.');
  }
});
