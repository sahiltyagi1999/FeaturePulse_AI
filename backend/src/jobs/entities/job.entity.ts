import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { App } from '../../apps/entities/app.entity';

export enum JobType {
  FETCH_REVIEWS = 'fetch_reviews',
  ANALYSE = 'analyse',
}

export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @ManyToOne(() => App, (app) => app.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: App;

  @Column({ type: 'enum', enum: JobType })
  jobType: JobType;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.QUEUED })
  status: JobStatus;

  @Column({ nullable: true })
  progressStep: string;

  @Column({ type: 'int', default: 0 })
  progressPercent: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
