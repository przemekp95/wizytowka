import {
  createBackendProxyHeaders,
  createBackendProxyResponseHeaders,
  isJsonRequest,
  ProxyPayloadTooLargeError,
  readBoundedRequestText,
  resolveBackendGraphqlUrl,
} from '../_lib/backend-proxy';

export async function POST(request: Request): Promise<Response> {
  if (!isJsonRequest(request)) {
    return Response.json(
      { errors: [{ message: 'Content-Type must be application/json' }] },
      { status: 415 }
    );
  }

  try {
    const body = await readBoundedRequestText(request);
    const backendResponse = await fetch(resolveBackendGraphqlUrl(), {
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
      return Response.json({ errors: [{ message: error.message }] }, { status: 413 });
    }

    return Response.json(
      {
        errors: [{ message: 'Backend service unavailable' }],
      },
      { status: 502 }
    );
  }
}
