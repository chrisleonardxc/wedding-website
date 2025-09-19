
import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PredictionsResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [viewMode, setViewMode] = useState('graphs'); // 'graphs' or 'individual'

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/predictions-results');
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data);
      setError('');
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load prediction results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (question) => {
    if (question.type === 'multiple-choice') {
      const total = Object.values(question.aggregatedData).reduce((a, b) => a + b, 0);
      
      return (
        <div className="space-y-2">
          {Object.entries(question.aggregatedData).map(([option, count]) => {
            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
            return (
              <div key={option} className="flex items-center">
                <div className="w-32 text-sm text-gray-600 truncate">{option}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-primary h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (question.type === 'multiple-select') {
      // Handle multiple-select questions
      const total = Object.values(question.aggregatedData).reduce((a, b) => a + b, 0);
      
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 mb-3">Multiple selections allowed - percentages show how often each option was chosen</p>
          {Object.entries(question.aggregatedData).map(([option, count]) => {
            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
            return (
              <div key={option} className="flex items-center">
                <div className="w-32 text-sm text-gray-600 truncate">{option}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-secondary h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (question.type === 'number') {
      const { average, min, max, count, answers } = question.aggregatedData;
      
      if (count === 0) {
        return (
          <div className="text-center py-4 text-gray-500">
            No responses yet
          </div>
        );
      }
      
      // Fixed histogram logic
      const range = max - min;
      
      // If all answers are the same (range = 0), show a single bar
      if (range === 0) {
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-lg font-semibold text-primary">{average.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Average</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-lg font-semibold text-primary">{min}</div>
                <div className="text-sm text-gray-600">All responses</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-lg font-semibold text-primary">{count}</div>
                <div className="text-sm text-gray-600">Responses</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center">
                <div className="w-20 text-xs text-gray-600">{min}</div>
                <div className="flex-1 mx-2">
                  <div className="bg-gray-200 rounded h-3">
                    <div className="bg-primary h-3 rounded w-full"></div>
                  </div>
                </div>
                <div className="w-8 text-xs text-gray-600">{count}</div>
              </div>
            </div>
          </div>
        );
      }
      
      // Create histogram bins for different values
      const binCount = Math.min(10, Math.max(3, Math.ceil(Math.sqrt(answers.length))));
      const binSize = range / binCount;
      const bins = Array(binCount).fill(0);
      
      answers.forEach(answer => {
        const binIndex = Math.min(Math.floor((answer - min) / binSize), binCount - 1);
        bins[binIndex]++;
      });
      
      const maxBinCount = Math.max(...bins);
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-semibold text-primary">{average.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-semibold text-primary">{min} - {max}</div>
              <div className="text-sm text-gray-600">Range</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-lg font-semibold text-primary">{count}</div>
              <div className="text-sm text-gray-600">Responses</div>
            </div>
          </div>
          
          <div className="space-y-1">
            {bins.map((binCount, index) => {
              const binStart = Math.round((min + index * binSize) * 10) / 10;
              const binEnd = Math.round((min + (index + 1) * binSize) * 10) / 10;
              const percentage = maxBinCount > 0 ? (binCount / maxBinCount * 100) : 0;
              
              return (
                <div key={index} className="flex items-center">
                  <div className="w-20 text-xs text-gray-600">
                    {index === binCount - 1 ? `${binStart}-${max}` : `${binStart}-${binEnd}`}
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="bg-gray-200 rounded h-3">
                      <div 
                        className="bg-primary h-3 rounded transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-xs text-gray-600">{binCount}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      // Text answers
      const sortedAnswers = Object.entries(question.aggregatedData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Show top 10 answers
      
      const total = Object.values(question.aggregatedData).reduce((a, b) => a + b, 0);
      
      if (total === 0) {
        return (
          <div className="text-center py-4 text-gray-500">
            No responses yet
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          {sortedAnswers.map(([answer, count]) => {
            const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
            return (
              <div key={answer} className="flex items-center">
                <div className="w-40 text-sm text-gray-600 truncate capitalize">{answer}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-4 relative">
                    <div 
                      className="bg-primary h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {sortedAnswers.length === 10 && Object.keys(question.aggregatedData).length > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing top 10 responses out of {Object.keys(question.aggregatedData).length} unique answers
            </p>
          )}
        </div>
      );
    }
  };

  const renderIndividualAnswers = (participant) => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-elegant">
        <h3 className="text-xl font-serif mb-4">{participant.name}'s Predictions</h3>
        <p className="text-sm text-gray-500 mb-6">
          Submitted: {new Date(participant.submittedAt).toLocaleDateString()}
        </p>
        
        <div className="space-y-6">
          {results.questions.map((question, index) => {
            const answer = participant.answers[question.id];
            let displayAnswer = 'No answer';
            
            if (answer !== undefined && answer !== null && answer !== '') {
              if (question.type === 'multiple-select' && Array.isArray(answer)) {
                displayAnswer = answer.length > 0 ? answer.join(', ') : 'No selections';
              } else {
                displayAnswer = answer.toString();
              }
            }
            
            return (
              <div key={question.id} className="border-b border-gray-200 pb-4 last:border-0">
                <h4 className="font-medium text-gray-800 mb-2">
                  {index + 1}. {question.question}
                </h4>
                <p className="text-lg text-primary font-medium">
                  {displayAnswer}
                </p>
                {question.type === 'multiple-select' && (
                  <span className="text-xs text-gray-500 mt-1 block">
                    Multiple selections allowed
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout title="Prediction Results - Sydney & Chris's Wedding">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading prediction results...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Prediction Results - Sydney & Chris's Wedding">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/wedding-predictions"
              className="text-primary hover:text-primary-dark"
            >
              ← Back to Predictions
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!results || results.totalParticipants === 0) {
    return (
      <Layout title="Prediction Results - Sydney & Chris's Wedding">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <h1 className="text-3xl font-serif font-bold mb-4">Wedding Prediction Results</h1>
            <p className="text-gray-600 mb-4">
              No predictions have been submitted yet!
            </p>
            <Link
              href="/wedding-predictions"
              className="inline-block py-2 px-6 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-300"
            >
              Be the First to Predict →
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Prediction Results - Sydney & Chris's Wedding">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Wedding Prediction Results</h1>
          <p className="text-gray-600 mb-4">
            {results.totalParticipants} {results.totalParticipants === 1 ? 'person has' : 'people have'} made their predictions!
          </p>
          <Link
            href="/wedding-predictions"
            className="text-primary hover:text-primary-dark"
          >
            ← Back to Predictions
          </Link>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('graphs')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'graphs'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              View Graphs
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`px-4 py-2 rounded-md transition-all ${
                viewMode === 'individual'
                  ? 'bg-white shadow text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Individual Picks
            </button>
          </div>
        </div>

        {viewMode === 'graphs' ? (
          <div className="space-y-8">
            {results.questions.map((question, index) => (
              <div key={question.id} className="bg-white p-6 rounded-lg shadow-elegant">
                <h2 className="text-xl font-serif mb-2">
                  {index + 1}. {question.question}
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <p className="text-sm text-gray-500">
                    {question.totalResponses} {question.totalResponses === 1 ? 'response' : 'responses'}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    question.type === 'multiple-choice' ? 'bg-blue-100 text-blue-800' :
                    question.type === 'multiple-select' ? 'bg-purple-100 text-purple-800' :
                    question.type === 'number' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {question.type === 'multiple-choice' ? 'Single Choice' :
                     question.type === 'multiple-select' ? 'Multiple Choice' :
                     question.type === 'number' ? 'Number' : 'Text'}
                  </span>
                </div>
                {renderChart(question)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {selectedParticipant ? (
              <div>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="mb-4 text-primary hover:text-primary-dark"
                >
                  ← Back to all participants
                </button>
                {renderIndividualAnswers(selectedParticipant)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.participants.map((participant, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedParticipant(participant)}
                    className="bg-white p-4 rounded-lg shadow-elegant cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h3 className="font-serif text-lg mb-2">{participant.name}</h3>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(participant.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-primary text-sm mt-2">Click to view predictions →</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
