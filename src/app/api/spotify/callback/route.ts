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
  // Normalize API URL to ensure it's absolute with protocol
  let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  backendUrl = backendUrl.trim().replace(/\/+$/, '');
  if (!backendUrl.match(/^https?:\/\//)) {
    if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      backendUrl = `http://${backendUrl}`;
    } else {
      backendUrl = `https://${backendUrl}`;
    }
  }
  const backendCallbackUrl = `${backendUrl}/api/admin/spotify/callback?code=${code}${state ? `&state=${state}` : ''}`;
  
  // Log the backend URL being used (for debugging)
  console.log('Backend URL configuration:', {
    envVar: process.env.NEXT_PUBLIC_API_URL,
    normalized: backendUrl,
    callbackUrl: backendCallbackUrl,
  });

  try {
    console.log('Spotify callback received in Next.js route:', {
      code: code ? 'present' : 'missing',
      state: state || 'missing',
      error: error || 'none',
      backendUrl: backendCallbackUrl,
    });
    
    // Forward the request to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(backendCallbackUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'manual', // Don't follow redirects automatically
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Backend callback request timed out after 10 seconds');
        return NextResponse.redirect(
          new URL('/admin?spotify_error=timeout', request.url)
        );
      }
      console.error('Failed to fetch backend callback:', fetchError);
      return NextResponse.redirect(
        new URL(`/admin?spotify_error=fetch_failed&msg=${encodeURIComponent(fetchError.message)}`, request.url)
      );
    }

    console.log('Backend callback response:', {
      status: response.status,
      statusText: response.statusText,
      redirected: response.redirected,
      location: response.headers.get('location'),
      ok: response.ok,
    });

    // Handle error responses
    if (!response.ok && response.status < 300) {
      const errorText = await response.text();
      console.error('Backend callback error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 500),
      });
      return NextResponse.redirect(
        new URL(`/admin?spotify_error=backend_error_${response.status}`, request.url)
      );
    }

    // Backend will redirect, so check for redirect status or location header
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log('Redirecting to:', location);
        return NextResponse.redirect(location);
      }
    }

    // If backend returns a redirect location header
    const location = response.headers.get('location');
    if (location) {
      console.log('Redirecting via location header to:', location);
      return NextResponse.redirect(location);
    }

    // If response is OK but no redirect, check response body
    if (response.ok) {
      const data = await response.text();
      console.log('Backend returned OK but no redirect. Response:', data.substring(0, 200));
      // If backend returned success but no redirect, assume it worked
      return NextResponse.redirect(
        new URL('/admin?spotify_connected=true', request.url)
      );
    }

    // Fallback: redirect to admin (this shouldn't normally happen)
    console.warn('Using fallback redirect - backend response was unexpected:', {
      status: response.status,
      statusText: response.statusText,
    });
    return NextResponse.redirect(
      new URL('/admin?spotify_connected=true', request.url)
    );
  } catch (error: any) {
    console.error('Error proxying Spotify callback:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      backendUrl: backendCallbackUrl,
    });
    return NextResponse.redirect(
      new URL(`/admin?spotify_error=proxy_failed&details=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

