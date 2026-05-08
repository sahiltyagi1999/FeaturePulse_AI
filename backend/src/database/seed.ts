import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

import { User } from '../auth/entities/user.entity';
import { App, Platform } from '../apps/entities/app.entity';
import { Review, ReviewPlatform } from '../reviews/entities/review.entity';
import { Analysis } from '../analysis/entities/analysis.entity';
import { Job } from '../jobs/entities/job.entity';

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, App, Review, Analysis, Job],
  synchronize: true,
  ssl: process.env.DATABASE_URL?.includes('ssl') ? { rejectUnauthorized: false } : false,
});

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  const userRepo = dataSource.getRepository(User);
  const appRepo = dataSource.getRepository(App);
  const reviewRepo = dataSource.getRepository(Review);
  const analysisRepo = dataSource.getRepository(Analysis);

  const existingUser = await userRepo.findOne({ where: { email: 'demo@featurepulse.ai' } });
  if (existingUser) {
    console.log('Seed already run. Skipping.');
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('demo1234', 10);
  const user = userRepo.create({
    name: 'Demo User',
    email: 'demo@featurepulse.ai',
    password: hashedPassword,
  });
  await userRepo.save(user);
  console.log('Created demo user: demo@featurepulse.ai / demo1234');

  const app = appRepo.create({
    userId: user.id,
    appName: 'Spotify',
    description: 'Spotify is a digital music service that gives you access to millions of songs, podcasts, and videos from artists all over the world.',
    playStoreLink: 'https://play.google.com/store/apps/details?id=com.spotify.music',
    appStoreLink: 'https://apps.apple.com/us/app/spotify/id324684580',
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/240px-Spotify_logo_without_text.svg.png',
    platform: Platform.BOTH,
    averageRating: 4.2,
    totalReviews: 15,
    lastFetchedAt: new Date(),
  });
  await appRepo.save(app);
  console.log('Created demo app: Spotify');

  const sampleReviews = [
    { reviewerName: 'Alex M', rating: 5, reviewText: 'Absolutely love Spotify! The Discover Weekly playlist never misses. Best music app hands down.', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'Sarah K', rating: 4, reviewText: 'Great app overall but it keeps crashing when I try to download songs for offline use. Please fix this bug!', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'James L', rating: 2, reviewText: 'The latest update completely broke shuffle. It just keeps playing the same 10 songs over and over. Very frustrating.', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'Emily R', rating: 5, reviewText: 'I switched from Apple Music and haven\'t looked back. The algorithm is so much better at suggesting new artists.', platform: ReviewPlatform.IOS },
    { reviewerName: 'Mike T', rating: 3, reviewText: 'Decent app but the battery drain is insane. Uses about 25% battery per hour of playback. Apple Music doesn\'t have this issue.', platform: ReviewPlatform.IOS },
    { reviewerName: 'Lisa P', rating: 1, reviewText: 'Premium features keep disappearing. I\'m paying $10/month but offline mode randomly stops working. Customer support is useless.', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'Tom H', rating: 4, reviewText: 'Good app! Would love a sleep timer feature like some competitors have. Also the UI for podcasts could be improved.', platform: ReviewPlatform.IOS },
    { reviewerName: 'Anna S', rating: 5, reviewText: 'The collaborative playlist feature is amazing. My friends and I use it for road trips. Perfect for groups!', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'David W', rating: 2, reviewText: 'Login keeps failing on Android 13. I have to reinstall the app every 2 weeks just to log in. This is a known bug that hasn\'t been fixed in months.', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'Rachel G', rating: 3, reviewText: 'The UI redesign is confusing. I can\'t find my saved albums anymore. Need better navigation. YouTube Music is easier to use.', platform: ReviewPlatform.IOS },
    { reviewerName: 'Chris B', rating: 5, reviewText: 'Best audio quality on the market with lossless streaming. Worth every penny of the premium subscription.', platform: ReviewPlatform.IOS },
    { reviewerName: 'Priya N', rating: 1, reviewText: 'Ads are absolutely unbearable on the free tier. Every 2 songs, 3 ads. Considering switching to YouTube Music which has longer gaps.', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'Mark J', rating: 4, reviewText: 'Love the app but wish it had lyrics for more songs. Also a feature to import my iTunes library would be amazing.', platform: ReviewPlatform.IOS },
    { reviewerName: 'Sophie L', rating: 2, reviewText: 'Random songs keep getting added to my queue without permission. It\'s like autoplay is broken. Very annoying!', platform: ReviewPlatform.ANDROID },
    { reviewerName: 'Ryan P', rating: 5, reviewText: 'The podcast section has gotten so much better. The chapters feature and 2x speed playback are perfect for long commutes.', platform: ReviewPlatform.IOS },
  ];

  const reviews = sampleReviews.map((r) =>
    reviewRepo.create({
      ...r,
      appId: app.id,
      reviewDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }),
  );
  await reviewRepo.save(reviews);
  console.log('Created 15 sample reviews');

  const analysis = analysisRepo.create({
    appId: app.id,
    summary: 'Spotify\'s user base shows strong brand loyalty with 40% of reviews being 5-star, but significant frustration exists around technical bugs — particularly the shuffle algorithm, Android login failures, and offline mode reliability. Users on free tier express strong discontent with ad frequency, creating real churn risk to YouTube Music and Apple Music.',
    sentimentBreakdown: { positive: 47, neutral: 20, negative: 33 },
    prioritizedFixes: [
      {
        rank: 1,
        issue: 'Broken Shuffle Algorithm',
        description: 'The shuffle feature repeatedly plays the same 10-15 songs instead of randomizing from the full playlist, with multiple users reporting this across both platforms.',
        frequency: '~20% of negative reviews',
        severity: 'high',
        realWorldImpact: 'Users stop using the app for music discovery, defeating Spotify\'s core value proposition. Premium subscribers feel cheated.',
        suggestedFix: 'Implement Fisher-Yates shuffle algorithm server-side, with client-side seed randomization. Add user-facing "True Shuffle" toggle.',
        supportingReviews: [
          'It just keeps playing the same 10 songs over and over. Very frustrating.',
          'Shuffle is broken. Same songs every time.'
        ]
      },
      {
        rank: 2,
        issue: 'Android Login Failure Loop',
        description: 'Android 13 users report being unable to log in without reinstalling the app every 1-2 weeks. Token refresh appears broken.',
        frequency: '~15% of Android 1-2 star reviews',
        severity: 'critical',
        realWorldImpact: 'Users switch to competitors permanently after reinstalling 2-3 times. High-effort friction for a core flow.',
        suggestedFix: 'Audit token storage on Android 13 (Keystore API changes). Implement silent token refresh with fallback to web auth flow.',
        supportingReviews: [
          'Login keeps failing on Android 13. I have to reinstall the app every 2 weeks.',
          'Can\'t log in after update. Very frustrating.'
        ]
      },
      {
        rank: 3,
        issue: 'Offline Mode Unreliability for Premium Users',
        description: 'Premium subscribers report offline downloads randomly disappearing or offline mode failing to activate despite payment.',
        frequency: '~12% of premium user complaints',
        severity: 'critical',
        realWorldImpact: 'Direct revenue risk — premium users cite this as reason to cancel subscription. Core paid feature failure.',
        suggestedFix: 'Add download integrity verification on app launch. Implement automatic re-download if files are corrupted. Show clear offline status indicator.',
        supportingReviews: [
          'I\'m paying $10/month but offline mode randomly stops working.',
          'Premium features keep disappearing.'
        ]
      }
    ],
    nextFeatureIdeas: [
      {
        rank: 1,
        featureName: 'Sleep Timer',
        description: 'A built-in timer that automatically pauses music after a set duration, commonly used when falling asleep.',
        userDemand: 'high',
        whyValid: 'Multiple users explicitly compare Spotify unfavorably to competitors that have this feature. Simple to implement, high user satisfaction.',
        realWorldProblemIfNotAdded: 'Users switch to Apple Music or YouTube Music for this feature and may not return.',
        implementationComplexity: 'easy',
        supportingReviews: [
          'Would love a sleep timer feature like some competitors have.',
          'Please add a sleep timer! Switching to Apple Music for this.'
        ]
      },
      {
        rank: 2,
        featureName: 'iTunes/Local Library Import',
        description: 'Allow users to import their existing iTunes or local music library into Spotify playlists.',
        userDemand: 'medium',
        whyValid: 'Reduces switching friction for Apple ecosystem users migrating to Spotify. Competitors like YouTube Music support this.',
        realWorldProblemIfNotAdded: 'Users with large iTunes libraries won\'t switch to Spotify, limiting market expansion.',
        implementationComplexity: 'medium',
        supportingReviews: [
          'A feature to import my iTunes library would be amazing.',
          'Can\'t move my old playlists over.'
        ]
      }
    ],
    competitorMentions: [
      {
        competitorName: 'Apple Music',
        context: 'Users comparing battery usage favorably to Apple Music, and mentioning its sleep timer feature.',
        threatLevel: 'high'
      },
      {
        competitorName: 'YouTube Music',
        context: 'Mentioned as having lower ad frequency on free tier and easier navigation UI.',
        threatLevel: 'high'
      }
    ],
    rawPromptUsed: 'Sample analysis generated by seed script',
  });
  await analysisRepo.save(analysis);
  console.log('Created sample analysis');

  console.log('\n✅ Seed complete!');
  console.log('Login: demo@featurepulse.ai / demo1234');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
