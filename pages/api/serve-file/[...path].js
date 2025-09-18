
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const { path: filePath } = req.query;
    
    if (!filePath || !Array.isArray(filePath)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'public', 'uploads', ...filePath);
    
    // Security check - ensure the path is within uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(fullPath);
    
    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.mp4':
        contentType = 'video/mp4';
        break;
      case '.mov':
        contentType = 'video/quicktime';
        break;
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
