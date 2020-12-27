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

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-option-editor',
  templateUrl: './option-editor.component.html',
  styleUrls: ['./option-editor.component.scss'],
})
export class OptionEditorComponent implements OnInit, OnChanges {
  @Input() code?: string;
  @Input() label?: string;
  @Input() index?: number;
  @Output() update = new EventEmitter();
  @Output() delete = new EventEmitter();

  optionGroup: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.optionGroup = this.formBuilder.group({
      code: [''],
      label: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // As the options fields value change we are emitting the updated value to the form-field-editor.
    this.optionGroup.valueChanges.subscribe(value => {
      this.update.emit({
        code: value.code,
        label: value.label,
      });
    });
  }

  ngOnChanges() {
    this.optionGroup.setValue({
      code: this.code,
      label: this.label,
    });
  }

  onDeleteOption(index: number) {
    this.delete.emit(index);
  }

  get labelControl() {
    return this.optionGroup.get('label')!;
  }
}
