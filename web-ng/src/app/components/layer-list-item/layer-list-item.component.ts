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

import { Component, Input, OnInit } from '@angular/core';
import { Layer } from '../../shared/models/layer.model';
import { getPinImageSource } from '../map/ground-pin';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterService } from './../../services/router/router.service';

@Component({
  selector: 'ground-layer-list-item',
  templateUrl: './layer-list-item.component.html',
  styleUrls: ['./layer-list-item.component.css'],
})
export class LayerListItemComponent implements OnInit {
  @Input() layer: Layer | undefined;
  layerPinUrl: SafeUrl;
  readonly lang: string;

  constructor(
    private routerService: RouterService,
    private sanitizer: DomSanitizer
  ) {
    // TODO: Make dynamic to support i18n.
    this.lang = 'en';
    this.layerPinUrl = sanitizer.bypassSecurityTrustUrl(getPinImageSource());
  }

  ngOnInit() {
    this.layerPinUrl = this.sanitizer.bypassSecurityTrustUrl(
      getPinImageSource(this.layer?.color)
    );
  }

  ngOnChanges() {
    this.layerPinUrl = this.sanitizer.bypassSecurityTrustUrl(
      getPinImageSource(this.layer?.color)
    );
  }

  onCustomizeLayer() {
    if (this.layer?.id) {
      this.routerService.setLayerId(this.layer?.id);
    }
  }
}
