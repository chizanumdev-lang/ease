import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateGoalDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsDateString()
    @IsOptional()
    targetDate?: string;
}
