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

import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { AuthService } from './../../services/auth/auth.service';
import { UserProfilePopupComponent } from '../../components/user-profile-popup/user-profile-popup.component';
import { MatDialog } from '@angular/material/dialog';
import { ProjectService } from '../../services/project/project.service';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-project-header',
  templateUrl: './project-header.component.html',
  styleUrls: ['./project-header.component.scss'],
})
export class ProjectHeaderComponent implements OnInit, OnDestroy {
  lang: string;
  title: string;
  projectId!: string;

  subscription: Subscription = new Subscription();
  constructor(
    public auth: AuthService,
    public navigationService: NavigationService,
    private dialog: MatDialog,
    private projectService: ProjectService
  ) {
    this.lang = 'en';
    this.title = '';
    const activeProject$ = this.projectService.getActiveProject$();
    this.subscription.add(
      activeProject$.subscribe(project => {
        this.title = project.title.get(this.lang)! || '';
        this.projectId = project.id;
      })
    );
  }

  ngOnInit() {}

  openProfileDialog(evt: MouseEvent): void {
    const target = new ElementRef(evt.currentTarget);
    this.dialog.open(UserProfilePopupComponent, {
      data: { trigger: target },
    });
  }

  /**
   * Updates the project title with input element value.
   *
   * @param evt the event emitted from the input element on blur.
   */
  updateProjectTitle(value: string): Promise<void> {
    if (value === this.title) return Promise.resolve();
    return this.projectService.updateTitle(this.projectId, value);
  }

  redirectMainPage(): void {
    this.navigationService.viewProjects();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
