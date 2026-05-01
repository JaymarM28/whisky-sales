import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { SalesModule } from './sales/sales.module';
import { CommissionsModule } from './commissions/commissions.module';
import { InventoryModule } from './inventory/inventory.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ProductsModule,
    DeliveriesModule,
    SalesModule,
    CommissionsModule,
    InventoryModule,
    DashboardModule,
    ReportsModule,
    MailModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
