import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Refresh session using a Supabase refresh token.
   * The mobile app sends the refresh token in the request body.
   */
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * Resend Supabase signup confirmation email.
   */
  @Post('resend-code')
  async resendCode(@Body('email') email: string) {
    return this.authService.resendConfirmationEmail(email);
  }

  @Get('test')
  test() {
    return { message: 'Auth controller is reachable' };
  }
}
