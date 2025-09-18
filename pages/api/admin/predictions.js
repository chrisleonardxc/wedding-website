
import path from "path";
import { promises as fsPromises } from "fs";

const participantsFilePath = path.join(process.cwd(), "data", "prediction-participants.json");

export default async function handler(req, res) {
  // Use environment variable for password
  const { password, format = 'json' } = req.query;
  const adminPassword = process.env.ADMIN_PASSWORD || "fallback-password";
  
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const fileData = await fsPromises.readFile(participantsFilePath, "utf8");
    const participants = JSON.parse(fileData);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(participants);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="wedding-predictions.csv"');
      return res.status(200).send(csvData);
    } else if (format === 'download') {
      // Download as JSON file
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="wedding-predictions.json"');
      return res.status(200).json(participants);
    } else {
      // Default: return JSON in browser
      return res.status(200).json({
        totalParticipants: participants.length,
        participants: participants
      });
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="wedding-predictions.csv"');
        return res.status(200).send('No data available');
      } else if (format === 'download') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="wedding-predictions.json"');
        return res.status(200).json([]);
      } else {
        return res.status(200).json({
          totalParticipants: 0,
          participants: []
        });
      }
    }
    
    console.error("Error reading participants:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function convertToCSV(participants) {
  if (participants.length === 0) {
    return 'No data available';
  }

  // Get all unique question IDs from all participants
  const allQuestionIds = new Set();
  participants.forEach(participant => {
    Object.keys(participant.answers || {}).forEach(questionId => {
      allQuestionIds.add(questionId);
    });
  });

  const sortedQuestionIds = Array.from(allQuestionIds).sort((a, b) => parseInt(a) - parseInt(b));

  // Create CSV headers
  const headers = ['Name', 'Submitted At', ...sortedQuestionIds.map(id => `Question ${id}`)];
  
  // Create CSV rows
  const rows = participants.map(participant => {
    const row = [
      `"${participant.name || ''}"`,
      `"${participant.submittedAt || ''}"`,
      ...sortedQuestionIds.map(questionId => {
        const answer = participant.answers?.[questionId] || '';
        return `"${answer}"`;
      })
    ];
    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
