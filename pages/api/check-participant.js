import { promises as fsPromises } from "fs";
import path from "path";

const participantsFilePath = path.join(process.cwd(), "data", "prediction-participants.json");

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

export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
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
    
    // Name is available
    return res.status(200).json({ 
      success: true, 
      message: "Name is available" 
    });
  } catch (error) {
    console.error("Error checking participant:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}