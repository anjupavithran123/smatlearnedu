// routes/quizzes.js
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Quiz = require('../models/quizz');
const authMiddleware = require('../middleware/authmiddleware'); // must set req.user

// Helper: generate slug
function toSlug(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper: validate ObjectId
function isValidObjectId(id) {
  try {
    return mongoose.Types.ObjectId.isValid(String(id));
  } catch {
    return false;
  }
}

// Helper: remove correctOptionId from quiz object (non-destructive)
function hideCorrectAnswers(quizDoc) {
  if (!quizDoc) return quizDoc;
  const q = typeof quizDoc.toObject === 'function' ? quizDoc.toObject() : { ...quizDoc };
  if (Array.isArray(q.questions)) {
    q.questions = q.questions.map((ques) => {
      const obj = { ...ques };
      delete obj.correctOptionId;
      return obj;
    });
  }
  return q;
}

/* -------------------- CREATE -------------------- */
// POST /quizzes
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'forbidden' });
    }

    const { title, description, courseId, questions, timeLimitMinutes, slug, published } = req.body;

    if (!title || !courseId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'title, courseId and at least one question are required' });
    }

    if (!isValidObjectId(courseId)) {
      return res.status(400).json({ error: 'invalid courseId' });
    }

    for (const [idx, q] of questions.entries()) {
      if (!q.text || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({ error: `question #${idx + 1} must have text and at least 2 options` });
      }

      if (!q.correctOptionId || !isValidObjectId(q.correctOptionId)) {
        return res.status(400).json({ error: `question #${idx + 1} has invalid correctOptionId` });
      }

      for (const opt of q.options) {
        if (opt._id && !isValidObjectId(opt._id)) {
          return res.status(400).json({ error: 'option _id must be a valid ObjectId if provided' });
        }
      }
    }

    const quiz = new Quiz({
      title,
      description: description || '',
      courseId: new mongoose.Types.ObjectId(courseId),
      questions: questions.map((q) => ({
        text: q.text,
        options: q.options.map((opt) => ({
          _id: opt._id ? new mongoose.Types.ObjectId(opt._id) : new mongoose.Types.ObjectId(),
          text: opt.text,
        })),
        correctOptionId: new mongoose.Types.ObjectId(q.correctOptionId),
        explanation: q.explanation || '',
        points: q.points != null ? q.points : 1,
      })),
      timeLimitMinutes: timeLimitMinutes || null,
      // allow instructor to set published on create, otherwise default false
      published: published === true,
      createdBy: new mongoose.Types.ObjectId(req.user.id),
      slug: slug ? toSlug(slug) : `${toSlug(title)}-${Date.now().toString(36)}`,
    });

    await quiz.save();

    // For response: instructors can see full quiz; others see hidden answers
    const responseQuiz = req.user && req.user.role === 'instructor' ? quiz.toObject() : hideCorrectAnswers(quiz);
    return res.status(201).json({ success: true, quiz: responseQuiz });
  } catch (err) {
    console.error('Create quiz error', err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      return res.status(409).json({ error: 'slug_already_in_use' });
    }
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

/* -------------------- LIST -------------------- */
// GET /quizzes?courseId=...
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = {};

    if (courseId) {
      if (!isValidObjectId(courseId)) {
        return res.status(400).json({ error: 'invalid courseId' });
      }
      filter.courseId = new mongoose.Types.ObjectId(courseId);
    }

    // If instructor: return published OR quizzes created by them
    if (req.user && req.user.role === 'instructor') {
      filter.$or = [
        { published: true },
        { createdBy: new mongoose.Types.ObjectId(req.user.id) },
      ];
    } else {
      // students/guests: only published
      filter.published = true;
    }

    const quizDocs = await Quiz.find(filter).sort({ createdAt: -1 });

    // Hide correct answers for non-instructors
    const payload = (quizDocs || []).map((q) =>
      (req.user && req.user.role === 'instructor') ? q.toObject() : hideCorrectAnswers(q)
    );

    return res.json({ quizzes: payload });
  } catch (err) {
    console.error('Fetch quizzes error', err);
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

/* -------------------- GET SINGLE -------------------- */
// GET /quizzes/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid_quiz_id' });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'not_found' });

    // Hide correct answers for non-instructors
    const payload = (req.user && req.user.role === 'instructor') ? quiz.toObject() : hideCorrectAnswers(quiz);
    return res.json({ quiz: payload });
  } catch (err) {
    console.error('Fetch single quiz error', err);
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

/* -------------------- SUBMIT (score) -------------------- */
// POST /quizzes/:id/submit
// Requires authMiddleware if you want to record attempts per-user; can be open if anonymous attempts allowed
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid_quiz_id' });

    const { answers } = req.body; // expected: [{ questionId, selectedOptionId }, ...]
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers_must_be_array' });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'not_found' });

    let correctCount = 0;
    const total = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    const feedback = [];

    for (const a of answers) {
      const q = quiz.questions.find((qq) => String(qq._id) === String(a.questionId));
      if (!q) {
        feedback.push({ questionId: a.questionId, correct: false });
        continue;
      }
      const isCorrect = String(q.correctOptionId) === String(a.selectedOptionId);
      if (isCorrect) correctCount++;
      feedback.push({
        questionId: String(q._id),
        correct: isCorrect,
        correctOptionId: String(q.correctOptionId),
      });
    }

    // Optionally: save QuizAttempt model (not implemented here)
    const score = correctCount;

    return res.json({ success: true, score, total, feedback });
  } catch (err) {
    console.error('Submit quiz error', err);
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

/* -------------------- UPDATE -------------------- */
// PUT /quizzes/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'forbidden' });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid_quiz_id' });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'not_found' });

    // Ownership check: only creator can edit
    if (String(quiz.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ error: 'not_quiz_owner' });
    }

    const { title, description, questions, timeLimitMinutes, published, slug } = req.body;

    if (title != null) quiz.title = title;
    if (description != null) quiz.description = description;
    if (timeLimitMinutes !== undefined) quiz.timeLimitMinutes = timeLimitMinutes;
    if (published !== undefined) quiz.published = !!published;
    if (slug) quiz.slug = toSlug(slug);

    // If questions provided, validate and replace
    if (questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'questions_must_be_nonempty_array' });
      }
      for (const [idx, q] of questions.entries()) {
        if (!q.text || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ error: `question #${idx + 1} must have text and at least 2 options` });
        }
        if (!q.correctOptionId || !isValidObjectId(q.correctOptionId)) {
          return res.status(400).json({ error: `question #${idx + 1} has invalid correctOptionId` });
        }
      }

      quiz.questions = questions.map((q) => ({
        text: q.text,
        options: q.options.map((opt) => ({
          _id: opt._id ? new mongoose.Types.ObjectId(opt._id) : new mongoose.Types.ObjectId(),
          text: opt.text,
        })),
        correctOptionId: new mongoose.Types.ObjectId(q.correctOptionId),
        explanation: q.explanation || '',
        points: q.points != null ? q.points : 1,
      }));
    }

    await quiz.save();
    return res.json({ success: true, quiz: quiz.toObject() });
  } catch (err) {
    console.error('Update quiz error', err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
      return res.status(409).json({ error: 'slug_already_in_use' });
    }
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

/* -------------------- DELETE -------------------- */
// DELETE /quizzes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'forbidden' });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: 'invalid_quiz_id' });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'not_found' });

    // Ownership check
    if (String(quiz.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ error: 'not_quiz_owner' });
    }

    await Quiz.deleteOne({ _id: quiz._id });
    return res.json({ success: true, message: 'deleted' });
  } catch (err) {
    console.error('Delete quiz error', err);
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

/* -------------------- PUBLISH -------------------- */
// POST /quizzes/:id/publish
router.post('/:id/publish', authMiddleware, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'instructor')
      return res.status(403).json({ error: 'forbidden' });

    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: 'invalid_quiz_id' });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: 'not_found' });

    if (String(quiz.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: 'not_quiz_owner' });

    quiz.published = true;
    await quiz.save();

    // return instructor view (full quiz)
    return res.json({ success: true, message: 'Quiz published', quiz: quiz.toObject() });
  } catch (err) {
    console.error('Publish quiz error', err);
    return res.status(500).json({ error: 'server_error', details: err.message });
  }
});

module.exports = router;
