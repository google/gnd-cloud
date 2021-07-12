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

import {
  Component,
  AfterViewInit,
  ViewChild,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { Project } from '../../shared/models/project.model';
import {
  Feature,
  LocationFeature,
  GeoJsonFeature,
  PolygonFeature,
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
import { NavigationService } from '../../services/navigation/navigation.service';
import { GoogleMap } from '@angular/google-maps';
import firebase from 'firebase/app';

// To make ESLint happy:
/*global google*/

const normalIconScale = 30;
const enlargedIconScale = 50;
const zoomedInLevel = 13;
const normalPolygonStrokeWeight = 3;
const enlargedPolygonStrokeWeight = 6;

@Component({
  selector: 'ground-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
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
  private polygons: google.maps.Polygon[] = [];
  private crosshairCursorMapOptions: google.maps.MapOptions = {
    draggableCursor: 'crosshair',
  };
  private defaultCursorMapOptions: google.maps.MapOptions = {
    draggableCursor: '',
  };
  mapOptions: google.maps.MapOptions = this.initialMapOptions;
  showRepositionConfirmDialog = false;
  newFeatureToReposition?: LocationFeature;
  oldLatLng?: google.maps.LatLng;
  newLatLng?: google.maps.LatLng;
  markerToReposition?: google.maps.Marker;
  disableMapClicks = false;

  @ViewChild(GoogleMap) map!: GoogleMap;

  constructor(
    private drawingToolsService: DrawingToolsService,
    private projectService: ProjectService,
    private featureService: FeatureService,
    private navigationService: NavigationService,
    private zone: NgZone,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.features$ = this.featureService.getFeatures$();
    this.activeProject$ = this.projectService.getActiveProject$();
  }

  ngAfterViewInit() {
    this.subscription.add(
      combineLatest([
        this.activeProject$,
        this.features$,
        this.navigationService.getFeatureId$(),
      ]).subscribe(([project, features, selectedFeatureId]) =>
        this.onProjectAndFeaturesUpdate(project, features, selectedFeatureId)
      )
    );

    this.subscription.add(
      this.drawingToolsService
        .getEditMode$()
        .subscribe(editMode => this.onEditModeChange(editMode))
    );

    this.subscription.add(
      combineLatest([
        this.navigationService.getFeatureId$(),
        this.navigationService.getObservationId$(),
      ]).subscribe(() => this.cancelReposition())
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async onMapClick(event: google.maps.MouseEvent) {
    if (this.disableMapClicks) {
      return;
    }
    this.selectMarker(undefined);
    const editMode = this.drawingToolsService.getEditMode$().getValue();
    const selectedLayerId = this.drawingToolsService.getSelectedLayerId();
    switch (editMode) {
      case EditMode.AddPoint: {
        if (!selectedLayerId) {
          return;
        }
        this.drawingToolsService.setEditMode(EditMode.None);
        const newFeature = await this.featureService.addPoint(
          event.latLng.lat(),
          event.latLng.lng(),
          selectedLayerId
        );
        if (newFeature) {
          this.navigationService.selectFeature(newFeature.id);
        }
        return;
      }
      case EditMode.AddPolygon:
        // TODO: Implement adding polygon.
        return;
      case EditMode.None:
      default:
        this.navigationService.clearFeatureId();
        return;
    }
  }

  private onProjectAndFeaturesUpdate(
    project: Project,
    features: List<Feature>,
    selectedFeatureId: string | null
  ): void {
    this.removeMarkersAndGeoJsonsOnMap(features);
    this.addFeaturesToMap(project, features);
    this.updateStylingFunctionForAllGeoJsons(project, selectedFeatureId);
    this.selectMarkerWithFeatureId(selectedFeatureId);
  }

  private removeMarkersAndGeoJsonsOnMap(features: List<Feature>) {
    const newFeatureIds: List<string> = features.map(f => f.id);
    this.removeMarkersOnMap(newFeatureIds);
    this.removeGeoJsonsOnMap(newFeatureIds);
    this.removePolygonOnMap(newFeatureIds);
  }

  private removeMarkersOnMap(newFeatureIds: List<string>) {
    for (let i = this.markers.length - 1; i >= 0; i--) {
      if (!newFeatureIds.contains(this.markers[i].getTitle()!)) {
        this.markers[i].setMap(null);
        this.markers.splice(i, 1);
      }
    }
  }

  private removeGeoJsonsOnMap(newFeatureIds: List<string>) {
    this.map.data.forEach(f => {
      if (!newFeatureIds.contains(f.getProperty('featureId'))) {
        this.map.data.remove(f);
      }
    });
  }

  private removePolygonOnMap(newFeatureIds: List<string>) {
    for (let i = this.polygons.length - 1; i >= 0; i--) {
      if (!newFeatureIds.contains(this.polygons[i].get('id'))) {
        this.polygons[i].setMap(null);
        this.polygons.splice(i, 1);
      }
    }
  }

  private addFeaturesToMap(project: Project, features: List<Feature>) {
    const locationFeatureIds = this.markers.map(m => m.getTitle());
    const geoJsonFeatureIds: String[] = [];
    const polygonFeatureIds = this.polygons.map(m => m.get('id'));
    this.map.data.forEach(f => {
      geoJsonFeatureIds.push(f.getProperty('featureId'));
    });
    this.map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
      const featureId = event.feature.getProperty('featureId');
      if (this.disableMapClicks) {
        return;
      }
      this.zone.run(() => {
        this.navigationService.selectFeature(featureId);
      });
    });

    features.forEach(feature => {
      if (!project.getLayer(feature.layerId)) {
        // Ignore features whose layer has been removed.
        console.debug(
          `Ignoring feature ${feature.id} with missing layer ${feature.layerId}`
        );
        return;
      }
      if (feature instanceof LocationFeature) {
        if (!locationFeatureIds.includes(feature.id)) {
          this.addMarkerToMap(project, feature);
        }
      }
      if (feature instanceof GeoJsonFeature) {
        if (!geoJsonFeatureIds.includes(feature.id)) {
          this.addGeoJsonToMap(feature);
        }
      }

      if (feature instanceof PolygonFeature) {
        if (!polygonFeatureIds.includes(feature.id)) {
          this.addPolygonToMap(project, feature);
        }
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
      map: this.map.googleMap,
      position: new google.maps.LatLng(
        feature.location.latitude,
        feature.location.longitude
      ),
      icon,
      draggable: false,
      title: feature.id,
    };
    const marker = new google.maps.Marker(options);
    marker.addListener('click', () => this.onMarkerClick(feature.id));
    marker.addListener('dragstart', (event: google.maps.MouseEvent) =>
      this.onMarkerDragStart(event, marker)
    );
    marker.addListener('dragend', (event: google.maps.MouseEvent) =>
      this.onMarkerDragEnd(event, feature)
    );
    this.markers.push(marker);
  }

  private onMarkerClick(featureId: string) {
    if (this.disableMapClicks) {
      return;
    }
    this.navigationService.selectFeature(featureId);
  }

  private onMarkerDragStart(
    event: google.maps.MouseEvent,
    marker: google.maps.Marker
  ) {
    // TODO: Show confirm dialog and disable other components when entering reposition state.
    // Currently we are figuring out how should the UI trigger this state.
    this.showRepositionConfirmDialog = true;
    this.disableMapClicks = true;
    this.drawingToolsService.setDisabled$(true);
    this.markerToReposition = marker;
    this.oldLatLng = new google.maps.LatLng(
      event.latLng.lat(),
      event.latLng.lng()
    );
    this.changeDetectorRef.detectChanges();
  }

  private onMarkerDragEnd(
    event: google.maps.MouseEvent,
    feature: LocationFeature
  ) {
    this.newLatLng = new google.maps.LatLng(
      event.latLng.lat(),
      event.latLng.lng()
    );
    this.newFeatureToReposition = new LocationFeature(
      feature.id,
      feature.layerId,
      new firebase.firestore.GeoPoint(event.latLng.lat(), event.latLng.lng())
    );
  }

  private panAndZoom(position: google.maps.LatLng | null | undefined) {
    if (!position) {
      return;
    }
    this.map.panTo(position);
    if (this.map.getZoom() < zoomedInLevel) {
      this.map.zoom = zoomedInLevel;
    }
  }

  private onEditModeChange(editMode: EditMode) {
    if (editMode !== EditMode.None) {
      this.navigationService.clearFeatureId();
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
    this.panAndZoom(marker?.getPosition());
  }

  private selectMarkerWithFeatureId(selectedFeatureId: string | null) {
    const markerToSelect = this.markers.find(
      marker => marker.getTitle() === selectedFeatureId
    );
    this.selectMarker(markerToSelect);
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
      f.setProperty('featureId', feature.id);
      f.setProperty('layerId', feature.layerId);
    });
  }

  private addPolygonToMap(project: Project, feature: PolygonFeature) {
    const color = project.layers.get(feature.layerId)?.color;
    const vertices: google.maps.LatLng[] = [];
    feature.polygonVertices.map(vertex => {
      vertices.push(new google.maps.LatLng(vertex.latitude, vertex.longitude));
    });

    const polygon = new google.maps.Polygon({
      paths: vertices,
      clickable: true,
      strokeColor: color,
      strokeOpacity: 1,
      strokeWeight: normalPolygonStrokeWeight,
      fillOpacity: 0,
    });

    polygon.set('id', feature.id);
    polygon.addListener('click', () => {
      polygon.setOptions({ strokeWeight: enlargedPolygonStrokeWeight });
      this.panAndZoom(vertices[0]);
      this.navigationService.selectFeature(feature.id);
    });
    if (this.map.googleMap !== undefined) {
      polygon.setMap(this.map.googleMap);
    }
    this.polygons.push(polygon);
  }

  private updateStylingFunctionForAllGeoJsons(
    project: Project,
    selectedFeatureId: string | null
  ) {
    this.map.data.setStyle(mapFeature => {
      const layerId = mapFeature.getProperty('layerId');
      const color = project.layers.get(layerId)?.color;
      const featureId = mapFeature.getProperty('featureId');
      const isSelefted = featureId === selectedFeatureId;
      return {
        fillOpacity: 0,
        strokeColor: color,
        strokeWeight: isSelefted
          ? enlargedPolygonStrokeWeight
          : normalPolygonStrokeWeight,
      };
    });
  }

  onSaveRepositionClick() {
    this.markerToReposition?.setPosition(this.newLatLng!);
    this.featureService.updatePoint(this.newFeatureToReposition!);
    this.resetReposition();
  }

  onCancelRepositionClick() {
    this.markerToReposition?.setPosition(this.oldLatLng!);
    this.resetReposition();
  }

  private resetReposition() {
    this.showRepositionConfirmDialog = false;
    this.newFeatureToReposition = undefined;
    this.oldLatLng = undefined;
    this.newLatLng = undefined;
    this.markerToReposition = undefined;
    this.disableMapClicks = false;
    this.drawingToolsService.setDisabled$(false);
  }

  private cancelReposition() {
    if (this.showRepositionConfirmDialog) {
      this.onCancelRepositionClick();
    }
  }
}
