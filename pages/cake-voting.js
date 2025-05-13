import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function CakeVoting() {
  const [cakes, setCakes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has already voted
    const voted = localStorage.getItem('cakeVoted');
    if (voted) {
      setHasVoted(true);
    }
    
    // Fetch current votes
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cake-votes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch votes');
      }
      
      const data = await response.json();
      setCakes(data);
      setError('');
    } catch (error) {
      console.error('Error fetching votes:', error);
      setError('Failed to load cake options. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (cakeId) => {
    if (hasVoted) {
      setMessage('You have already voted!');
      return;
    }

    try {
      setMessage('Submitting your vote...');
      const response = await fetch('/api/cake-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cakeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      const result = await response.json();
      
      setHasVoted(true);
      localStorage.setItem('cakeVoted', 'true');
      setMessage('Thank you for voting!');
      setCakes(result.data);
    } catch (error) {
      console.error('Error submitting vote:', error);
      setMessage('Error submitting vote: ' + error.message);
    }
  };

  return (
    <Layout title="Cake Flavor Voting - Sydney & Chris's Wedding">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-serif font-bold text-center mb-2">Vote for Your Favorite Cake Flavor</h1>
        <p className="text-center text-gray-600 mb-8">Help us choose the perfect cake for our special day!</p>
        
        {message && (
          <div className="mb-6 p-3 bg-primary-light text-primary-dark rounded-md text-center">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-800 rounded-md text-center">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading cake options...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cakes.map((cake) => (
              <div key={cake.id} className="border rounded-lg overflow-hidden shadow-elegant transition-all duration-300 hover:shadow-lg">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={cake.image} 
                    alt={cake.flavor} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-serif font-semibold text-center">{cake.flavor}</h3>
                  <p className="text-gray-600 mt-2 text-center">Votes: {cake.votes}</p>
                  <button
                    onClick={() => handleVote(cake.id)}
                    disabled={hasVoted}
                    className={`mt-4 w-full py-2 px-4 rounded-md transition duration-300 ${
                      hasVoted
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary-dark'
                    }`}
                  >
                    {hasVoted ? 'Voted' : 'Vote'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}