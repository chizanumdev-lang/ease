import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';

@ObjectType()
@Entity('goals')
export class Goal {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    description: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    category: string;

    @Field({ nullable: true })
    @Column({ type: 'date', nullable: true, name: 'target_date' })
    targetDate: Date;

    @Field()
    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field(() => [Program], { nullable: true })
    @OneToMany(() => Program, (program) => program.goal)
    programs: Program[];

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
