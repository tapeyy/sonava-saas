import axios from 'axios';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createOAuthHeader } from '@/utils/oAuthHelper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const netsuiteUrl = `https://3998373.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=489&deploy=1&tranId=${id}`;

    // Generate the OAuth header
    const oauthHeader = createOAuthHeader({
      method: 'GET',
      url: netsuiteUrl,
    });

    // Send the request to the NetSuite RESTlet
    const response = await axios.get(netsuiteUrl, {
      headers: {
        ...oauthHeader,
        'Content-Type': 'application/json',
      },
    });

    // Return the NetSuite response
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error in NetSuite API handler:', error.message);
    return NextResponse.json({
      error: 'Failed to send request to NetSuite',
      details: error.message,
    }, { status: 500 });
  }
}
