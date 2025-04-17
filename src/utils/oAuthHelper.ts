import crypto from 'node:crypto';
import process from 'node:process';

import dotenv from 'dotenv';
import OAuth from 'oauth-1.0a';
import { z } from 'zod';

dotenv.config();

// Validate environment variables at startup
const envSchema = z.object({
  NETSUITE_CLIENT_ID: z.string().min(1),
  NETSUITE_CLIENT_SECRET: z.string().min(1),
  NETSUITE_ACCOUNT_ID: z.string().min(1),
  NETSUITE_ACCESS_TOKEN: z.string().min(1),
  NETSUITE_TOKEN_ID: z.string().min(1),
});

// Validate env once at startup
const env = envSchema.parse(process.env);

// Create single OAuth instance
const oauth = new OAuth({
  consumer: { key: env.NETSUITE_CLIENT_ID, secret: env.NETSUITE_CLIENT_SECRET },
  signature_method: 'HMAC-SHA256',
  hash_function(baseString, key) {
    return crypto.createHmac('sha256', key).update(baseString).digest('base64');
  },
});

// Input validation schema
const inputSchema = z.object({
  method: z.string().toUpperCase().refine(val => ['GET', 'POST', 'PUT', 'DELETE'].includes(val), {
    message: 'Invalid HTTP method',
  }),
  url: z.string().url(),
});

// Precompute static parts of the auth header
const TOKEN = {
  key: env.NETSUITE_ACCESS_TOKEN,
  secret: env.NETSUITE_TOKEN_ID,
};

const REALM = `, realm="${env.NETSUITE_ACCOUNT_ID}"`;

// Simple in-memory cache for OAuth headers with 5-minute TTL
const headerCache = new Map<string, { header: { Authorization: string }; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function createOAuthHeader({
  method,
  url,
}: {
  method: string;
  url: string;
}) {
  // Generate cache key
  const cacheKey = `${method}:${url}`;

  // Check cache
  const cached = headerCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.header;
  }

  // Validate input
  const validatedInput = inputSchema.parse({ method, url });

  const requestData = {
    url: validatedInput.url,
    method: validatedInput.method,
  };

  // Generate header
  const authHeader = oauth.toHeader(oauth.authorize(requestData, TOKEN));
  authHeader.Authorization += REALM;

  // Cache the result
  headerCache.set(cacheKey, {
    header: authHeader,
    timestamp: Date.now(),
  });

  return authHeader;
}
