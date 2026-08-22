import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const User = mongoose.model('User', new mongoose.Schema({ id: String, email: String }, {strict: false}));
    const Todo = mongoose.model('Todo', new mongoose.Schema({ userId: String, id: Number, text: String, alarmMessage: String }, {strict: false}));

    const user = await User.findOne({});
    if (!user) return console.log("No user found");
    const todo = await Todo.findOne({ userId: user.id });
    if (!todo) return console.log("No todo found");

    console.log(`Testing with user ${user.email} and todo ${todo.text}`);
    
    // Simulate triggering the email
    import('nodemailer').then(async (nodemailer) => {
      try {
        console.log(`process.env.EMAIL_USER: ${process.env.EMAIL_USER}`);
        const transporter = nodemailer.default.createTransport({
          service: 'gmail',
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        
        await transporter.sendMail({
          from: `"Todo App Notifications" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Todo Alarm Test: ${todo.text}`,
          text: `Test email sending...`,
        });
        console.log("Mail sent successfully!");
        process.exit(0);
      } catch (err) {
        console.error("Mail error:", err);
        process.exit(1);
      }
    });
  })
  .catch(console.error);
