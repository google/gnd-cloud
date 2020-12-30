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

import { AuthService } from './../auth/auth.service';
import { DataExportService } from './data-export.service';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

describe('DataExportService', () => {
  let service: DataExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: {} },
        { provide: HttpClient, useValue: {} },
      ],
    });
    service = TestBed.inject(DataExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
