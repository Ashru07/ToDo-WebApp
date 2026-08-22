import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({ id: String, email: String }, {strict: false}));
    const Todo = mongoose.model('Todo', new mongoose.Schema({ userId: String, id: Number, text: String, alarmMessage: String, alarmTriggered: Boolean }, {strict: false}));

    const user = await User.findOne({});
    const todo = await Todo.findOne({ userId: user.id });
    
    // Reset alarmTriggered to false for testing
    await Todo.updateOne({ _id: todo._id }, { $set: { alarmTriggered: false } });

    console.log(`Testing HTTP trigger with STRING todoId for user ${user.id} and todo ${todo.id}`);
    
    // We are deliberately passing it as a STRING
    const stringTodoId = String(todo.id);
    
    const res = await fetch('http://127.0.0.1:3001/api/alarms/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, todoId: stringTodoId })
    });
    
    const data = await res.json();
    console.log("HTTP trigger response:", data);
    
    // Wait a second to allow background email logic to complete if any
    setTimeout(() => {
        process.exit(0);
    }, 2000);
  })
  .catch(console.error);
