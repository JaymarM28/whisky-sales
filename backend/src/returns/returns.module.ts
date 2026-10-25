import { Module } from '@nestjs/common';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [InventoryModule, PurchasesModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
