import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function WeddingPredictions() {
  const [predictions, setPredictions] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    // Check if user has already submitted predictions
    const submitted = localStorage.getItem('predictionsSubmitted');
    if (submitted) {
      setHasSubmitted(true);
    }
    
    // Fetch current predictions
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wedding-predictions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }
      
      const data = await response.json();
      setPredictions(data);
      setError('');
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setError('Failed to load prediction questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      const response = await fetch('/api/check-participant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to check name');
      }

      setShowQuestions(true);
      setError('');
    } catch (error) {
      console.error('Error checking name:', error);
      setError(error.message || 'Error checking name. Please try again.');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (hasSubmitted) {
      setMessage('You have already submitted your predictions!');
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = predictions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions before submitting (${unansweredQuestions.length} remaining)`);
      return;
    }

    try {
      setMessage('Submitting your predictions...');
      const response = await fetch('/api/wedding-predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name,
          answers
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit predictions');
      }

      const result = await response.json();
      
      setHasSubmitted(true);
      localStorage.setItem('predictionsSubmitted', 'true');
      setMessage('Thank you for submitting your predictions!');
    } catch (error) {
      console.error('Error submitting predictions:', error);
      setMessage('Error submitting predictions: ' + error.message);
    }
  };

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="mt-2">
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="radio"
                  id={`question-${question.id}-option-${index}`}
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => handleAnswerChange(question.id, option)}
                  className="mr-2"
                />
                <label htmlFor={`question-${question.id}-option-${index}`}>{option}</label>
              </div>
            ))}
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="mt-2 w-full p-2 border rounded-md"
            placeholder={question.placeholder || "Enter your prediction"}
          />
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="mt-2 w-full p-2 border rounded-md"
            placeholder={question.placeholder || "Enter your prediction"}
          />
        );
    }
  };

  return (
    <Layout title="Wedding Predictions - Sydney & Chris's Wedding">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-serif font-bold text-center mb-2">Wedding Predictions</h1>
        <p className="text-center text-gray-600 mb-8">
          Test your intuition and predict what will happen at our wedding!
        </p>
        
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

        {!hasSubmitted && !showQuestions && (
          <div className="bg-white p-6 rounded-lg shadow-elegant mb-8">
            <h2 className="text-2xl font-serif text-center mb-4">Entry Fee</h2>
            <p className="text-center mb-6">
              To participate in our wedding predictions game, please Venmo $5 to our best man @BestMan-Venmo with the note "Wedding Predictions".
            </p>
            <div className="flex justify-center mb-6">
              <img 
                src="/images/venmo-qr.jpg" 
                alt="Venmo QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
            <form onSubmit={handleNameSubmit} className="max-w-md mx-auto">
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter your full name"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please use the same name you used for your Venmo payment
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-300"
              >
                Continue to Predictions
              </button>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading prediction questions...</p>
          </div>
        ) : (
          <>
            {showQuestions && !hasSubmitted && (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-elegant">
                <h2 className="text-2xl font-serif text-center mb-6">Make Your Predictions</h2>
                
                <div className="space-y-8">
                  {predictions.map((question, index) => (
                    <div key={question.id} className="pb-6 border-b border-gray-200 last:border-0">
                      <h3 className="text-lg font-medium">
                        {index + 1}. {question.question}
                      </h3>
                      {renderQuestionInput(question)}
                    </div>
                  ))}
                </div>
                
                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-300 text-lg"
                  >
                    Submit Predictions
                  </button>
                </div>
              </form>
            )}
            
            {hasSubmitted && (
              <div className="bg-white p-6 rounded-lg shadow-elegant text-center">
                <h2 className="text-2xl font-serif mb-4">Thank You!</h2>
                <p className="mb-4">Your predictions have been submitted successfully.</p>
                <p>Winners will be announced after the wedding!</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}