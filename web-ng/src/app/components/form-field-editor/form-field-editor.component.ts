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
  SimpleChanges,
  OnDestroy,
  ViewChildren,
  QueryList,
  HostListener,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { DialogService } from '../../services/dialog/dialog.service';
import { FieldType } from '../../shared/models/form/field.model';
import { StringMap } from '../../shared/models/string-map.model';
import { Option } from '../../shared/models/form/option.model';
import { List } from 'immutable';
import {
  MultipleChoice,
  Cardinality,
} from '../../shared/models/form/multiple-choice.model';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { LayerService } from '../../services/layer/layer.service';
import { Subscription } from 'rxjs';
import { OptionEditorComponent } from '../option-editor/option-editor.component';

export interface FieldTypeSelectOption {
  icon: string;
  label: string;
  type: FieldType;
  cardinality?: Cardinality;
}

@Component({
  selector: 'app-form-field-editor',
  templateUrl: './form-field-editor.component.html',
  styleUrls: ['./form-field-editor.component.scss'],
})
export class FormFieldEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() label?: string;
  @Input() required?: boolean;
  @Input() fieldType?: FieldType;
  @Input() multipleChoice?: MultipleChoice;
  @Input() cardinality?: Cardinality;
  @Input() fieldCount?: Number;
  @Output() update = new EventEmitter();
  @Output() delete = new EventEmitter();
  formOptions: MultipleChoice | undefined;
  selectFieldOptions: FieldTypeSelectOption[];

  /** When expanded, options and actions below the fold are visible to the user. */
  expanded: boolean;

  /** Set to true when question gets focus, false when it loses focus. */
  selected: boolean;

  subscription: Subscription = new Subscription();

  formGroup: FormGroup;
  @ViewChild('questionInput', { static: true }) questionInput?: ElementRef;

  @HostListener('click')
  onFormFocus() {
    this.expanded = true;
    this.selected = true;
  }

  @HostListener('document:click')
  onFormBlur() {
    if (!this.selected) {
      this.expanded = false;
    }
    this.selected = false;
  }

  @ViewChildren(OptionEditorComponent)
  optionEditors?: QueryList<OptionEditorComponent>;

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private layerService: LayerService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.expanded = false;
    this.selected = false;
    this.selectFieldOptions = [
      {
        icon: 'short_text',
        label: 'Text',
        type: FieldType.TEXT,
      },
      {
        icon: 'radio_button_checked',
        label: 'Select One',
        type: FieldType.MULTIPLE_CHOICE,
        cardinality: Cardinality.SELECT_ONE,
      },
      {
        icon: 'library_add_check',
        label: 'Select multiple',
        type: FieldType.MULTIPLE_CHOICE,
        cardinality: Cardinality.SELECT_MULTIPLE,
      },
      {
        icon: 'photo',
        label: 'Photo',
        type: FieldType.PHOTO,
      },
      {
        icon: 'tag',
        label: 'Number',
        type: FieldType.NUMBER,
      },
      {
        icon: 'calendar_today',
        label: 'Date',
        type: FieldType.DATE,
      },
      {
        icon: 'access_time',
        label: 'Time',
        type: FieldType.TIME,
      },
    ];
    this.formGroup = this.formBuilder.group({
      label: ['', this.validateLabel.bind(this)],
      required: [false],
      // By default we set the select field to be of text type.
      selectFieldOption: this.selectFieldOptions[FieldType.TEXT],
    });
  }

  private validateLabel(control: FormControl): ValidationErrors | null {
    return this.isFormEmpty() ? null : Validators.required(control);
  }

  private isFormEmpty(): boolean {
    return (
      this.label?.trim().length === 0 &&
      this.fieldCount === 1 &&
      this.fieldType === FieldType.TEXT
    );
  }

  ngOnInit(): void {
    // As the form fields value change we are emitting the updated value to the layer-dialog.
    this.subscription.add(
      this.formGroup.valueChanges.subscribe(value => {
        this.update.emit({
          label: StringMap({ en: value.label }),
          required: value.required,
          type: value.selectFieldOption.type,
          multipleChoice: this.formOptions,
        });
      })
    );
  }

  /*
   * This method is used to get the updated values of field from the layer-dialog.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.multipleChoice) {
      this.formOptions = this.multipleChoice;
    }
    this.formGroup.setValue({
      label: this.label,
      required: this.required,
      selectFieldOption: this.getSelectedFieldTypeOption(),
    });
    this.markOptionEditorsTouched();
  }

  getSelectedFieldTypeOption(): FieldTypeSelectOption {
    const selectedOption = this.selectFieldOptions.find(
      option =>
        option.type === this.fieldType &&
        (option.type !== FieldType.MULTIPLE_CHOICE ||
          option.cardinality === this.cardinality)
    );
    if (!selectedOption) {
      throw new Error(`Unsupported field type${this.fieldType}`);
    }
    return selectedOption;
  }

  /**
   * Emits the delete field event to the layer dialog component.
   *
   * @returns void
   */
  onFieldDelete(): void {
    this.delete.emit();
  }

  getSelectFieldType(): FieldTypeSelectOption {
    return this.formGroup.get('selectFieldOption')?.value;
  }

  /**
   * Updates the type in the formGroup on the select change event.
   *
   * @param event: FieldTypeSelectOption
   * @returns void
   */
  onFieldTypeSelect(event: FieldTypeSelectOption): void {
    this.fieldType = event.type;
    this.cardinality = event.cardinality;
    if (this.cardinality && this.formOptions?.options) {
      this.formOptions = new MultipleChoice(
        this.cardinality,
        this.formOptions.options
      );
    }
    this.formGroup.patchValue({ selectFieldOption: event });
    if (event.type === FieldType.MULTIPLE_CHOICE) {
      if (!this.formOptions?.options?.size) {
        this.onAddOption();
      }
    } else {
      this.formOptions = undefined;
    }
  }

  /*
   * This is used to track input added or removed in case of field options.
   */
  trackByFn(index: number): number {
    return index;
  }

  /**
   * Emits event with updated Options. Called when label or code gets updated.
   *
   * @param event: label and code value of the option field.
   * @param index: index of the option to be updated.
   * @returns void
   */
  onOptionUpdate(event: { label: string; code: string }, index: number): void {
    const option = this.layerService.createOption(
      event.code,
      event.label,
      index
    );
    const options = this.setFormOptions(index, option);
    this.emitFormOptions(options);
  }

  onOptionDelete(index: number) {
    this.dialogService
      .openConfirmationDialog(
        'Warning',
        'Are you sure you wish to delete this option? ' +
          'Any associated data will be lost. This cannot be undone.'
      )
      .afterClosed()
      .toPromise()
      .then(dialogResult => {
        if (dialogResult) {
          let options = this.formOptions?.options;
          if (!options) return;
          options = options.delete(index);
          this.emitFormOptions(options);
        }
      });
  }

  onAddOption(): void {
    const index = this.formOptions?.options.size || 0;
    const option = this.layerService.createOption(
      /* code= */ '',
      /* label= */ '',
      index
    );
    const options = this.setFormOptions(index, option);
    this.emitFormOptions(options);
    this.focusNewOption();
  }

  setFormOptions(index: number, option: Option): List<Option> {
    let options = this.formOptions?.options || List<Option>();
    options = options?.set(index, option);
    return options;
  }

  emitFormOptions(options: List<Option>): void {
    const cardinality =
      this.formOptions?.cardinality ||
      this.cardinality ||
      Cardinality.SELECT_MULTIPLE;
    this.formOptions = new MultipleChoice(cardinality, options);
    this.update.emit({
      label: StringMap({ en: this.label }),
      required: this.required,
      type: this.fieldType,
      multipleChoice: this.formOptions,
    });
  }

  drop(event: CdkDragDrop<string[]>): void {
    if (!this.formOptions) return;
    let options = this.formOptions.options;
    const optionAtPrevIndex = options.get(event.previousIndex);
    if (!optionAtPrevIndex) return;

    options = options.delete(event.previousIndex);
    options = options.insert(event.currentIndex, optionAtPrevIndex);
    // Update indexes.
    options = options.map((option: Option, index: number) =>
      option.withIndex(index)
    );

    this.emitFormOptions(options);
  }

  get labelControl(): AbstractControl {
    return this.formGroup.get('label')!;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onLabelBlur(): void {
    this.labelControl.setValue(this.labelControl.value.trim());
  }

  private markOptionEditorsTouched(): void {
    this.optionEditors?.forEach(editor => {
      editor.optionGroup.markAllAsTouched();
    });
  }

  private focusNewOption(): void {
    this.cdr.detectChanges();
    if (this.optionEditors?.length) {
      const option = this.optionEditors.last;
      option?.optionInput?.nativeElement.focus();
    }
  }
}
