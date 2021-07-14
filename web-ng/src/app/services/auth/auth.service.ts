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

import { DataStoreService } from '../data-store/data-store.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { User } from './../../shared/models/user.model';
import { Injectable } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { shareReplay } from 'rxjs/operators';
import { NavigationService } from '../navigation/navigation.service';
import { AclEntry } from '../../shared/models/acl-entry.model';
import { Layer } from '../../shared/models/layer.model';
import { Project } from '../../shared/models/project.model';
import { Role } from '../../shared/models/role.model';

const ANONYMOUS_USER: User = {
  id: '',
  email: 'nobody',
  displayName: 'Anonymous user',
  isAuthenticated: false,
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user$: Observable<User>;
  private currentUser!: User;

  constructor(
    private afAuth: AngularFireAuth,
    dataStore: DataStoreService,
    private navigationService: NavigationService
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          return dataStore.user$(user.uid);
        } else {
          return of(null);
        }
      }),
      map(user => user || ANONYMOUS_USER),
      // Cache last authenticated user so that late subscribers will receive
      // it as well.
      shareReplay(1)
    );
    this.user$.subscribe(user => (this.currentUser = user));
  }

  getUser$(): Observable<User> {
    return this.user$;
  }

  isAuthenticated$(): Observable<boolean> {
    return this.getUser$().pipe(map(user => user.isAuthenticated));
  }

  getCurrentUser(): User {
    return this.currentUser;
  }

  async signIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await this.afAuth.signInWithPopup(provider);
  }

  async signOut() {
    await this.afAuth.signOut();
    return this.navigationService.signOut();
  }

  /**
   * Checks if a user has manager or owner level permissions of the project.
   */
  canManageProject(acl: AclEntry[]): boolean {
    const userEmail = this.currentUser?.email;
    return !!acl.find(entry => entry.email === userEmail && entry.isManager());
  }

  /**
   * Checks if a user can add points to a specific layer.
   */
  canUserAddPointsToLayer(project: Project, layer: Layer): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      return false;
    }
    const userRole: Role = project.acl.get(user.email)!;

    return (
      this.isManager(userRole) ||
      (this.isContributor(userRole) &&
        (layer.contributorsCanAdd?.includes('points') ?? false))
    );
  }

  isManager(role: Role): boolean {
    return [Role.OWNER, Role.MANAGER].includes(role);
  }

  isContributor(role: Role): boolean {
    return [Role.CONTRIBUTOR].includes(role);
  }
}
