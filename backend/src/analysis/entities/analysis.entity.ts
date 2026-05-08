import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { App } from '../../apps/entities/app.entity';

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  appId: string;

  @ManyToOne(() => App, (app) => app.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appId' })
  app: App;

  @CreateDateColumn()
  generatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  prioritizedFixes: any[];

  @Column({ type: 'jsonb', nullable: true })
  nextFeatureIdeas: any[];

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'jsonb', nullable: true })
  competitorMentions: any[];

  @Column({ type: 'jsonb', nullable: true })
  sentimentBreakdown: { positive: number; neutral: number; negative: number };

  @Column({ type: 'text', nullable: true })
  rawPromptUsed: string;
}
