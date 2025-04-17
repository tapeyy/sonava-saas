import { auth } from '@clerk/nextjs/server';
import axios from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createOAuthHeader } from '@/utils/oAuthHelper';

// List of allowed organizations (replace with actual organization IDs)
const allowedOrganizations = ['org_2pHjYjTOot943auVGUVA2vQJxXi', 'org_2pHKdpxlmI3e95Jb5CdGk3l6tj0'];

// Create axios instance with defaults
const netsuiteClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response cache with 5-minute TTL
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Input validation
const querySchema = z.object({
  id: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    // Check authentication and authorization
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!orgId || !allowedOrganizations.includes(orgId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate input
    const { searchParams } = new URL(req.url);
    const validatedInput = querySchema.parse({ id: searchParams.get('id') });
    const { id } = validatedInput;

    // Check cache
    const cacheKey = `order:${id}:${userId}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': `private, max-age=${Math.floor((CACHE_TTL - (Date.now() - cached.timestamp)) / 1000)}`,
        },
      });
    }

    // Construct URL
    const netsuiteUrl = `https://3998373.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=489&deploy=1&tranId=${id}`;

    // Get OAuth header (already cached internally)
    const oauthHeader = createOAuthHeader({
      method: 'GET',
      url: netsuiteUrl,
    });

    // Make request
    const response = await netsuiteClient.get(netsuiteUrl, {
      headers: oauthHeader,
    });

    // Cache response
    responseCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    // Return with cache headers
    return NextResponse.json(response.data, {
      headers: {
        'Cache-Control': `private, max-age=${CACHE_TTL / 1000}`,
      },
    });
  } catch (error: any) {
    console.error('Error in NetSuite API handler:', error.message);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
    }

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (error.code === 'ECONNABORTED') {
      return NextResponse.json({ error: 'NetSuite request timeout' }, { status: 504 });
    }

    return NextResponse.json({
      error: 'Failed to fetch data from NetSuite',
      details: error.message,
    }, { status: 500 });
  }
}
