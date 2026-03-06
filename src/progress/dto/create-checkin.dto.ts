import {
    IsDateString,
    IsString,
    IsOptional,
    IsObject,
} from 'class-validator';

export class CreateCheckinDto {
    @IsDateString()
    @IsOptional()
    checkinDate?: string;

    @IsString()
    @IsOptional()
    mood?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsObject()
    @IsOptional()
    metrics?: Record<string, any>;
}
