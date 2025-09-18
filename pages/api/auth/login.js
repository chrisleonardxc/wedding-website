
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body
  const correctPassword = process.env.SITE_PASSWORD || 'wedding2025'

  if (password === correctPassword) {
    // Set secure cookie
    res.setHeader('Set-Cookie', [
      `wedding-auth=${correctPassword}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}` // 30 days
    ])
    
    return res.status(200).json({ success: true })
  }

  return res.status(401).json({ error: 'Invalid password' })
}
