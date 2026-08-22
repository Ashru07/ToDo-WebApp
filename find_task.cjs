const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const TodoSchema = new mongoose.Schema({}, { strict: false });
    const Todo = mongoose.model('Todo', TodoSchema);

    const tasks = await Todo.find();
    const testTasks = tasks.filter(t => {
      const txt = (t.get('text') || '').toLowerCase();
      const date = new Date(t.get('createdAt') || t.get('dueDate'));
      return txt.includes('test') || (date.getMonth() === 7 && date.getDate() === 21);
    });

    console.log("Tasks found to delete:", testTasks.map(t => ({id: t._id, text: t.get('text'), date: t.get('createdAt')})));
    
    // delete them
    for (const task of testTasks) {
       await Todo.deleteOne({ _id: task._id });
    }
    console.log("Deleted.");
    process.exit(0);
  })
  .catch(console.error);
