import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { PolygonService } from './polygon.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [PolygonService],
  exports: [PolygonService]
})
export class BlockchainModule { }
