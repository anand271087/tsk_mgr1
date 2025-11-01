import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup with:', { name, email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-2xl p-12 w-full max-w-md space-y-8">
        <h1 className="text-5xl font-bold text-blue-600 text-center">
          Create Account
        </h1>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-lg font-semibold text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 text-lg transition-colors"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-lg font-semibold text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 text-lg transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-lg font-semibold text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-700 text-lg transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full px-12 py-4 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-700 hover:scale-105 transition-all duration-300 mt-8"
          >
            Signup
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-semibold text-lg hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
