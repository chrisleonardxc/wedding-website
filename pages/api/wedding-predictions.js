import { promises as fsPromises } from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "wedding-predictions.json");
const participantsFilePath = path.join(process.cwd(), "data", "prediction-participants.json");

// Helper function to read prediction questions
async function getPredictionQuestions() {
  try {
    const fileData = await fsPromises.readFile(dataFilePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    // If file doesn't exist, return default questions
    if (error.code === "ENOENT") {
      const defaultQuestions = [
        {
          id: 1,
          question: "Who will cry first during the ceremony?",
          type: "multiple-choice",
          options: ["Sydney", "Chris", "Both at the same time", "Neither"]
        },
        {
          id: 2,
          question: "What will be the flavor of our wedding cake?",
          type: "multiple-choice",
          options: ["Vanilla", "Chocolate", "Red Velvet", "Lemon", "Marble"]
        },
        {
          id: 3,
          question: "How many times will the word 'love' be said in our vows combined?",
          type: "number",
          placeholder: "Enter a number"
        },
        {
          id: 4,
          question: "What time will the first dance start?",
          type: "text",
          placeholder: "Format: HH:MM PM/AM"
        },
        {
          id: 5,
          question: "What color tie will the best man be wearing?",
          type: "text"
        },
        {
          id: 6,
          question: "How many guests will attend the wedding?",
          type: "number"
        },
        {
          id: 7,
          question: "What song will play for our first dance?",
          type: "text"
        },
        {
          id: 8,
          question: "Will it rain on our wedding day?",
          type: "multiple-choice",
          options: ["Yes", "No"]
        },
        {
          id: 9,
          question: "What time will the ceremony actually start?",
          type: "text",
          placeholder: "Format: HH:MM PM/AM"
        },
        {
          id: 10,
          question: "Who will catch the bouquet?",
          type: "text"
        },
        {
          id: 11,
          question: "How many photos will be taken by the photographer?",
          type: "number"
        },
        {
          id: 12,
          question: "What will be the most popular drink at the bar?",
          type: "text"
        },
        {
          id: 13,
          question: "How long will our first kiss as a married couple last?",
          type: "number",
          placeholder: "Seconds"
        },
        {
          id: 14,
          question: "What time will the last guest leave?",
          type: "text",
          placeholder: "Format: HH:MM PM/AM"
        },
        {
          id: 15,
          question: "Will someone make an unexpected toast?",
          type: "multiple-choice",
          options: ["Yes", "No"]
        },
        {
          id: 16,
          question: "What will be the most memorable moment of the wedding?",
          type: "text"
        },
        {
          id: 17,
          question: "How many tiers will our wedding cake have?",
          type: "number"
        },
        {
          id: 18,
          question: "What color will the majority of the bridesmaids be wearing?",
          type: "text"
        },
        {
          id: 19,
          question: "Will there be any wedding crashers?",
          type: "multiple-choice",
          options: ["Yes", "No"]
        },
        {
          id: 20,
          question: "What time will the bride and groom leave the reception?",
          type: "text",
          placeholder: "Format: HH:MM PM/AM"
        }
      ];
      
      // Create the data directory if it doesn't exist
      try {
        await fsPromises.mkdir(path.join(process.cwd(), "data"), { recursive: true });
      } catch (mkdirError) {
        console.error("Error creating data directory:", mkdirError);
      }
      
      // Write default questions to file
      try {
        await fsPromises.writeFile(dataFilePath, JSON.stringify(defaultQuestions, null, 2));
      } catch (writeError) {
        console.error("Error writing default questions:", writeError);
      }
      
      return defaultQuestions;
    }
    
    console.error("Error reading prediction questions:", error);
    throw error;
  }
}

// Helper function to read participants
async function getParticipants() {
  try {
    const fileData = await fsPromises.readFile(participantsFilePath, "utf8");
    return JSON.parse(fileData);
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error.code === "ENOENT") {
      return [];
    }
    
    console.error("Error reading participants:", error);
    throw error;
  }
}

// Helper function to save participants
async function saveParticipants(participants) {
  try {
    // Create the data directory if it doesn't exist
    await fsPromises.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    
    // Write participants to file
    await fsPromises.writeFile(
      participantsFilePath, 
      JSON.stringify(participants, null, 2)
    );
  } catch (error) {
    console.error("Error saving participants:", error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    // GET request - return prediction questions
    if (req.method === "GET") {
      const questions = await getPredictionQuestions();
      return res.status(200).json(questions);
    }
    
    // POST request - save participant predictions
    if (req.method === "POST") {
      const { name, answers } = req.body;
      
      if (!name || !answers) {
        return res.status(400).json({ error: "Name and answers are required" });
      }
      
      // Get existing participants
      const participants = await getParticipants();
      
      // Check if participant already exists
      const existingParticipant = participants.find(
        p => p.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingParticipant) {
        return res.status(400).json({ 
          error: "You have already submitted predictions" 
        });
      }
      
      // Add new participant
      const newParticipant = {
        id: Date.now().toString(),
        name,
        answers,
        submittedAt: new Date().toISOString()
      };
      
      participants.push(newParticipant);
      
      // Save updated participants
      await saveParticipants(participants);
      
      return res.status(200).json({ 
        success: true, 
        message: "Predictions submitted successfully" 
      });
    }
    
    // Method not allowed
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error handling prediction request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}