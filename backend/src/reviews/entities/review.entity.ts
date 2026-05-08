import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { App } from '../../apps/entities/app.entity';

export enum ReviewPlatform {
  IOS = 'ios',
  ANDROID = 'android',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @ManyToOne(() => App, (app) => app.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: App;

  @Column({ nullable: true })
  reviewerName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  reviewText: string;

  @Column({ nullable: true })
  reviewDate: Date;

  @Column({
    type: 'enum',
    enum: ReviewPlatform,
  })
  platform: ReviewPlatform;

  @Column({ default: false })
  isCompetitor: boolean;

  @Column({ nullable: true })
  competitorAppName: string;

  @CreateDateColumn()
  createdAt: Date;
}
