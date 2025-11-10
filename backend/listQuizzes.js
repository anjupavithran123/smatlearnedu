// scripts/listQuizzes.js
const mongoose = require('mongoose');
require('dotenv').config();
const Quiz = require('./models/quizz'); // adjust if path differs

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const docs = await Quiz.find({}, { _id: 1, title: 1, slug: 1 }).lean();
  console.log('quizzes:', docs);
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
