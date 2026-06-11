import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

import { BrevoService } from '../mail/brevo.service';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private brevoService: BrevoService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto;
    this.logger.log(`Attempting signup for email: ${email}`);

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    // Store pending user in cache for 15 minutes
    await this.cacheManager.set(
      `signup:${email}`,
      {
        email,
        password: hashedPassword,
        name,
        verificationCode,
        verificationExpires,
      },
      15 * 60 * 1000, // ttl in ms
    );

    // Send verification email
    try {
      await this.brevoService.sendVerificationEmail(email, verificationCode);
    } catch (error) {
      this.logger.error(
        `Failed to send initial verification email to ${email}`,
      );
    }

    return { message: 'Verification code sent to your email.' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token using SHA-256 for performance (random JWTs)
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');
    user.refreshToken = hashedRefreshToken;
    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        settings: user.settings,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET') || 'default-secret',
        expiresIn: this.configService.get('JWT_EXPIRATION') || '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') ||
          'default-refresh-secret',
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const refreshTokenMatches = hashedToken === user.refreshToken;

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    // Update stored refresh token
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');
    user.refreshToken = hashedRefreshToken;
    await this.userRepository.save(user);

    return tokens;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, code } = verifyEmailDto;

    // Check if user is already registered and verified
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return { message: 'Email already verified' };
    }

    // Get pending registration data from cache
    const pendingData: any = await this.cacheManager.get(`signup:${email}`);

    if (!pendingData) {
      throw new UnauthorizedException('Verification code expired or invalid');
    }

    if (pendingData.verificationCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (Date.now() > pendingData.verificationExpires) {
      throw new UnauthorizedException('Verification code expired');
    }

    // Create user in DB
    const user = this.userRepository.create({
      email: pendingData.email,
      password: pendingData.password,
      name: pendingData.name,
      isVerified: true,
      verificationCode: null,
      verificationExpires: null,
    });

    await this.userRepository.save(user);

    // Clear cache
    await this.cacheManager.del(`signup:${email}`);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Save refresh token
    const hashedRefreshToken = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');
    user.refreshToken = hashedRefreshToken;
    await this.userRepository.save(user);

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
        settings: user.settings,
      },
      ...tokens,
    };
  }

  async resendVerificationCode(email: string) {
    // Check if user is already verified
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return { message: 'Email already verified' };
    }

    const pendingData: any = await this.cacheManager.get(`signup:${email}`);
    if (!pendingData) {
      throw new UnauthorizedException('User not found or registration expired. Please sign up again.');
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const verificationExpires = Date.now() + 15 * 60 * 1000;

    pendingData.verificationCode = verificationCode;
    pendingData.verificationExpires = verificationExpires;

    await this.cacheManager.set(`signup:${email}`, pendingData, 15 * 60 * 1000); // 15 mins

    await this.brevoService.sendVerificationEmail(email, verificationCode);
    return { message: 'Verification code resent' };
  }
}
