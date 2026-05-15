import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onSuccess, onError }) {
  const { loginWithGoogle } = useAuth();
  const btnRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(!!window.google);

  useEffect(() => {
    if (window.google) { init(); return; }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => { setScriptReady(true); };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (scriptReady) init();
  }, [scriptReady]);

  function init() {
    if (!window.google || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'outline',
      size: 'large',
      width: btnRef.current.offsetWidth || 360,
      text: 'continue_with',
      shape: 'rectangular',
    });
  }

  async function handleCredential(response) {
    try {
      await loginWithGoogle(response.credential);
      onSuccess?.();
    } catch (err) {
      onError?.(err.message);
    }
  }

  return (
    <div className="w-full flex justify-center">
      <div ref={btnRef} className="w-full" />
    </div>
  );
}
