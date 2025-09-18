import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { LinksController } from './links.controller';
import { ContactModule } from './contact/contact.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // udostępnij process.env wszędzie
      envFilePath: ['.env'], // backend/.env
    }),
    ThrottlerModule.forRoot([
      { ttl: 60, limit: 20 }, // 20 żądań / minutę / IP
    ]),
    ContactModule,
  ], // <<< tu trafia moduł
  controllers: [
    AppController,
    HealthController,
    LinksController,
    // NIE dodawaj tu ContactController – on jest w ContactModule
  ],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
