import { Module } from '@nestjs/common';
import { LossesController } from './losses.controller';
import { LossesService } from './losses.service';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [InventoryModule, PurchasesModule],
  controllers: [LossesController],
  providers: [LossesService],
})
export class LossesModule {}
