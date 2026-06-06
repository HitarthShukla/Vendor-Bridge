import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/db';
import type { LoginInput, RegisterInput } from '@vendorbridge/shared';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

function generateAccessToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

function generateRefreshToken() {
  return uuidv4();
}

function getRefreshExpiresAt(): Date {
  const days = parseInt(REFRESH_EXPIRES_IN) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export const authService = {
  async register(input: RegisterInput) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { status: 409, code: 'EMAIL_EXISTS' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: input.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: getRefreshExpiresAt(),
      },
    });

    return { user, accessToken, refreshToken };
  },

  async login(input: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || user.deleted_at) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
    }
    if (!user.is_active) {
      throw Object.assign(new Error('Account is deactivated'), { status: 403, code: 'ACCOUNT_INACTIVE' });
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) {
      throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: getRefreshExpiresAt(),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshTokenStr: string) {
    // Find the refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked_at || storedToken.expires_at < new Date()) {
      throw Object.assign(new Error('Invalid or expired refresh token'), {
        status: 401,
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Revoke the old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    const newRefreshToken = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        user_id: storedToken.user.id,
        expires_at: getRefreshExpiresAt(),
      },
    });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshTokenStr: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
        vendor_profile: {
          select: { id: true, company_name: true, status: true },
        },
      },
    });
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 404, code: 'USER_NOT_FOUND' });
    }
    return user;
  },
};
