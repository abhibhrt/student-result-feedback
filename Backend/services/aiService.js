const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

// Helper function using lightweight Flash-Lite model
const callGemini = async (prompt) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt,
        });

        return response.text ?? 'No response generated.';
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Gemini API Error:', errorMessage);

        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('AI limit reached for now. Please wait a minute and retry.');
        }

        throw new Error('Failed to process the AI request. Please try again.');
    }
};

exports.generateStudentMentorship = async (resultId, studentId, studentName, marksList) => {
    try {
        const prompt = `You are an academic mentor analyzing semester exam results for "${studentName}".
Marks summary:
${JSON.stringify(marksList, null, 2)}

Rules:
1. Strong subjects (marks >= 60): Provide a short, motivating compliment.
2. Weak subjects (marks < 60):
   - Highlight areas of improvement.
   - Recommend 1-2 standard books (Title + Author).
   - Suggest 2-3 specific YouTube search keywords/phrases to help them study.
Keep it direct, professional, and actionable. Avoid bold or complex markdown syntax.`;

        const feedbackText = await callGemini(prompt);

        await pool.query(
            `INSERT INTO ai_feedback (result_id, student_id, feedback_message)
             VALUES ($1, $2, $3)`,
            [resultId, studentId, feedbackText]
        );

        return feedbackText;
    } catch (err) {
        console.error(`AI feedback failed for student ${studentId}:`, err.message);
        return err.message.includes('AI limit reached') 
            ? 'AI limit reached. Please refresh after a minute.' 
            : 'AI feedback generation temporarily delayed. Check back shortly.';
    }
};

exports.answerStudentDoubt = async (studentId, question, resultId) => {
    try {
        let contextStr = '';

        if (resultId) {
            const contextData = await pool.query(
                `SELECT sub.name AS subject, m.mark 
                 FROM marks m
                 JOIN subjects sub ON m.subject_id = sub.id
                 WHERE m.result_id = $1 AND m.student_id = $2`,
                [resultId, studentId]
            );
            contextStr = `Academic Context: ${JSON.stringify(contextData.rows)}`;
        }

        const prompt = `You are an AI Academic Tutor.
${contextStr}

Student Question:
"${question}"

Give a concise, clear, and pedagogically sound explanation without complex formatting.`;

        const reply = await callGemini(prompt);

        await pool.query(
            `INSERT INTO ai_feedback (result_id, student_id, student_query, response)
             VALUES ($1, $2, $3, $4)`,
            [resultId || null, studentId, question, reply]
        );

        return reply;
    } catch (err) {
        console.error(`AI doubt answering failed for student ${studentId}:`, err.message);
        throw err;
    }
};