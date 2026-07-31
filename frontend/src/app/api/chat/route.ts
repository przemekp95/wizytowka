import {
  createBackendProxyHeaders,
  createBackendProxyResponseHeaders,
  isJsonRequest,
  ProxyPayloadTooLargeError,
  readBoundedRequestText,
  resolveBackendApiUrl,
} from '../_lib/backend-proxy';

export async function POST(request: Request): Promise<Response> {
  if (!isJsonRequest(request)) {
    return Response.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }

  try {
    const body = await readBoundedRequestText(request);
    const backendResponse = await fetch(`${resolveBackendApiUrl()}/api/chat/message`, {
      method: 'POST',
      headers: createBackendProxyHeaders(request),
      body,
      cache: 'no-store',
    });

    const responseBody = await backendResponse.text();

    return new Response(responseBody, {
      status: backendResponse.status,
      headers: createBackendProxyResponseHeaders(backendResponse.headers),
    });
  } catch (error) {
    if (error instanceof ProxyPayloadTooLargeError) {
      return Response.json({ error: error.message }, { status: 413 });
    }

    return Response.json(
      {
        error: 'Backend service unavailable',
      },
      { status: 502 }
    );
  }
}
