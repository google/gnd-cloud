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

import { Component, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Project } from '../../shared/models/project.model';
import {
  Feature,
  LocationFeature,
  GeoJsonFeature,
} from '../../shared/models/feature.model';
import {
  DrawingToolsService,
  EditMode,
} from '../../services/drawing-tools/drawing-tools.service';
import { ProjectService } from '../../services/project/project.service';
import { FeatureService } from '../../services/feature/feature.service';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { List } from 'immutable';
import { getPinImageSource } from './ground-pin';
import { NavigationService } from '../../services/router/router.service';
import { GoogleMap } from '@angular/google-maps';
import { firestore } from 'firebase/app';

// To make ESLint happy:
/*global google*/

const normalIconScale = 30;
const enlargedIconScale = 50;

@Component({
  selector: 'ground-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  features$: Observable<List<Feature>>;
  activeProject$: Observable<Project>;
  private initialMapOptions: google.maps.MapOptions = {
    center: new google.maps.LatLng(40.767716, -73.971714),
    zoom: 3,
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    mapTypeId: google.maps.MapTypeId.HYBRID,
  };
  private selectedMarker?: google.maps.Marker;
  private markers: google.maps.Marker[] = [];
  private crosshairCursorMapOptions: google.maps.MapOptions = {
    draggableCursor: 'crosshair',
  };
  private defaultCursorMapOptions: google.maps.MapOptions = {
    draggableCursor: '',
  };
  mapOptions: google.maps.MapOptions = this.initialMapOptions;

  @ViewChild(GoogleMap) map!: GoogleMap;

  constructor(
    private drawingToolsService: DrawingToolsService,
    private projectService: ProjectService,
    private featureService: FeatureService,
    private navigationService: NavigationService
  ) {
    this.features$ = this.featureService.getFeatures$();
    this.activeProject$ = this.projectService.getActiveProject$();
  }

  ngAfterViewInit() {
    this.subscription.add(
      combineLatest([
        this.activeProject$,
        this.features$,
      ]).subscribe(([project, features]) =>
        this.onProjectAndFeaturesUpdate(project, features)
      )
    );

    this.subscription.add(
      this.drawingToolsService
        .getEditMode$()
        .subscribe(editMode => this.onEditModeChange(editMode))
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  onProjectAndFeaturesUpdate(project: Project, features: List<Feature>) {
    this.clearMap();
    this.addMarkersAndGeoJsonsToMap(project, features);
    this.updateStylingFunctionForAllGeoJsons(project);
  }

  onEditModeChange(editMode: EditMode) {
    if (editMode !== EditMode.None) {
      this.selectMarker(undefined);
      this.navigationService.setFeatureId(null);
      for (const marker of this.markers) {
        marker.setClickable(false);
      }
    } else {
      for (const marker of this.markers) {
        marker.setClickable(true);
      }
    }
    this.mapOptions =
      editMode === EditMode.AddPoint
        ? this.crosshairCursorMapOptions
        : this.defaultCursorMapOptions;
  }

  onMapClick(event: google.maps.MouseEvent): Promise<void> {
    this.selectMarker(undefined);
    this.navigationService.setFeatureId(null);
    const editMode = this.drawingToolsService.getEditMode$().getValue();
    const selectedLayerId = this.drawingToolsService.getSelectedLayerId();
    if (!selectedLayerId) {
      return Promise.resolve();
    }
    switch (editMode) {
      case EditMode.AddPoint:
        return this.featureService.addPoint(
          event.latLng.lat(),
          event.latLng.lng(),
          selectedLayerId
        );
      case EditMode.AddPolygon:
        // TODO: Implement adding polygon.
        return Promise.resolve();
      case EditMode.None:
      default:
        return Promise.resolve();
    }
  }

  private clearMap() {
    this.deleteMarkers();
    this.clearGoogleMapDataLayer();
  }

  private deleteMarkers() {
    for (const marker of this.markers) {
      marker.setMap(null);
    }
    this.markers = [];
  }

  private clearGoogleMapDataLayer() {
    this.map.data.forEach(f => this.map.data.remove(f));
  }

  private addMarkersAndGeoJsonsToMap(
    project: Project,
    features: List<Feature>
  ) {
    features.forEach(feature => {
      if (feature instanceof LocationFeature) {
        this.addMarkerToMap(project, feature);
      }
      if (feature instanceof GeoJsonFeature) {
        this.addGeoJsonToMap(feature);
      }
    });
  }

  private addMarkerToMap(project: Project, feature: LocationFeature) {
    const color = project.layers.get(feature.layerId)?.color;
    const icon = {
      url: getPinImageSource(color),
      scaledSize: {
        width: normalIconScale,
        height: normalIconScale,
      },
    } as google.maps.Icon;
    const options: google.maps.MarkerOptions = {
      map: this.map._googleMap,
      position: new google.maps.LatLng(
        feature.location.latitude,
        feature.location.longitude
      ),
      icon,
      draggable: false,
      title: feature.id,
    };
    const marker = new google.maps.Marker(options);
    marker.addListener('click', () => {
      this.selectMarker(marker);
      this.navigationService.setFeatureId(feature.id);
    });
    marker.addListener('dragend', (event: google.maps.MouseEvent) => {
      const newFeature = new LocationFeature(
        feature.id,
        feature.layerId,
        new firestore.GeoPoint(event.latLng.lat(), event.latLng.lng())
      );
      this.featureService.updatePoint(newFeature);
    });
    if (marker.getTitle() === this.selectedMarker?.getTitle()) {
      this.selectMarker(marker);
    }
    this.markers.push(marker);
  }

  private selectMarker(marker: google.maps.Marker | undefined) {
    if (marker === this.selectedMarker) {
      return;
    }
    if (marker) {
      this.setIconSize(marker, enlargedIconScale);
      marker.setDraggable(true);
    }
    if (this.selectedMarker) {
      this.setIconSize(this.selectedMarker, normalIconScale);
      this.selectedMarker.setDraggable(false);
    }
    this.selectedMarker = marker;
  }

  private setIconSize(marker: google.maps.Marker, size: number) {
    const icon = marker.getIcon() as google.maps.ReadonlyIcon;
    const newIcon = {
      url: icon.url,
      scaledSize: {
        width: size,
        height: size,
      },
    } as google.maps.Icon;
    marker.setIcon(newIcon);
  }

  private addGeoJsonToMap(feature: GeoJsonFeature) {
    const addedFeatures = this.map.data.addGeoJson(feature.geoJson);
    // Set property 'layerId' so that it knows what color to render later.
    addedFeatures.forEach(f => {
      f.setProperty('layerId', feature.layerId);
    });
  }

  private updateStylingFunctionForAllGeoJsons(project: Project) {
    this.map.data.setStyle(mapFeature => {
      const layerId = mapFeature.getProperty('layerId');
      const color = project.layers.get(layerId)?.color;
      return {
        fillColor: color,
      };
    });
  }
}
