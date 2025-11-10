// backend/createquizz.js
const mongoose = require('mongoose');
require('dotenv').config();
const Quiz = require('./models/quizz'); // make sure this path matches
async function run() {
  await mongoose.connect(process.env.MONGO_URI, {});

  const oid = mongoose.Types.ObjectId;
  const testCourseId = new oid();
  const opt1 = new oid();
  const opt2 = new oid();

  const q = await Quiz.create({
    title: "Test Quiz (auto)",
    slug: `test-quiz-${Date.now()}`,
    description: "Temporary quiz for local testing",
    courseId: testCourseId,
    questions: [
      {
        text: "What is 2 + 2?",
        options: [
          { _id: opt1, text: "3" },
          { _id: opt2, text: "4" }
        ],
        correctOptionId: opt2,            // <-- set correct option here
        explanation: "2 + 2 is 4",
        points: 1
      }
    ],
    createdBy: new oid(),
  });

  console.log('✅ Inserted test quiz:', {
    _id: q._id.toString(),
    slug: q.slug,
    questions: q.questions.length,
  });

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Failed to create test quiz', err);
  process.exit(1);
});
