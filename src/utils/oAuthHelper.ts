import crypto from 'node:crypto';
import process from 'node:process';

import dotenv from 'dotenv';
import OAuth from 'oauth-1.0a';

dotenv.config();

export function createOAuthHeader({
  method,
  url,
}: {
  method: string;
  url: string;
}) {
  const clientId = process.env.NETSUITE_CLIENT_ID;
  const clientSecret = process.env.NETSUITE_CLIENT_SECRET;
  const realm = process.env.NETSUITE_ACCOUNT_ID;
  const accessToken = process.env.NETSUITE_ACCESS_TOKEN;
  const tokenSecret = process.env.NETSUITE_TOKEN_ID;

  if (!clientId || !clientSecret || !accessToken || !tokenSecret) {
    throw new Error('Missing required environment variables for OAuth');
  }

  const oauth = new OAuth({
    consumer: { key: clientId, secret: clientSecret },
    signature_method: 'HMAC-SHA256',
    hash_function(baseString, key) {
      return crypto.createHmac('sha256', key).update(baseString).digest('base64');
    },
  });

  const requestData = {
    url,
    method,
  };

  const authHeader = oauth.toHeader(
    oauth.authorize(requestData, {
      key: accessToken,
      secret: tokenSecret,
    }),
  );

  authHeader.Authorization += `, realm="${realm}"`;

  return authHeader;
}
