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

import {
  ComponentFixture,
  inject,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NEVER, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { ProjectService } from '../../services/project/project.service';
import { Map, List } from 'immutable';
import { CardViewProjectComponent } from './card-view-project.component';
import { UserProfilePopupComponent } from '../user-profile-popup/user-profile-popup.component';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Project } from '../../shared/models/project.model';
import { StringMap } from '../../shared/models/string-map.model';
import { Layer } from '../../shared/models/layer.model';
import { AclEntry } from '../../shared/models/acl-entry.model';
import { Role } from '../../shared/models/role.model';

@Component({ selector: 'gnd-header-layout', template: '' })
class HeaderLayoutComponent {}

describe('CardViewProjectComponent', () => {
  let component: CardViewProjectComponent;
  let fixture: ComponentFixture<CardViewProjectComponent>;
  const dialog: Partial<MatDialog> = {};
  const dialogRef: Partial<MatDialogRef<UserProfilePopupComponent>> = {};

  const mockProject1 = new Project(
    'project001',
    StringMap({ en: 'title1' }),
    StringMap({ en: 'description1' }),
    /* layers= */ Map({
      layer001: new Layer(
        'layer001',
        /* index */ -1,
        'red',
        StringMap({ en: 'name' }),
        /* forms= */ Map()
      ),
    }),
    /* acl= */ Map()
  );

  const mockProject2 = new Project(
    'project002',
    StringMap({ en: 'title2' }),
    StringMap({ en: 'description2' }),
    /* layers= */ Map({
      layer002: new Layer(
        'layer002',
        /* index */ -1,
        'green',
        StringMap({ en: 'name' }),
        /* forms= */ Map()
      ),
    }),
    /* acl= */ Map()
  );

  const projectServiceSpy = jasmine.createSpyObj('ProjectService', [
    'getAllProjects$',
    'getProjectAcl',
  ]);
  const authServiceSpy = jasmine.createSpyObj('AuthService', [
    'canManageProject',
  ]);

  beforeEach(
    waitForAsync(() => {
      const navigationService = {
        newProject: () => NEVER,
      };

      TestBed.configureTestingModule({
        imports: [
          MatCardModule,
          MatGridListModule,
          MatButtonModule,
          MatIconModule,
        ],
        declarations: [CardViewProjectComponent, HeaderLayoutComponent],
        providers: [
          { provide: MatDialog, useValue: dialog },
          { provide: MatDialogRef, useValue: dialogRef },
          { provide: ProjectService, useValue: projectServiceSpy },
          { provide: NavigationService, useValue: navigationService },
          { provide: AngularFirestore, useValue: {} },
          { provide: AngularFireAuth, useValue: {} },
          { provide: AuthService, useValue: authServiceSpy },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    projectServiceSpy.getAllProjects$.and.returnValue(
      of<Project[]>([mockProject1, mockProject2])
    );
    projectServiceSpy.getProjectAcl.and.returnValue([
      new AclEntry('test@gmail.com', Role.MANAGER),
    ]);
    authServiceSpy.canManageProject.and.returnValue(true);
    fixture = TestBed.createComponent(CardViewProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
