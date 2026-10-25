import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ForgotPinComponent } from './forgot-pin/forgot-pin.component';
import { ResetPinComponent } from './reset-pin/reset-pin.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'forgot-pin', component: ForgotPinComponent },
  { path: 'reset-pin', component: ResetPinComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
