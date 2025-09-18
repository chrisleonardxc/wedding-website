import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

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
    
    if (hasSubmitted && !showQuestions) {
      setMessage('You have already submitted your predictions!');
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = predictions.filter(q => {
      const answer = answers[q.id];
      if (q.type === 'multiple-select') {
        return !answer || answer.length === 0;
      }
      return !answer;
    });
    
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
      
      // Reset form state but keep predictions loaded
      setShowQuestions(false);
      setName('');
      setAnswers({});
    } catch (error) {
      console.error('Error submitting predictions:', error);
      setMessage('Error submitting predictions: ' + error.message);
    }
  };
  
  const handleSubmitAnotherEntry = () => {
    // Reset submission state but keep predictions loaded
    setHasSubmitted(false);
    setMessage('');
    setError('');
    setName('');
    setAnswers({});
    setShowQuestions(false);
  };

  const renderQuestionInput = (question) => {
    // Add debugging
    console.log('Question type:', question.type, 'Question ID:', question.id);
    
    // Check if this is a time-related question
    const isTimeQuestion = (question.placeholder && question.placeholder.includes('HH:MM')) ||
                          question.question.toLowerCase().includes('what time') ||
                          question.question.toLowerCase().includes('time will') ||
                          (question.type === 'text' && question.placeholder && question.placeholder.includes('PM/AM'));

    switch (question.type) {
      case 'multiple-choice':
        console.log('Rendering multiple-choice for question', question.id);
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
      case 'multiple-select':
        console.log('Rendering multiple-select for question', question.id);
        return (
          <div className="mt-2">
            {question.options.map((option, index) => {
              const currentAnswers = answers[question.id] || [];
              const isChecked = currentAnswers.includes(option);
              
              return (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`question-${question.id}-option-${index}`}
                    value={option}
                    checked={isChecked}
                    onChange={(e) => {
                      const currentAnswers = answers[question.id] || [];
                      let newAnswers;
                      
                      if (e.target.checked) {
                        newAnswers = [...currentAnswers, option];
                      } else {
                        newAnswers = currentAnswers.filter(answer => answer !== option);
                      }
                      
                      handleAnswerChange(question.id, newAnswers);
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`question-${question.id}-option-${index}`}>{option}</label>
                </div>
              );
            })}
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
        if (isTimeQuestion) {
          // Convert stored time format to HTML time input format and vice versa
          const convertToTimeInput = (timeStr) => {
            if (!timeStr) return '';
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (match) {
              let hour = parseInt(match[1]);
              const minute = match[2];
              const ampm = match[3].toUpperCase();
              
              // Convert to 24-hour format for HTML time input
              if (ampm === 'PM' && hour !== 12) hour += 12;
              if (ampm === 'AM' && hour === 12) hour = 0;
              
              return `${hour.toString().padStart(2, '0')}:${minute}`;
            }
            return '';
          };

          const convertFromTimeInput = (timeStr) => {
            if (!timeStr) return '';
            const [hour24, minute] = timeStr.split(':');
            let hour = parseInt(hour24);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            
            // Convert to 12-hour format
            if (hour === 0) hour = 12;
            else if (hour > 12) hour -= 12;
            
            return `${hour}:${minute} ${ampm}`;
          };

          return (
            <div className="mt-2">
              <input
                type="time"
                value={convertToTimeInput(answers[question.id])}
                onChange={(e) => {
                  const formattedTime = convertFromTimeInput(e.target.value);
                  handleAnswerChange(question.id, formattedTime);
                }}
                className="p-2 border rounded-md"
              />
            </div>
          );
        }
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="mt-2 w-full p-2 border rounded-md"
            placeholder={question.placeholder || "Enter your prediction"}
          />
        );
      default:
        console.log('Falling to default case for question', question.id, 'with type', question.type);
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
              To participate in our wedding predictions game, please Venmo $5 to our best man Caleb @CJHendrix4 with the note "Wedding Predictions".
            </p>
            <div className="flex justify-center mb-6">
              <img 
                src="/images/venmo-qr.jpg" 
                alt="Venmo QR Code" 
                className="w-56 h-56 md:w-72 md:h-72 object-contain"
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
                <p className="mb-6">Winners will be announced after the wedding!</p>
                
                {/* Add this new section */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-xl font-serif mb-3">View All Predictions</h3>
                  <p className="mb-4 text-gray-600">
                    See what everyone else is predicting!
                  </p>
                  <Link
                    href="/predictions-results"
                    className="inline-block py-2 px-6 bg-secondary text-white rounded-md hover:bg-secondary-dark transition duration-300 mr-4"
                  >
                    View Predictions
                  </Link>
                </div>
                
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-xl font-serif mb-3">Want to submit another entry?</h3>
                  <p className="mb-4 text-gray-600">
                    Help a friend or family member participate! Remember to send another $5 Venmo payment with their name.
                  </p>
                  <button
                    onClick={handleSubmitAnotherEntry}
                    className="py-2 px-6 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-300"
                  >
                    Submit Another Entry
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}