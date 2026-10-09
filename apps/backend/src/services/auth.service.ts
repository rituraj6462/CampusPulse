import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { hashPassword, comparePassword } from '../utils/crypto';
import { AppError } from '../middleware/error.middleware';
import { RegisterUserInput, LoginUserInput, UpdateProfileInput, Role } from '@campuspulse/shared';

export class AuthService {
  static generateToken(user: { id: string; email: string; role: string; name: string }) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  static async register(input: RegisterUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await hashPassword(input.password);

    // Create user with transaction to add interests if provided
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          name: input.name,
          role: input.role || Role.STUDENT,
          department: input.department,
          graduationYear: input.graduationYear,
          bio: input.bio
        }
      });

      if (input.interests && input.interests.length > 0) {
        await tx.userInterest.createMany({
          data: input.interests.map(interest => ({
            userId: newUser.id,
            interest
          }))
        });
      }

      return newUser;
    });

    const userWithInterests = await this.getProfile(user.id);
    const token = this.generateToken(user);

    return { user: userWithInterests, token };
  }

  static async login(input: LoginUserInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        interests: true
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await comparePassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = this.generateToken(user);

    const userSummary = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      avatar: user.avatar,
      department: user.department,
      graduationYear: user.graduationYear,
      bio: user.bio,
      isPassportPublic: user.isPassportPublic,
      interests: user.interests.map(i => i.interest),
      createdAt: user.createdAt.toISOString()
    };

    return { user: userSummary, token };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: true
      }
    });

    if (!user) {
      throw new AppError('User profile not found.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      avatar: user.avatar,
      department: user.department,
      graduationYear: user.graduationYear,
      bio: user.bio,
      isPassportPublic: user.isPassportPublic,
      interests: user.interests.map(i => i.interest),
      createdAt: user.createdAt.toISOString()
    };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          department: input.department,
          graduationYear: input.graduationYear,
          bio: input.bio,
          isPassportPublic: input.isPassportPublic
        }
      });

      if (input.interests) {
        await tx.userInterest.deleteMany({
          where: { userId }
        });

        if (input.interests.length > 0) {
          await tx.userInterest.createMany({
            data: input.interests.map(interest => ({
              userId,
              interest
            }))
          });
        }
      }

      return user;
    });

    return this.getProfile(updated.id);
  }
}
