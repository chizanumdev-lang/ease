import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { IsDateString, IsString, IsOptional, IsObject } from 'class-validator';

@InputType()
export class CreateCheckinDto {
  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  checkinDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  mood?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsObject()
  @IsOptional()
  metrics?: Record<string, any>;
}
