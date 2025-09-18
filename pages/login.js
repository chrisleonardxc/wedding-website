
import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        router.push('/')
      } else {
        setError('Incorrect password')
      }
    } catch (error) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light">
      <Head>
        <title>Wedding Access - Sydney & Chris</title>
      </Head>
      
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-elegant">
        <div className="text-center mb-8">
          <h1 className="font-script text-4xl text-primary mb-2">Sydney & Chris</h1>
          <p className="text-gray-600">Enter the password to access our wedding website</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-md hover:bg-primary-dark transition duration-300"
          >
            Enter
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need the password? Contact Sydney or Chris</p>
        </div>
      </div>
    </div>
  )
}
