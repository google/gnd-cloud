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

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { HttpParams } from '@angular/common/http';

/**
 * Exposes application state in the URL as streams to other services
 * and components, and provides methods for altering said state.
 */
@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private static readonly LAYER_ID_FRAGMENT_PARAM = 'l';
  private static readonly FEATURE_ID_FRAGMENT_PARAM = 'f';
  private static readonly FEATURE_LAYER_ID_FRAGMENT_PARAM = 'fl';
  private static readonly OBSERVATION_ID_FRAGMENT_PARAM = 'o';
  static readonly LAYER_ID_NEW = 'new';
  static readonly OBSERVATION_ID_NEW = 'new';
  static readonly PROJECT_ID_NEW = 'new';
  static readonly PROJECT_ID = 'projectId';
  static readonly PROJECT_SEGMENT = 'project';
  static readonly SIGN_IN_SEGMENT = 'signin';

  private static fragmentParamsToSideNavMode(params: HttpParams): SideNavMode {
    if (params.get(NavigationService.OBSERVATION_ID_FRAGMENT_PARAM)) {
      return SideNavMode.OBSERVATION;
    }
    if (params.get(NavigationService.FEATURE_ID_FRAGMENT_PARAM)) {
      return SideNavMode.FEATURE;
    }
    if (params.get(NavigationService.FEATURE_LAYER_ID_FRAGMENT_PARAM)) {
      return SideNavMode.FEATURE_LIST;
    }
    return SideNavMode.LAYER_LIST;
  }

  private activatedRoute?: ActivatedRoute;
  private projectId$?: Observable<string | null>;
  private layerId$?: Observable<string | null>;
  private featureId$?: Observable<string | null>;
  private observationId$?: Observable<string | null>;
  private sideNavMode$?: Observable<SideNavMode>;

  constructor(private router: Router) {}

  /**
   * Set up streams using provided route. This must be called before any of
   * the accessors are called.
   */
  init(route: ActivatedRoute) {
    this.activatedRoute = route;
    // Pipe values from URL query parameters.
    this.projectId$ = route.paramMap.pipe(
      map(params => params.get(NavigationService.PROJECT_ID))
    );
    // Pipe values from URL fragment.
    const fragmentParams$ = route.fragment.pipe(
      map(fragment => new HttpParams({ fromString: fragment || '' }))
    );
    this.layerId$ = fragmentParams$.pipe(
      map(params => params.get(NavigationService.LAYER_ID_FRAGMENT_PARAM))
    );
    this.featureId$ = fragmentParams$.pipe(
      map(params => params.get(NavigationService.FEATURE_ID_FRAGMENT_PARAM))
    );
    this.observationId$ = fragmentParams$.pipe(
      map(params => params.get(NavigationService.OBSERVATION_ID_FRAGMENT_PARAM))
    );
    this.sideNavMode$ = fragmentParams$.pipe(
      map(params => NavigationService.fragmentParamsToSideNavMode(params))
    );
  }

  getProjectId$(): Observable<string | null> {
    return this.projectId$!;
  }

  getLayerId$(): Observable<string | null> {
    return this.layerId$!;
  }

  getFeatureId$(): Observable<string | null> {
    return this.featureId$!;
  }

  getObservationId$(): Observable<string | null> {
    return this.observationId$!;
  }

  getSideNavMode$(): Observable<SideNavMode> {
    return this.sideNavMode$!;
  }

  /**
   * Returns the current URL fragment, parsed as if their were normal HTTP
   * query parameter key/value pairs.
   */
  private getFragmentParams(): HttpParams {
    const fragment = this.activatedRoute!.snapshot.fragment;
    return new HttpParams({ fromString: fragment || '' });
  }

  /**
   * Navigate to the current URL, replacing the URL fragment with the specified
   * params.
   */
  private setFragmentParams(params: HttpParams) {
    const primaryUrl = this.router
      .parseUrl(this.router.url)
      .root.children['primary'].toString();

    if (params.toString()) {
      const navigationExtras: NavigationExtras = {
        fragment: params.toString(),
      };
      this.router.navigate([primaryUrl], navigationExtras);
    } else {
      this.router.navigate([primaryUrl]);
    }
  }

  /**
   * Get current feature id in the URL fragment.
   */
  getFeatureId(): string | null {
    return this.getFragmentParams().get(
      NavigationService.FEATURE_ID_FRAGMENT_PARAM
    );
  }

  /**
   * Navigate to the current URL, updating the feature id in the URL fragment.
   */
  selectFeature(id: string) {
    const newParam: { [key: string]: string } = {};
    newParam[NavigationService.FEATURE_ID_FRAGMENT_PARAM] = id;
    this.setFragmentParams(new HttpParams({ fromObject: newParam }));
  }

  selectLayerFeature(id: string) {
    const newParam: { [key: string]: string } = {};
    newParam[NavigationService.FEATURE_LAYER_ID_FRAGMENT_PARAM] = id;
    this.setFragmentParams(new HttpParams({ fromObject: newParam }));
  }

  clearFeatureId() {
    this.setFragmentParams(new HttpParams({ fromString: '' }));
  }

  /**
   * Get current observation id in the URL fragment.
   */
  getObservationId(): string | null {
    return this.getFragmentParams().get(
      NavigationService.OBSERVATION_ID_FRAGMENT_PARAM
    );
  }

  /**
   * Navigate to the current URL, updating the observation id in the URL
   * fragment.
   */
  editObservation(featureId: string, observationId: string) {
    const newParam: { [key: string]: string } = {};
    newParam[NavigationService.FEATURE_ID_FRAGMENT_PARAM] = featureId;
    newParam[NavigationService.OBSERVATION_ID_FRAGMENT_PARAM] = observationId;
    this.setFragmentParams(new HttpParams({ fromObject: newParam }));
  }

  clearObservationId() {
    const newParam: { [key: string]: string } = {};
    newParam[
      NavigationService.FEATURE_ID_FRAGMENT_PARAM
    ] = this.getFeatureId()!;
    this.setFragmentParams(new HttpParams({ fromObject: newParam }));
  }

  /**
   * Navigate to the current URL, updating the layer id in the URL
   * fragment.
   */
  customizeLayer(id: string) {
    const newParam: { [key: string]: string } = {};
    newParam[NavigationService.LAYER_ID_FRAGMENT_PARAM] = id;
    this.setFragmentParams(new HttpParams({ fromObject: newParam }));
  }

  /**
   * Navigate to the URL with new project id.
   */
  selectProject(id: string) {
    this.router.navigateByUrl(`${NavigationService.PROJECT_SEGMENT}/${id}`);
  }

  /**
   * Navigate to the URL for new project creation.
   */
  newProject() {
    this.router.navigate([
      NavigationService.PROJECT_SEGMENT,
      NavigationService.PROJECT_ID_NEW,
    ]);
  }

  /**
   * Navigate to the URL for signin.
   */
  signIn() {
    this.router.navigate([NavigationService.SIGN_IN_SEGMENT]);
  }

  /**
   * Navigate to the URL for signout.
   */
  signOut() {
    this.router.navigate(['/']);
  }
}

export enum SideNavMode {
  LAYER_LIST = 1,
  OBSERVATION = 2,
  FEATURE = 3,
  FEATURE_LIST = 4,
}
