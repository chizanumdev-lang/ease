import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('ritual_tracks')
export class RitualTrack {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field({ nullable: true })
    @Column()
    url: string;

    @Field(() => Int, { nullable: true })
    @Column({ type: 'int', nullable: true })
    duration: number;

    @Field()
    @Column()
    ritualType: string;

    @Field()
    @Column()
    date: string; // YYYY-MM-DD

    @Field(() => GraphQLJSON, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    metadata: any;

    @Field()
    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

