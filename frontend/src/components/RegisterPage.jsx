import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleSignInButton from './GoogleSignInButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
              <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
              <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
              <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
              <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
              <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
              <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
              <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="font-bold text-gray-900 text-lg">SSBCircle</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Join SSBCircle</h1>
          <p className="text-gray-500 text-sm mt-1">Connect with defence aspirants across India</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <GoogleSignInButton
            onSuccess={() => navigate('/', { replace: true })}
            onError={msg => setError(msg)}
          />
          <p className="text-center text-xs text-gray-400 mt-4">
            Your Google profile name and photo are used on SSBCircle
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          <Link to="/" className="hover:text-gray-600">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
