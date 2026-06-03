import { createHash, randomBytes } from 'crypto';

export const CLIENT_INVITATION_EXPIRATION_DAYS = 7;

export function createClientInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashClientInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getClientInvitationExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CLIENT_INVITATION_EXPIRATION_DAYS);

  return expiresAt;
}
