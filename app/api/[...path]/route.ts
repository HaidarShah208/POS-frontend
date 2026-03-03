"use server";

import { NextResponse, type NextRequest } from "next/server";

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.API_URL ||
  "";

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "");
}

function buildUpstreamUrl(req: NextRequest): string {
  const url = new URL(req.url);
  // Request is `/api/<path>` (this route), so upstream should be `<origin>/api/<path>`.
  return `${normalizeOrigin(BACKEND_ORIGIN)}/api${url.pathname.replace(/^\/api/, "")}${url.search}`;
}

async function proxy(req: NextRequest): Promise<NextResponse> {
  if (!BACKEND_ORIGIN) {
    return NextResponse.json(
      {
        error:
          "Backend URL is not configured. Set NEXT_PUBLIC_API_URL (or API_URL) in your deployment environment.",
      },
      { status: 500 }
    );
  }

  const upstreamUrl = buildUpstreamUrl(req);
  const method = req.method.toUpperCase();

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const resHeaders = new Headers(upstreamRes.headers);
  // Hop-by-hop headers should not be forwarded.
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("connection");
  resHeaders.delete("keep-alive");
  resHeaders.delete("proxy-authenticate");
  resHeaders.delete("proxy-authorization");
  resHeaders.delete("te");
  resHeaders.delete("trailers");
  resHeaders.delete("upgrade");

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export function GET(req: NextRequest) {
  return proxy(req);
}
export function POST(req: NextRequest) {
  return proxy(req);
}
export function PUT(req: NextRequest) {
  return proxy(req);
}
export function PATCH(req: NextRequest) {
  return proxy(req);
}
export function DELETE(req: NextRequest) {
  return proxy(req);
}

