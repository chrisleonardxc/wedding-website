
export default function handler(req, res) {
  const { token } = req.query
  const correctPassword = process.env.SITE_PASSWORD || 'REDACTED'

  if (token === correctPassword) {
    // Set the auth cookie
    res.setHeader('Set-Cookie', [
      `wedding-auth=${correctPassword}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}` // 30 days
    ])
    
    // Redirect to home page
    return res.redirect(302, '/')
  }

  // If invalid token, redirect to login page
  return res.redirect(302, '/login?error=invalid')
}
