const mongoose = require("mongoose");
const Quiz = require("../models/quizz"); // path to your Quiz model

async function publishAllQuizzes() {
  await mongoose.connect("mongodb+srv://anjupavithranm95_db_user:anju123@cluster0.xyiidkl.mongodb.net/onlineeduapp?retryWrites=true&w=majority&appName=Cluster0");

  const result = await Quiz.updateMany(
    { published: false },
    { $set: { published: true } }
  );

  console.log("Updated quizzes:", result.modifiedCount);
  mongoose.disconnect();
}

publishAllQuizzes().catch(console.error);
