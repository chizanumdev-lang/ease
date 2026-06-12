import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private supabaseService: SupabaseService,
  ) {}

  /**
   * Sign up a new user via Supabase Auth.
   * Supabase will send a confirmation email if enable_confirmations = true.
   * A trigger automatically creates the corresponding public.users row.
   */
  async signup(signupDto: SignupDto) {
    const { email, password, name } = signupDto;
    this.logger.log(`Attempting signup for: ${email}`);

    const { data, error } = await this.supabaseService.adminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: false, // Supabase will send confirmation email
    });

    if (error) {
      this.logger.error(`Supabase signup error: ${error.message}`);
      if (
        error.message.toLowerCase().includes('already') ||
        error.message.toLowerCase().includes('duplicate') ||
        error.message.toLowerCase().includes('unique')
      ) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException(error.message);
    }

    // Update name in public.users if the trigger has already fired
    // (sometimes there's a slight delay; this is a safe upsert)
    if (data.user) {
      await this.userRepository.upsert(
        {
          id: data.user.id,
          email: data.user.email,
          name,
          settings: {},
        },
        ['id'],
      );
    }

    return { message: 'Account created. Check your email to confirm your address.' };
  }

  /**
   * Sign in with email + password via Supabase Auth.
   * Returns Supabase session tokens (access_token, refresh_token).
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const { data, error } =
      await this.supabaseService.adminClient.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userRepository.findOne({
      where: { id: data.user.id },
    });

    if (!user) {
      // Edge case: auth user exists but public row missing — create it
      this.logger.warn(`public.users row missing for auth user ${data.user.id}, creating...`);
      const newUser = this.userRepository.create({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split('@')[0],
        settings: {},
      });
      await this.userRepository.save(newUser);
    }

    return {
      user: {
        id: user?.id ?? data.user.id,
        email: user?.email ?? data.user.email,
        name: user?.name ?? data.user.user_metadata?.name,
        settings: user?.settings ?? {},
      },
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Refresh session using Supabase refresh token.
   */
  async refreshTokens(refreshToken: string) {
    const { data, error } =
      await this.supabaseService.adminClient.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  /**
   * Resend confirmation email via Supabase.
   */
  async resendConfirmationEmail(email: string) {
    const { error } = await this.supabaseService.adminClient.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      this.logger.error(`Resend confirmation error: ${error.message}`);
      throw new InternalServerErrorException('Failed to resend confirmation email');
    }

    return { message: 'Confirmation email resent.' };
  }
}
