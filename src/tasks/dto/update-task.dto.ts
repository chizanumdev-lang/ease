import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTaskDto {
    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @IsOptional()
    scheduledAt?: Date | string;

    @IsOptional()
    content?: string;
}
