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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DataExportService } from './../../services/data-export/data-export.service';
import { DataStoreService } from './../../services/data-store/data-store.service';
import { LayerListItemComponent } from './layer-list-item.component';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { NavigationService } from './../../services/router/router.service';
import { of } from 'rxjs';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

describe('LayerListItemComponent', () => {
  let component: LayerListItemComponent;
  let fixture: ComponentFixture<LayerListItemComponent>;

  beforeEach(
    waitForAsync(() => {
      const navigationService = {
        getProjectId$: () => of(''),
        getFeatureId$: () => of(''),
      };

      TestBed.configureTestingModule({
        declarations: [LayerListItemComponent],
        imports: [MatIconModule, MatListModule, MatMenuModule, MatDialogModule],
        providers: [
          { provide: DataExportService, useValue: {} },
          { provide: DataStoreService, useValue: {} },
          { provide: NavigationService, useValue: navigationService },
          { provide: Router, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(LayerListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
