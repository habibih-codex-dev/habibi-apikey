/**
 * JSON + CORS helpers for Route Handlers.
 * Public endpoints (called by the bot from another host) need permissive CORS.
 */
import { NextResponse } from 'next/server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export function json(data, init = {}) {
  return NextResponse.json(data, { ...init, headers: { ...CORS, ...(init.headers || {}) } });
}

export function error(message, status = 400) {
  return json({ ok: false, error: message }, { status });
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export function withCorsImage(buffer) {
  return new NextResponse(buffer, {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  });
}

export { CORS };
