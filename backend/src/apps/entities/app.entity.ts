import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Review } from '../../reviews/entities/review.entity';
import { Analysis } from '../../analysis/entities/analysis.entity';
import { Job } from '../../jobs/entities/job.entity';

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  BOTH = 'both',
}

@Entity('apps')
export class App {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.apps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  appName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  appStoreLink: string;

  @Column({ nullable: true })
  playStoreLink: string;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({
    type: 'enum',
    enum: Platform,
    default: Platform.BOTH,
  })
  platform: Platform;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ nullable: true })
  lastFetchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Review, (review) => review.app)
  reviews: Review[];

  @OneToMany(() => Analysis, (analysis) => analysis.app)
  analyses: Analysis[];

  @OneToMany(() => Job, (job) => job.app)
  jobs: Job[];
}
