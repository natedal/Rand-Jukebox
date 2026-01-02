'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SpotifyCallback() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (codeParam) {
      setCode(codeParam);
    }
  }, [searchParams]);

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    }
  };

  const generateCurlCommand = () => {
    if (!code) return '';
    
    return `curl -X POST https://accounts.spotify.com/api/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=${code}" \\
  -d "redirect_uri=http://127.0.0.1:3000/api/spotify/callback" \\
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight-900 p-4">
        <div className="glass rounded-3xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Authorization Error</h1>
            <p className="text-gray-400 mb-4">Error: {error}</p>
            <a href="/" className="text-gold-400 hover:text-gold-300">← Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight-900 p-4">
        <div className="glass rounded-3xl p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Processing authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-midnight-900 p-4">
      <div className="glass rounded-3xl p-8 max-w-3xl w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Authorization Code Received!</h1>
          <p className="text-gray-400">Copy this code to exchange it for a refresh token</p>
        </div>

        <div className="space-y-4">
          {/* Code Display */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Authorization Code:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl bg-midnight-800 border border-gold-400/30 text-white font-mono text-sm"
              />
              <button
                onClick={copyCode}
                className="px-6 py-3 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all border border-gold-400/30"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-midnight-800/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Next Steps:</h2>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">1</span>
                <span>Copy the authorization code above</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">2</span>
                <span>Open Terminal and run this command (replace YOUR_CLIENT_ID and YOUR_CLIENT_SECRET):</span>
              </li>
            </ol>

            {/* Curl Command */}
            <div className="mt-4 bg-midnight-900 rounded-lg p-4 border border-gold-400/20">
              <pre className="text-xs text-gray-300 overflow-x-auto font-mono">
                {generateCurlCommand()}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateCurlCommand());
                  alert('Command copied!');
                }}
                className="mt-2 text-xs text-gold-400 hover:text-gold-300"
              >
                Copy Command
              </button>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-400/20 text-gold-400 flex items-center justify-center text-xs font-bold">3</span>
              <span className="text-sm text-gray-300">Copy the <code className="bg-midnight-700 px-1 py-0.5 rounded text-gold-400">refresh_token</code> from the response and add it to your <code className="bg-midnight-700 px-1 py-0.5 rounded text-gold-400">backend/.env</code> file</span>
            </div>
          </div>

          <div className="flex gap-4">
            <a
              href="/"
              className="flex-1 px-6 py-3 rounded-xl bg-midnight-700/50 text-white hover:bg-midnight-700 transition-all text-center"
            >
              Back to Home
            </a>
            <a
              href="https://developer.spotify.com/documentation/web-api/tutorials/code-flow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 rounded-xl bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition-all border border-gold-400/30 text-center"
            >
              View Spotify Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

