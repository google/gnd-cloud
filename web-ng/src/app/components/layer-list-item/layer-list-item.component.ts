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

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DataExportService } from './../../services/data-export/data-export.service';
import { ImportDialogComponent } from '../import-dialog/import-dialog.component';
import { Layer } from '../../shared/models/layer.model';
import { getPinImageSource } from '../map/ground-pin';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DataStoreService } from '../../services/data-store/data-store.service';
import { NavigationService } from './../../services/router/router.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ground-layer-list-item',
  templateUrl: './layer-list-item.component.html',
  styleUrls: ['./layer-list-item.component.scss'],
})
export class LayerListItemComponent implements OnInit, OnDestroy {
  @Input() layer?: Layer;
  @Input() actionsType: LayerListItemActionsType =
    LayerListItemActionsType.MENU;
  projectId?: string | null;
  featureId?: string | null;
  layerPinUrl: SafeUrl;
  readonly lang: string;
  readonly layerListItemActionsType = LayerListItemActionsType;
  subscription: Subscription = new Subscription();

  constructor(
    private sanitizer: DomSanitizer,
    private confirmationDialog: MatDialog,
    private importDialog: MatDialog,
    private exportService: DataExportService,
    private router: Router,
    private dataStoreService: DataStoreService,
    private navigationService: NavigationService
  ) {
    // TODO: Make dynamic to support i18n.
    this.lang = 'en';
    this.layerPinUrl = sanitizer.bypassSecurityTrustUrl(getPinImageSource());
  }

  ngOnInit() {
    this.layerPinUrl = this.sanitizer.bypassSecurityTrustUrl(
      getPinImageSource(this.layer?.color)
    );
    this.subscription.add(
      this.navigationService.getFeatureId$().subscribe(id => {
        this.featureId = id;
      })
    );
    this.subscription.add(
      this.navigationService.getProjectId$().subscribe(id => {
        this.projectId = id;
      })
    );
  }

  ngOnChanges() {
    this.layerPinUrl = this.sanitizer.bypassSecurityTrustUrl(
      getPinImageSource(this.layer?.color)
    );
  }

  onCustomizeLayer() {
    if (this.layer?.id) {
      this.navigationService.setLayerId(this.layer?.id);
    }
  }

  onGoBackClick() {
    this.navigationService.setFeatureId(null);
  }

  onDeleteLayer() {
    const dialogRef = this.confirmationDialog.open(
      ConfirmationDialogComponent,
      {
        maxWidth: '500px',
        data: {
          title: 'Warning',
          message:
            'Are you sure you wish to delete this layer? Any associated data including all features and observations in this layer will be lost. This cannot be undone.',
        },
      }
    );

    dialogRef.afterClosed().subscribe(async dialogResult => {
      if (dialogResult) {
        await this.deleteLayer();
      }
    });
  }

  async deleteLayer() {
    await this.dataStoreService.deleteLayer(this.projectId!, this.layer!.id);
    this.onClose();
  }

  onClose() {
    return this.router.navigate([`p/${this.projectId}`]);
  }

  onImportCsv() {
    if (!this.projectId || !this.layer?.id) {
      return;
    }
    this.importDialog.open(ImportDialogComponent, {
      data: { projectId: this.projectId, layerId: this.layer?.id },
      maxWidth: '500px',
      maxHeight: '800px',
    });
  }

  onDownloadCsv() {
    try {
      this.exportService.downloadCsv(this.projectId!, this.layer!.id);
    } catch (error) {
      console.error(error);
      // TODO: Friendlier error message.
      alert('Export failed. See logs for details.');
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

export enum LayerListItemActionsType {
  MENU = 1,
  BACK = 2,
}
