/**
 * JWT helpers for self-service booking management links.
 *
 * Payload: { bookingId, orgId }
 * Expiry:  72 hours (configurable)
 * Secret:  JWT_SECRET env var (must be ≥ 32 chars)
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SECRET_RAW = process.env["JWT_SECRET"] ?? "local-dev-secret-reunio-32chars-ok";
const secret = new TextEncoder().encode(SECRET_RAW);

export type BookingTokenPayload = JWTPayload & {
  bookingId: string;
  orgId: string;
};

export async function signBookingToken(
  bookingId: string,
  orgId: string,
  expiresInHours = 72,
): Promise<string> {
  return new SignJWT({ bookingId, orgId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInHours}h`)
    .sign(secret);
}

export async function verifyBookingToken(
  token: string,
): Promise<BookingTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload["bookingId"] === "string" &&
      typeof payload["orgId"] === "string"
    ) {
      return payload as BookingTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildManageUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/booking/manage/${encodeURIComponent(token)}`;
}
