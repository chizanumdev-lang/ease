import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

@Entity('check_ins')
export class CheckIn {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ name: 'user_id' })
    userId: string;

    @Index()
    @Column({ type: 'date' })
    date: Date;

    @Column({ nullable: true })
    mood: string;

    @Column({ name: 'energy_level', nullable: true })
    energyLevel: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'jsonb', nullable: true, default: {} })
    metadata: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
