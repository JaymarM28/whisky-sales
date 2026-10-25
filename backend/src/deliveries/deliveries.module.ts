import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { PurchasesModule } from '../purchases/purchases.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PurchasesModule, InventoryModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
