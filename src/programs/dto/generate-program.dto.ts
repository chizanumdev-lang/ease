import {
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class GenerateProgramDto {
  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  goalId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  goalDescription?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  category?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(90)
  @IsOptional()
  duration?: number = 30;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(15)
  @Max(120)
  @IsOptional()
  minutesPerDay?: number = 30;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  learningStyle?: string = 'mixed';

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  constraints?: string[] = [];

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: any;
}
