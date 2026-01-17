import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginRequest, SignupRequest, AuthResponse, AuthUser } from "@planner/shared";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        passwordHash
      }
    });

    const token = this.signToken(user.id);
    return {
      accessToken: token,
      user: this.toAuthUser(user)
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.signToken(user.id);
    return {
      accessToken: token,
      user: this.toAuthUser(user)
    };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.toAuthUser(user);
  }

  private signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString()
    };
  }
}
