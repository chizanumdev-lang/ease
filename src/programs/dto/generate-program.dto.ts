import { IsUUID, IsInt, Min, Max, IsOptional, IsString, IsArray } from 'class-validator';

export class GenerateProgramDto {
    @IsUUID()
    goalId: string;

    @IsInt()
    @Min(1)
    @Max(90)
    @IsOptional()
    duration?: number = 30;

    @IsInt()
    @Min(15)
    @Max(120)
    @IsOptional()
    minutesPerDay?: number = 30;

    @IsString()
    @IsOptional()
    learningStyle?: string = 'mixed';

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    constraints?: string[] = [];

    @IsOptional()
    metadata?: any;
}
