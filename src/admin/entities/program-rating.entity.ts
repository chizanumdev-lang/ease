import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';

@Entity('program_ratings')
export class ProgramRating {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'program_id' })
    programId: string;

    @ManyToOne(() => Program, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'program_id' })
    program: Program;

    @Column({ type: 'int' })
    rating: number; // 1-5

    @Column({ type: 'text', nullable: true })
    comment: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
