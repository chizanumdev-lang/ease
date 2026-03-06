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

@Entity('audio_tracks')
export class AudioTrack {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    url: string;

    @Column({ type: 'int', nullable: true })
    duration: number;

    @Column({ nullable: true })
    type: string;

    @Column({ name: 'day_plan_id' })
    dayPlanId: string;

    @ManyToOne(() => DayPlan, (dayPlan) => dayPlan.audioTracks, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'day_plan_id' })
    dayPlan: DayPlan;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
