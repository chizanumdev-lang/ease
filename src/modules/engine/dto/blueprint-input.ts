import { InputType, Field, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@InputType()
export class NodeDataInput {
  @Field()
  label: string;

  @Field({ nullable: true })
  taskDefinitionId?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  config?: any;
}

@InputType()
export class NodePositionInput {
  @Field(() => Float)
  x: number;

  @Field(() => Float)
  y: number;
}

@InputType()
export class NodeInput {
  @Field()
  id: string;

  @Field(() => NodeDataInput)
  data: NodeDataInput;

  @Field(() => NodePositionInput)
  position: NodePositionInput;
}

@InputType()
export class EdgeInput {
  @Field()
  source: string;

  @Field()
  target: string;
}
