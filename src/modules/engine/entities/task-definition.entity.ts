import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum CapabilityType {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  LOGIC = 'LOGIC',
  VISION = 'VISION',
  UTILITY = 'UTILITY',
}

registerEnumType(CapabilityType, {
  name: 'CapabilityType',
});

@ObjectType()
@Entity('task_definitions')
export class TaskDefinition {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => CapabilityType)
  @Column({
    type: 'enum',
    enum: CapabilityType,
  })
  capability: CapabilityType;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'default_config', type: 'jsonb', default: {} })
  defaultConfig: any;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
