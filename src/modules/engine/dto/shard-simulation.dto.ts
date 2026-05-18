import { ObjectType, Field } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class ShardSimulationResult {
  @Field()
  selectedShard: string;

  @Field()
  displayName: string;

  @Field()
  modality: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  draftContent: any;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata: any;
}
