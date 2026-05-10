import { InputType, Field, Int } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateTaskDto {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    completed?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    scheduledAt?: Date;

    @Field({ nullable: true })
    @IsOptional()
    content?: string;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    watchedSeconds?: number;

    @Field(() => Int, { nullable: true })
    @IsOptional()
    totalDuration?: number;

    @Field({ nullable: true })
    @IsOptional()
    metadata?: string;
}

