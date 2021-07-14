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

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireModule } from '@angular/fire';
import {
  AngularFirestoreModule,
  SETTINGS as FIRESTORE_SETTINGS,
  USE_EMULATOR as USE_FIRESTORE_EMULATOR,
} from '@angular/fire/firestore';
import { AppRoutingModule } from './routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MainPageContainerModule } from './components/main-page-container/main-page-container.module';
import { environment } from '../environments/environment';
import { ProjectHeaderModule } from './components/project-header/project-header.module';
import { UserProfilePopupModule } from './components/user-profile-popup/user-profile-popup.module';
import { LayerDialogModule } from './components/layer-dialog/layer-dialog.module';
import { ShareDialogModule } from './components/share-dialog/share-dialog.module';
import { HttpClientModule } from '@angular/common/http';
import { firebase, firebaseui, FirebaseUIModule } from 'firebaseui-angular';
import { TitleDialogModule } from './components/title-dialog/title-dialog.module';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { CardViewProjectModule } from './components/card-view-project/card-view-project.module';
import { MatInputModule } from '@angular/material/input';

const firebaseUiAuthConfig: firebaseui.auth.Config = {
  // Popup is required to prevent some browsers and Chrome incognito for getting
  // blocked due to unsupported 3rd party cookies.
  signInFlow: 'popup',
  // For now we only use Google for auth.
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  // Required to enable one-tap sign-up credential helper.
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
};

@NgModule({
  declarations: [AppComponent],
  providers: [
    {
      provide: FIRESTORE_SETTINGS,
      useValue: { ignoreUndefinedProperties: true },
    },
    {
      provide: USE_FIRESTORE_EMULATOR,
      useValue: environment.useEmulators ? ['localhost', 8080] : undefined,
    },
  ],
  imports: [
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    FirebaseUIModule.forRoot(firebaseUiAuthConfig),
    HttpClientModule,
    MainPageContainerModule,
    ProjectHeaderModule,
    UserProfilePopupModule,
    LayerDialogModule,
    ShareDialogModule,
    MatInputModule,
    LayerDialogModule,
    MatCardModule,
    CardViewProjectModule,
    MatGridListModule,
    ShareDialogModule,
    TitleDialogModule,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
