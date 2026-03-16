import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Program } from './program.entity';
import { Task } from '../../tasks/entities/task.entity';
import { AudioTrack } from '../../audio/entities/audio-track.entity';
import { Quiz } from '../../quizzes/entities/quiz.entity';

@Entity('day_plans')
export class DayPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int', name: 'day_number' })
    dayNumber: number;

    @Column({ nullable: true })
    theme: string;

    @Column({ default: 'pending' })
    status: string; // 'pending' | 'ready' | 'failed'

    @Column({ type: 'jsonb', nullable: true, name: 'focus_areas' })
    focusAreas: string[];

    @Index()
    @Column({ name: 'program_id' })
    programId: string;

    @ManyToOne(() => Program, (program) => program.dayPlans, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'program_id' })
    program: Program;

    @OneToMany(() => Task, (task) => task.dayPlan)
    tasks: Task[];

    @OneToMany(() => AudioTrack, (audioTrack) => audioTrack.dayPlan)
    audioTracks: AudioTrack[];

    @OneToMany(() => Quiz, (quiz) => quiz.dayPlan)
    quizzes: Quiz[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
