import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production');

export interface SessionData {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as unknown as SessionData;
    return payload;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  const token = request.cookies.get('session')?.value;

  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionData;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireAuth();
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return session;
}

export const ADMIN_CREDENTIALS = {
  phone: '+99999999999',
  password: 'Elevateitall',
};