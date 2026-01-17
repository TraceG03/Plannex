import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "dev_secret_change_me"
    });
  }

  async validate(payload: JwtPayload): Promise<{ userId: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true }
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return { userId: user.id };
  }
}
