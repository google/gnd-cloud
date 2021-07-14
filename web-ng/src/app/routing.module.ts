/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MainPageContainerComponent } from './components/main-page-container/main-page-container.component';
import { AuthGuard } from './services/auth/auth.guard';
import { SignInPageComponent } from './components/sign-in-page/sign-in-page.component';
import { NavigationService } from './services/navigation/navigation.service';
import { CardViewProjectComponent } from './components/card-view-project/card-view-project.component';

const routes: Routes = [
  {
    path: NavigationService.SIGN_IN_SEGMENT,
    component: SignInPageComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${NavigationService.PROJECT_SEGMENT}/:${NavigationService.PROJECT_ID}`,
    component: MainPageContainerComponent,
    canActivate: [AuthGuard],
  },
  {
    path: `${NavigationService.HOME_SEGMENT}`,
    component: CardViewProjectComponent,
    canActivate: [AuthGuard],
  },
];
const config = RouterModule.forRoot(routes, {
  relativeLinkResolution: 'legacy',
});

@NgModule({
  imports: [config],
  exports: [RouterModule],
})
export class AppRoutingModule {}
