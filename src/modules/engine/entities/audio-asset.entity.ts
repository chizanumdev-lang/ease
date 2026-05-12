import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { EngineTask } from './task.entity';

@ObjectType()
@Entity('audio_assets')
export class AudioAsset {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => EngineTask, (task) => task.audioAssets)
  @JoinColumn({ name: 'task_id' })
  task: EngineTask;

  @Field()
  @Column({ name: 'storage_path' })
  storagePath: string;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  duration: number;

  @Field({ nullable: true })
  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
