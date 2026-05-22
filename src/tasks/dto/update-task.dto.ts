import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsInt,
  IsDate,
} from 'class-validator';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class UpdateTaskDto {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  content?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  watchedSeconds?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  totalDuration?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: any;
}
