import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

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

        // Create user
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            name,
        });

        await this.userRepository.save(user);

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        // Save refresh token
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        user.refreshToken = hashedRefreshToken;
        await this.userRepository.save(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                settings: user.settings,
            },
            ...tokens,
        };
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

        // Save refresh token
        const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
        user.refreshToken = hashedRefreshToken;
        await this.userRepository.save(user);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                settings: user.settings,
            },
            ...tokens,
        };
    }

    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }
}
