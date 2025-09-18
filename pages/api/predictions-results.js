
import path from "path";
import fs from "fs";

const dataFilePath = path.join(process.cwd(), "data", "wedding-predictions.json");
const participantsFilePath = path.join(process.cwd(), "data", "prediction-participants.json");

// Helper function to read prediction questions
async function getPredictionQuestions() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error reading prediction questions:", error);
    return [];
  }
}

// Helper function to read participants and their answers
async function getParticipants() {
  try {
    if (fs.existsSync(participantsFilePath)) {
      const data = fs.readFileSync(participantsFilePath, "utf8");
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error reading participants:", error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const questions = await getPredictionQuestions();
    const participants = await getParticipants();

    // Aggregate results for each question
    const results = questions.map(question => {
      const answers = participants
        .map(p => p.answers[question.id])
        .filter(answer => answer !== undefined && answer !== null && answer !== "");

      let aggregatedData = {};

      if (question.type === 'multiple-choice') {
        // Count occurrences of each option
        aggregatedData = question.options.reduce((acc, option) => {
          acc[option] = answers.filter(answer => answer === option).length;
          return acc;
        }, {});
      } else if (question.type === 'number') {
        // For numbers, we'll show distribution and average
        const numericAnswers = answers.map(a => parseFloat(a)).filter(a => !isNaN(a));
        aggregatedData = {
          answers: numericAnswers,
          average: numericAnswers.length > 0 ? numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length : 0,
          min: numericAnswers.length > 0 ? Math.min(...numericAnswers) : 0,
          max: numericAnswers.length > 0 ? Math.max(...numericAnswers) : 0,
          count: numericAnswers.length
        };
      } else {
        // For text answers, group by exact matches
        const answerCounts = {};
        answers.forEach(answer => {
          const normalizedAnswer = answer.toLowerCase().trim();
          answerCounts[normalizedAnswer] = (answerCounts[normalizedAnswer] || 0) + 1;
        });
        aggregatedData = answerCounts;
      }

      return {
        ...question,
        totalResponses: answers.length,
        aggregatedData
      };
    });

    res.status(200).json({
      questions: results,
      participants: participants.map(p => ({
        name: p.name,
        submittedAt: p.submittedAt,
        answers: p.answers
      })),
      totalParticipants: participants.length
    });

  } catch (error) {
    console.error("Error fetching prediction results:", error);
    res.status(500).json({ error: "Failed to fetch prediction results" });
  }
}
