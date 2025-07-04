import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Import useAuth hook

const API_URL = 'https://slicecraft-1.onrender.com/api/auth/login'; // Update if your backend runs elsewhere

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Destructure login from useAuth

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      setSuccess('Login successful!');
      login(data.token, data.user); // Call login with the JWT token and user data
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/'); // Redirect to home page on success
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'https://slicecraft-1.onrender.com/api/auth/google'; // Adjust if needed
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Image */}
      <div
        className="hidden md:flex w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: 'url("/pizza-sauce-background.jpg")' }}
      >
        <div className="absolute bottom-8 left-0 right-0 text-white text-center">
          <blockquote className="italic text-lg">“Craft your perfect pizza, one ingredient at a time.”</blockquote>
          <div className="mt-2 text-sm">The Pizza Builder Team</div>
        </div>
      </div>
      {/* Right: Form */}
      <div className="flex flex-col justify-center w-full md:w-1/2 p-8">
        <div className="max-w-md w-full mx-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center mb-2">
              <div className="bg-red-400 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold mr-2">C</div>
              <h1 className="text-2xl font-bold">SliceCraft</h1>
            </div>
            <div className="text-gray-500 text-sm">Welcome!</div>
            <div className="mt-2 text-xs text-gray-500">Login to your account to start building your pizza</div>
          </div>
          <div className="flex mb-4">
            <button className="flex-1 py-2 rounded-l-lg bg-gray-100 text-gray-600 font-semibold" onClick={() => window.location='/signup'}>Sign Up</button>
            <button className="flex-1 py-2 rounded-r-lg bg-red-400 text-white font-semibold">Login</button>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Enter your email" />
            </div>
            <div>
              <label className="block text-gray-700">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-300" placeholder="Enter your password" />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <button type="submit" className="w-full py-2 bg-red-400 text-white rounded font-semibold hover:bg-red-500 transition" disabled={loading}>{loading ? 'Logging In...' : 'Login'}</button>
          </form>
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-200" />
            <span className="mx-2 text-gray-400 text-xs">Or continue with</span>
            <div className="flex-grow h-px bg-gray-200" />
          </div>
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 py-2 border rounded hover:bg-gray-50 transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
} 