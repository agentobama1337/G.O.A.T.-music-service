import { useState, useEffect, useRef, memo } from 'react';
import { X } from 'lucide-react';

const AuthComponent = memo(function AuthComponent({ onLogin, api }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const dialogRef = useRef(null);

  // Check for saved token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userData');

    if (savedToken && savedUser) {
      onLogin(savedToken, JSON.parse(savedUser));
    } else {
      dialogRef.current.showModal();
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data } = await api.post('/api/users/login', {
          email: formData.email,
          password: formData.password
        });

        if (data.success && data.token) {
          // Save auth data to localStorage
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userData', JSON.stringify({
            username: data.user.username, // Assuming the backend returns username
            email: formData.email
          }));

          onLogin(data.token, {
            username: data.username,
            email: formData.email
          });
          dialogRef.current.close();
        } else {
          setError('Invalid credentials');
        }
      } else {
        // Register
        const { data } = await api.post('/api/users/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });

        if (data.success) {
          // Auto login after registration
          const loginResponse = await api.post('/api/users/login', {
            email: formData.email,
            password: formData.password
          });

          if (loginResponse.data.success && loginResponse.data.token) {
            // Save auth data to localStorage
            localStorage.setItem('authToken', loginResponse.data.token);
            localStorage.setItem('userData', JSON.stringify({
              username: formData.username,
              email: formData.email
            }));

            onLogin(loginResponse.data.token, {
              username: formData.username,
              email: formData.email
            });
            dialogRef.current.close();
          }
        } else {
          setError(data.msg || 'Registration failed');
        }
      }
    } catch (error) {
      setError(error.response?.data?.msg || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    onLogin(null);
    dialogRef.current.showModal();
  };

  return (
    <dialog ref={dialogRef} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 backdrop:bg-gray-500 backdrop:bg-opacity-50">
      <button
        onClick={handleLogout}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <span className="text-gray-600">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </span>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setFormData({ email: '', password: '', username: '' });
          }}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </dialog>
  );
});

export default AuthComponent;