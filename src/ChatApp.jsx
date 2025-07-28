import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

const ChatApp = () => {
  const [companyName, setCompanyName] = useState('bajaj');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const companies = ['bajaj', 'tcs', 'axis', 'godrej', 'reliance'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      company: companyName,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    const makeRequest = async (retry = false) => {
      try {
        const res = await axios.post('https://scalo-technologies-assingment-backe.vercel.app/ask', {
          companyName,
          question: userMessage.content,
        });

        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: res.data.answer,
          company: companyName,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.error?.message || '';
        const timeMatch = errorMessage.match(/try again in ([\d.]+)s/i);
        const retryAfter = timeMatch ? parseFloat(timeMatch[1]) : null;

        if (retryAfter && !retry) {
          const retryMessage = {
            id: Date.now() + 1,
            type: 'bot',
            content: `Rate limit hit. Retrying in ${retryAfter.toFixed(2)}s...`,
            company: companyName,
            timestamp: new Date(),
            isError: true
          };
          setMessages(prev => [...prev, retryMessage]);
          
          setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== retryMessage.id));
            makeRequest(true);
          }, retryAfter * 1000);
        } else {
          const errorMsg = {
            id: Date.now() + 1,
            type: 'bot',
            content: retryAfter
              ? `Rate limit reached. Please try again after ${retryAfter.toFixed(2)} seconds.`
              : 'Error getting response from server.',
            company: companyName,
            timestamp: new Date(),
            isError: true
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } finally {
        if (!retry) setLoading(false);
      }
    };

    makeRequest();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="text-xl font-medium text-gray-900">Financial Results Analyzer</h1>
          <select
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {companies.map((name) => (
              <option key={name} value={name}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-lg mb-2">Start a conversation</div>
              <div className="text-sm">Ask any question about {companyName.charAt(0).toUpperCase() + companyName.slice(1)}</div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gray-900 text-white'
                      : message.isError
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  {message.type === 'user' && (
                    <div className="text-xs text-gray-300 mt-1">
                      To: {message.company.charAt(0).toUpperCase() + message.company.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="mb-6 flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your question..."
                className="w-full resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className={`p-3 rounded-xl transition-colors ${
                loading || !question.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;