import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
@Entity('task_templates')
export class TaskTemplate {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column()
    description: string;

    @Field()
    @Column()
    type: string; // e.g., 'exercise', 'mental', 'focus', 'nutrition'

    @Field()
    @Column({ default: 15, name: 'default_duration' })
    defaultDuration: number; // in minutes

    @Field()
    @Column({ default: 10, name: 'default_xp' })
    defaultXp: number;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true, name: 'prompt_instructions' })
    promptInstructions: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
