import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // If there's an error, redirect to admin with error
  if (error) {
    return NextResponse.redirect(
      new URL(`/admin?spotify_error=${error}`, request.url)
    );
  }

  // If no code, redirect with error
  if (!code) {
    return NextResponse.redirect(
      new URL('/admin?spotify_error=no_code', request.url)
    );
  }

  // Proxy to backend callback endpoint
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const backendCallbackUrl = `${backendUrl}/api/admin/spotify/callback?code=${code}${state ? `&state=${state}` : ''}`;

  try {
    // Forward the request to backend
    const response = await fetch(backendCallbackUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Backend will redirect, so follow the redirect
    if (response.redirected) {
      return NextResponse.redirect(response.url);
    }

    // If backend returns a redirect location header
    const location = response.headers.get('location');
    if (location) {
      return NextResponse.redirect(location);
    }

    // Fallback: redirect to admin
    return NextResponse.redirect(
      new URL('/admin?spotify_connected=true', request.url)
    );
  } catch (error) {
    console.error('Error proxying Spotify callback:', error);
    return NextResponse.redirect(
      new URL('/admin?spotify_error=proxy_failed', request.url)
    );
  }
}

