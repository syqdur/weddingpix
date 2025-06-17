// PKCE (Proof Key for Code Exchange) utilities for secure OAuth flow

/**
 * Generates a cryptographically random code verifier for PKCE
 * @returns A base64url-encoded string of 128 characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(96); // 96 bytes = 128 base64url characters
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Generates a code challenge from a code verifier using SHA256
 * @param codeVerifier The code verifier string
 * @returns A base64url-encoded SHA256 hash of the code verifier
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Encodes a byte array to base64url format (RFC 4648 Section 5)
 * @param array The byte array to encode
 * @returns A base64url-encoded string
 */
function base64URLEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Validates a code verifier according to PKCE specifications
 * @param codeVerifier The code verifier to validate
 * @returns True if valid, false otherwise
 */
export function validateCodeVerifier(codeVerifier: string): boolean {
  // PKCE code verifier must be 43-128 characters long
  // and contain only [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
  const validPattern = /^[A-Za-z0-9\-._~]{43,128}$/;
  return validPattern.test(codeVerifier);
}

/**
 * Validates a code challenge according to PKCE specifications
 * @param codeChallenge The code challenge to validate
 * @returns True if valid, false otherwise
 */
export function validateCodeChallenge(codeChallenge: string): boolean {
  // PKCE code challenge must be 43 characters long (base64url of SHA256)
  // and contain only [A-Z] / [a-z] / [0-9] / "-" / "_"
  const validPattern = /^[A-Za-z0-9\-_]{43}$/;
  return validPattern.test(codeChallenge);
}

console.log('🔐 PKCE utilities loaded for secure OAuth flow');