import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({ id: String, email: String }, {strict: false}));
    const Todo = mongoose.model('Todo', new mongoose.Schema({ userId: String, id: Number, text: String, alarmMessage: String }, {strict: false}));

    const user = await User.findOne({});
    const todo = await Todo.findOne({ userId: user.id });
    
    console.log(`Testing HTTP trigger for user ${user.id} and todo ${todo.id}`);
    const res = await fetch('http://localhost:3000/api/alarms/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, todoId: todo.id })
    });
    const data = await res.json();
    console.log("HTTP trigger response:", data);
    process.exit(0);
  })
  .catch(console.error);
