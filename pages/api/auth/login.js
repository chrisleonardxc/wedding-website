
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body
  const correctPassword = process.env.SITE_PASSWORD

  if (!correctPassword) {
    console.error('SITE_PASSWORD environment variable is not set')
    return res.status(500).json({ error: 'Site not configured' })
  }

  if (password === correctPassword) {
    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `wedding-auth=${correctPassword}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}` // 30 days
    ])
    
    return res.status(200).json({ success: true })
  }

  return res.status(401).json({ error: 'Invalid password' })
}
