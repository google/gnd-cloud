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

import { StringMap } from '../string-map.model';
import { MultipleChoice } from './multiple-choice.model';
import { Option } from '../form/option.model';

/**
 *
 * It converts in JavaScript to:
 * {
 *   1: "TEXT",
 *   2: "MULTIPLE_CHOICE",
 *   3: "PHOTO",
 *   4: "NUMBER",
 *   5: "DATE",
 *   6: "TIME",
 *   TEXT: 1,
 *   MULTIPLE_CHOICE: 2,
 *   PHOTO: 3,
 *   NUMBER: 4,
 *   DATE: 5,
 *   TIME: 6,
 * }
 *
 * So to convert string to enum use:
 *  var value = FieldType["TEXT"]
 * Because then:
 *  value == FieldType.TEXT
 */
export enum FieldType {
  TEXT = 1,
  MULTIPLE_CHOICE = 2,
  PHOTO = 3,
  NUMBER = 4,
  DATE = 5,
  TIME = 6,
}

// TODO: add a subclass of Field for each field type.
export class Field {
  constructor(
    readonly id: string,
    readonly type: FieldType,
    readonly label: StringMap,
    readonly required: boolean,
    readonly index: number,
    readonly multipleChoice?: MultipleChoice
  ) {}

  /**
   * For MULTIPLE_CHOICE fields, returns the option with the specified id.
   * Throws an Error if called for other field types.
   */
  getMultipleChoiceOption(optionId: string): Option {
    if (this.type !== FieldType.MULTIPLE_CHOICE) {
      throw Error(
        `Field ${this.id} of type ${FieldType[this.type]} has no options.`
      );
    }
    if (this.multipleChoice === undefined) {
      throw Error(`Field ${this.id} does not have choices defined.`);
    }
    const option = this.multipleChoice.options.find(o => o.id === optionId);
    if (!option) {
      throw Error(`Option ${optionId} not found in field ${this.id}.`);
    }
    return option;
  }
}
