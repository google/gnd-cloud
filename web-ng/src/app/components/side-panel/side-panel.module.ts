/**
 * Copyright 2020 Google LLC
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

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SidePanelComponent } from './side-panel.component';
import { FeaturePanelModule } from '../feature-panel/feature-panel.module';
import { LayerListModule } from '../layer-list/layer-list.module';
import { ObservationFormModule } from '../observation-form/observation-form.module';
import { FeatureListModule } from '../feature-list/feature-list.module';

@NgModule({
  imports: [
    BrowserModule,
    FeaturePanelModule,
    LayerListModule,
    ObservationFormModule,
    FeatureListModule,
  ],
  exports: [SidePanelComponent],
  declarations: [SidePanelComponent],
})
export class SidePanelModule {}
