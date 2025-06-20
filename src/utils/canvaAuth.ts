interface CanvaJWTPayload {
  userId: string;
  teamId?: string;
  displayName?: string;
}

export async function verifyCanvaJWT(_token: string): Promise<CanvaJWTPayload | null> {
  // Simplified implementation for now
  // TODO: Implement proper Canva JWT verification
  return null;
}