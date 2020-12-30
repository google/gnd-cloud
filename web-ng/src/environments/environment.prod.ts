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

import { googleMapsConfig } from './.google-maps-config';
import { firebaseConfig } from './.firebase-config';
import { offlineBaseMapSources } from './.backend-config.json';

// TODO(#376): For now, "prod" config will deploy to the developer's Firebase
// instance. In the future we will also allow separate configs for staging and
// production.
export const environment = {
  production: true,
  googleMapsApiKey: googleMapsConfig.apiKey,
  firebase: firebaseConfig,
  // Cloud Functions are accessed via local rewrite.
  cloudFunctionsUrl: '',
  offlineBaseMapSources,
  useEmulators: false,
};
