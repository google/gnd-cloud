/**
 * Copyright 2021 Google LLC
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
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HeaderLayoutModule } from './../header-layout/header-layout.module';
import { CardViewProjectComponent } from './card-view-project.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { UserAvatarModule } from '../user-avatar/user-avatar.module';
import { InlineEditorModule } from '../inline-editor/inline-editor.module';
import { ProjectHeaderModule } from '../project-header/project-header.module';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [CardViewProjectComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    HeaderLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    ProjectHeaderModule,
    UserAvatarModule,
    MatCardModule,
    MatGridListModule,
    InlineEditorModule,
  ],
  exports: [CardViewProjectComponent],
})
export class CardViewProjectModule {}
