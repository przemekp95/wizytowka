const DEFAULT_BACKEND_API_URL = 'http://localhost:4000';

function resolveBackendApiUrl(): string {
  return (process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_API_URL).replace(/\/+$/, '');
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();

  try {
    const backendResponse = await fetch(`${resolveBackendApiUrl()}/api/chat/message`, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') ?? 'application/json',
        accept: request.headers.get('accept') ?? 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const responseBody = await backendResponse.text();

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: {
        'content-type': backendResponse.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';

    return Response.json(
      {
        error: message,
      },
      { status: 502 }
    );
  }
}
