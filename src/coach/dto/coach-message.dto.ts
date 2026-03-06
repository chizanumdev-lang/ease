import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CoachMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsOptional()
    context?: string; // Optional client-side context if needed
}
