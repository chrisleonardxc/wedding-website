# Wedding Website

A Next.js-based wedding website with photo sharing capabilities and cake voting features.

## Features

- **Photo Gallery**: Browse photos from the wedding
- **Photo Upload**: Guests can share their own photos
- **HEIC/HEIF Support**: Automatic conversion of iPhone photos
- **Cake Voting**: Vote for your favorite cake flavor
- **Mobile-Friendly Design**: Responsive layout for all devices

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes, Express
- **Database**: SQLite
- **File Handling**: Multer for uploads
- **Image Processing**: Server-side HEIC/HEIF conversion

## Setup

1. Clone the repository:

   ```
   git clone https://github.com/chrisleonardxc/wedding-website.git
   cd wedding-website
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create required directories:

   ```
   mkdir -p public/uploads data
   ```

4. Run the development server:

   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

- `DB_PATH` (optional): Custom path to SQLite database (defaults to `./data/wedding.db`)

## Deployment

This application can be deployed to platforms like Vercel or Netlify, or containerized using the included Dockerfile:

```
docker build -t wedding-website .
docker run -p 3000:3000 wedding-website
```

## Project Structure

- `/pages`: Next.js pages and API routes
- `/components`: Reusable React components
- `/public`: Static assets and uploaded photos
- `/data`: SQLite database

## License

This project is licensed under the MIT License - see the LICENSE file for details.
