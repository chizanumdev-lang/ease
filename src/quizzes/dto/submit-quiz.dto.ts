import { IsArray, ArrayMinSize } from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class SubmitQuizDto {
  @Field(() => [Int])
  @IsArray()
  @ArrayMinSize(1)
  answers: number[];
}
