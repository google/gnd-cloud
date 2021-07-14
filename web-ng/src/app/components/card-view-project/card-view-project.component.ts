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

import { Component, OnDestroy, ElementRef, OnInit } from '@angular/core';

import { ProjectService } from '../../services/project/project.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UserProfilePopupComponent } from '../../components/user-profile-popup/user-profile-popup.component';
import { Project } from '../../shared/models/project.model';
import { NavigationService } from '../../services/navigation/navigation.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-card-view-project',
  templateUrl: './card-view-project.component.html',
  styleUrls: ['./card-view-project.component.scss'],
})
export class CardViewProjectComponent implements OnInit, OnDestroy {
  projects?: Project[];
  private subscription = new Subscription();
  breakpoint: number;

  constructor(
    public auth: AuthService,
    private projectService: ProjectService,
    private navigationService: NavigationService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.breakpoint = window.innerWidth <= 400 ? 1 : 6;
  }

  ngOnInit(): void {
    const allProjects = this.projectService.getAllProjects$();
    this.subscription.add(
      allProjects.subscribe(projects => {
        projects?.forEach(element => {
          const acl = this.projectService.getProjectAcl(element);
          const isValid = this.authService.canManageProject(acl);
          if (!isValid) {
            projects.splice(projects.indexOf(element), 1);
          }
        });
        this.projects = projects;
      })
    );
  }

  onProjectClicked(index: number) {
    this.navigationService.selectProject(this.projects![index].id);
  }

  onNewProject() {
    this.navigationService.newProject();
  }
  /**
   * Clean up Rx subscription when cleaning up the component.
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openProfileDialog(evt: MouseEvent): void {
    const target = new ElementRef(evt.currentTarget);
    this.dialog.open(UserProfilePopupComponent, {
      data: { trigger: target },
    });
  }

  onResize(event: any) {
    this.breakpoint = event.target.innerWidth <= 400 ? 1 : 6;
  }
}
