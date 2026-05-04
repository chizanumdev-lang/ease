import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { DayPlan } from '../../programs/entities/day-plan.entity';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
@Entity('audio_tracks')
export class AudioTrack {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column()
    url: string;

    @Field(() => Int, { nullable: true })
    @Column({ type: 'int', nullable: true })
    duration: number;

    @Field({ nullable: true })
    @Column({ nullable: true })
    type: string;

    @Field(() => GraphQLJSON, { nullable: true })
    @Column({ type: 'json', nullable: true })
    metadata: any;

    @Field()
    @Column({ name: 'day_plan_id' })
    dayPlanId: string;

    @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.audioTracks, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'day_plan_id' })
    dayPlan: DayPlan;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
