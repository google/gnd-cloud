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

import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Project } from '../../shared/models/project.model';
import {
  Feature,
  LocationFeature,
  GeoJsonFeature,
} from '../../shared/models/feature.model';
import { ProjectService } from '../../services/project/project.service';
import { FeatureService } from '../../services/feature/feature.service';
import { Observable, Subscription } from 'rxjs';
import { List } from 'immutable';
import { getPinImageSource } from './ground-pin';
import { RouterService } from '../../services/router/router.service';
import { GoogleMap } from '@angular/google-maps';

// To make ESLint happy:
/*global google*/

@Component({
  selector: 'ground-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, AfterViewInit {
  private subscription: Subscription = new Subscription();
  focusedFeatureId: string | null = null;
  features$: Observable<List<Feature>>;
  activeProject$: Observable<Project>;
  mapOptions: google.maps.MapOptions = {
    center: new google.maps.LatLng(40.767716, -73.971714),
    zoom: 3,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    mapTypeId: google.maps.MapTypeId.HYBRID,
  };

  @ViewChild(GoogleMap) map!: GoogleMap;

  constructor(
    private projectService: ProjectService,
    private featureService: FeatureService,
    private routerService: RouterService
  ) {
    this.features$ = this.featureService.getFeatures$();
    this.activeProject$ = this.projectService.getActiveProject$();
  }

  ngOnInit() {
    this.subscription.add(
      this.routerService.getFeatureId$().subscribe(id => {
        this.focusedFeatureId = id;
      })
    );
  }

  ngAfterViewInit() {
    this.features$.subscribe(features => {
      this.clearGoogleMapDataLayer();
      features.forEach(feature => {
        if (feature instanceof GeoJsonFeature) {
          const addedFeatures = this.map.data.addGeoJson(
            (feature as GeoJsonFeature).geoJson
          );
          addedFeatures.forEach(f => {
            f.setProperty('layerId', feature.layerId);
          });
        }
      });
    });

    this.activeProject$.subscribe(project =>
      this.map.data.setStyle(feature => {
        const layerId = feature.getProperty('layerId');
        const color = project.layers.get(layerId)?.color;
        return {
          fillColor: color,
        };
      })
    );
  }

  onMapClick(event: google.maps.MouseEvent): Promise<void> {
    if (this.focusedFeatureId) {
      // Deselect feature if selected.
      this.onFeatureClick(null);
      return Promise.resolve();
    } else {
      // Otherwise add a point at the clicked location.
      // TODO(#251): Remove once we implement the real "add point" flow.
      return this.featureService.addPoint(
        event.latLng.lat(),
        event.latLng.lng()
      );
    }
  }

  onFeatureClick(featureId: string | null) {
    this.routerService.setFeatureId(featureId);
  }

  isLocationFeature(feature: Feature) {
    return feature instanceof LocationFeature;
  }

  createMarkerOptions(
    feature: LocationFeature,
    focusedFeatureId: string,
    project: Project
  ): google.maps.MarkerOptions {
    // Icon is not yet an input for <map-marker>, this is the only way to change icon for now.
    // Consider break this down when more inputs are available for <map-marker>.
    const normalScale = 30;
    const enlargedScale = 50;
    const color = project.layers.get(feature.layerId)?.color;
    const icon = {
      url: getPinImageSource(color),
      scaledSize: {
        width: feature.id === focusedFeatureId ? enlargedScale : normalScale,
        height: feature.id === focusedFeatureId ? enlargedScale : normalScale,
      },
    } as google.maps.Icon;

    return {
      position: new google.maps.LatLng(
        feature.location.latitude,
        feature.location.longitude
      ),
      icon,
    } as google.maps.MarkerOptions;
  }

  private clearGoogleMapDataLayer() {
    this.map.data.forEach(f => this.map.data.remove(f));
  }
}
