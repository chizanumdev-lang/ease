import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Task } from './task.entity';

@ObjectType()
@Entity('audio_assets')
export class AudioAsset {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  taskId: string;

  @ManyToOne(() => Task, (task) => task.audioAssets)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Field()
  @Column()
  storagePath: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  duration: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  mimeType: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
