import { IsArray, ArrayMinSize } from 'class-validator';

export class SubmitQuizDto {
    @IsArray()
    @ArrayMinSize(1)
    answers: number[];
}
