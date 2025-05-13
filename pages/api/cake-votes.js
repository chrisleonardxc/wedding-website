import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";

// Path to our data file
const dataFilePath = path.join(process.cwd(), "data", "cake-votes.json");

// Ensure the data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fsPromises.access(dataDir);
  } catch (error) {
    // Directory doesn't exist, create it
    await fsPromises.mkdir(dataDir, { recursive: true });
  }
};

// Initialize or get the votes data
const getVotesData = async () => {
  await ensureDataDir();

  try {
    await fsPromises.access(dataFilePath);
    const data = await fsPromises.readFile(dataFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or can't be read, create default data
    const defaultData = [
      { id: 1, flavor: "Vanilla", votes: 0, image: "/images/vanilla-cake.jpg" },
      {
        id: 2,
        flavor: "Chocolate",
        votes: 0,
        image: "/images/chocolate-cake.jpg",
      },
      {
        id: 3,
        flavor: "Red Velvet",
        votes: 0,
        image: "/images/red-velvet-cake.jpg",
      },
      { id: 4, flavor: "Lemon", votes: 0, image: "/images/lemon-cake.jpg" },
    ];
    await fsPromises.writeFile(
      dataFilePath,
      JSON.stringify(defaultData, null, 2)
    );
    return defaultData;
  }
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Handle GET request - return current votes
    try {
      const data = await getVotesData();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch votes data" });
    }
  } else if (req.method === "POST") {
    // Handle POST request - add a vote
    try {
      const { cakeId } = req.body;

      if (!cakeId) {
        return res.status(400).json({ error: "Cake ID is required" });
      }

      const data = await getVotesData();
      const cakeIndex = data.findIndex((cake) => cake.id === cakeId);

      if (cakeIndex === -1) {
        return res.status(404).json({ error: "Cake not found" });
      }

      // Increment the votes
      data[cakeIndex].votes += 1;

      // Save the updated data
      await fsPromises.writeFile(dataFilePath, JSON.stringify(data, null, 2));

      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("Error processing vote:", error);
      res.status(500).json({ error: "Failed to process vote" });
    }
  } else {
    // Handle unsupported methods
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
