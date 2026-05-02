import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateGoalDto {
    @Field()
    @IsString()
    @IsNotEmpty()
    title: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    category?: string;

    @Field({ nullable: true })
    @IsDateString()
    @IsOptional()
    targetDate?: string;
}
