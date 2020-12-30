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
import { ObservationFormComponent } from './observation-form.component';
import { Feature, LocationFeature } from '../../shared/models/feature.model';
import { never, of, Subject } from 'rxjs';
import { Project } from '../../shared/models/project.model';
import { List, Map } from 'immutable';
import { Observation } from '../../shared/models/observation/observation.model';
import { Response } from '../../shared/models/observation/response.model';
import firebase from 'firebase/app';
import { StringMap } from '../../shared/models/string-map.model';
import { Layer } from '../../shared/models/layer.model';
import { Option } from '../../shared/models/form/option.model';
import {
  MultipleChoice,
  Cardinality,
} from '../../shared/models/form/multiple-choice.model';
import { FieldType, Field } from '../../shared/models/form/field.model';
import { Form } from '../../shared/models/form/form.model';
import { AuditInfo } from '../../shared/models/audit-info.model';
import { FeatureService } from '../../services/feature/feature.service';
import { ProjectService } from '../../services/project/project.service';
import { ObservationService } from '../../services/observation/observation.service';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { LayerListItemModule } from '../layer-list-item/layer-list-item.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../shared/models/user.model';
import { NavigationService } from '../../services/router/router.service';

class MockModel {
  static element001: Field = new Field(
    'element001',
    FieldType.TEXT,
    StringMap({ en: 'Text Field' }),
    /*required=*/ true,
    0
  );

  static option001 = new Option(
    'option001',
    'code001',
    StringMap({ en: 'option 1' }),
    1
  );

  static option002 = new Option(
    'option002',
    'code002',
    StringMap({ en: 'option 2' }),
    2
  );

  static element002: Field = new Field(
    'element002',
    FieldType.MULTIPLE_CHOICE,
    StringMap({ en: 'Multiple Select' }),
    /*required=*/ true,
    0,
    new MultipleChoice(
      Cardinality.SELECT_MULTIPLE,
      List([MockModel.option001, MockModel.option002])
    )
  );

  static form001: Form = new Form(
    'form001',
    Map({
      element001: MockModel.element001,
      element002: MockModel.element002,
    })
  );

  static layer001 = new Layer(
    'layer001',
    1,
    'red',
    StringMap({ en: 'name' }),
    Map({ form001: MockModel.form001 })
  );

  static project001 = new Project(
    'project001',
    StringMap({ en: 'title' }),
    StringMap({ en: 'description' }),
    Map({ layer001: MockModel.layer001 }),
    /*acl=*/ Map({})
  );

  static feature001 = new LocationFeature(
    'feature001',
    MockModel.layer001.id,
    new firebase.firestore.GeoPoint(0.0, 0.0)
  );

  static user001 = {
    id: 'user001',
    email: 'email@gmail.com',
    isAuthenticated: false,
  };

  static observation001 = new Observation(
    'observation001',
    MockModel.feature001.id,
    MockModel.feature001.layerId,
    MockModel.form001,
    new AuditInfo(MockModel.user001, new Date(), new Date()),
    new AuditInfo(MockModel.user001, new Date(), new Date()),
    Map({
      element001: new Response('response'),
      element002: new Response(List([MockModel.option001])),
    })
  );
}

class MockProjectService {
  getActiveProject$() {
    return of<Project>(MockModel.project001);
  }
}

class MockFeatureService {
  getSelectedFeature$() {
    return of<Feature>(MockModel.feature001);
  }
}

class MockObservationService {
  getSelectedObservation$() {
    return of<Observation>(MockModel.observation001);
  }
}

const projectService = new MockProjectService();
const featureService = new MockFeatureService();
const observationService = new MockObservationService();

describe('ObservationFormComponent', () => {
  let component: ObservationFormComponent;
  let fixture: ComponentFixture<ObservationFormComponent>;
  const user$ = new Subject<User | null>();

  beforeEach(
    waitForAsync(() => {
      const navigationService = {
        getProjectId$: () => of(''),
        getFeatureId$: never,
      };
      const routerSpy = createRouterSpy();
      TestBed.configureTestingModule({
        declarations: [ObservationFormComponent],
        imports: [
          BrowserAnimationsModule,
          FormsModule,
          ReactiveFormsModule,
          MatFormFieldModule,
          MatButtonModule,
          MatFormFieldModule,
          MatInputModule,
          MatRadioModule,
          MatCheckboxModule,
          MatIconModule,
          MatListModule,
          LayerListItemModule,
        ],
        providers: [
          { provide: DataExportService, useValue: {} },
          { provide: DataStoreService, useValue: {} },
          { provide: FeatureService, useValue: featureService },
          { provide: ProjectService, useValue: projectService },
          { provide: ObservationService, useValue: observationService },
          { provide: Router, useValue: routerSpy },
          { provide: NavigationService, useValue: navigationService },
          { provide: AuthService, useValue: { user$ } },
        ],
        schemas: [NO_ERRORS_SCHEMA],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ObservationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

function createRouterSpy() {
  return jasmine.createSpyObj('Router', ['navigate']);
}
