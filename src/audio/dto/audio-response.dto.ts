import { ObjectType, Field } from '@nestjs/graphql';
import { RitualTrack } from '../entities/ritual-track.entity';

@ObjectType()
export class DailyRitualsResponse {
    @Field({ nullable: true })
    morning?: RitualTrack;

    @Field({ nullable: true })
    night?: RitualTrack;

    @Field()
    status: string; // 'ready' | 'generating'
}

@ObjectType()
export class AudioUrlResponse {
    @Field()
    url: string;
}

@ObjectType()
export class ImmersiveTestResponse {
    @Field()
    morningUrl: string;

    @Field()
    nightUrl: string;

    @Field()
    taskUrl: string;
}
