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

import { Component, Inject, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectService } from '../../services/project/project.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { Project } from '../../shared/models/project.model';
import { Layer } from '../../shared/models/layer.model';
import { Form } from '../../shared/models/form/form.model';
import { Subscription } from 'rxjs';
import { DataStoreService } from '../../services/data-store/data-store.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { FieldType, Field } from '../../shared/models/form/field.model';
import { StringMap } from '../../shared/models/string-map.model';
import { Option } from '../../shared/models/form/option.model';
import { MultipleChoice } from '../../shared/models/form/multiple-choice.model';
import { Cardinality } from '../../shared/models/form/multiple-choice.model';
import { Map } from 'immutable';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

const DEFAULT_LAYER_COLOR = '#ff9131';

export interface FieldTypeOptionModel {
  icon: string;
  label: string;
  type: FieldType;
}

export interface OptionModel {
  label: string;
  code: string;
}

export interface Question {
  label: string;
  fieldTypeOption: FieldTypeOptionModel;
  options: OptionModel[];
  required: boolean;
}

export interface FirestoreFieldModel {
  type: string;
  label: {
    en: string;
  };
  required: boolean;
  cardinality?: string;
  options?: FirestoreOptionModel[];
}

export interface FirestoreOptionModel {
  label: { en: string };
  code: string;
}

export interface QuestionGroupModel {
  label: string;
  fieldTypeOption: FieldTypeOptionModel;
  options?: FormArray;
  required: boolean;
}

@Component({
  selector: 'app-layer-dialog',
  templateUrl: './layer-dialog.component.html',
  styleUrls: ['./layer-dialog.component.css'],
})
export class LayerDialogComponent implements OnDestroy {
  lang: string;
  layerId: string;
  layer?: Layer;
  layerName!: string;
  projectId?: string;
  activeProject$: Observable<Project>;
  subscription: Subscription = new Subscription();
  layerForm: FormGroup;
  fields!: Map<string, Field> | {};
  fieldTypes = FieldType;
  fieldTypeOptions: FieldTypeOptionModel[] = [
    {
      icon: 'short_text',
      label: 'Text',
      type: FieldType.TEXT,
    },
    {
      icon: 'library_add_check',
      label: 'Select multiple',
      type: FieldType.MULTIPLE_CHOICE,
    },
  ];

  constructor(
    // tslint:disable-next-line:no-any
    @Inject(MAT_DIALOG_DATA) data: any,
    private dialogRef: MatDialogRef<LayerDialogComponent>,
    private projectService: ProjectService,
    private dataStoreService: DataStoreService,
    private router: Router,
    private formBuilder: FormBuilder,
    private confirmationDialog: MatDialog
  ) {
    this.lang = 'en';
    // Disable closing on clicks outside of dialog.
    dialogRef.disableClose = true;
    this.layerId = data.layerId;
    this.activeProject$ = this.projectService.getActiveProject$();
    this.layerForm = this.formBuilder.group({
      questions: this.formBuilder.array([this.createQuestionGroup()]),
    });
    this.subscription.add(
      this.activeProject$.subscribe(project => {
        this.onProjectLoaded(project);
      })
    );
  }

  createQuestionGroup() {
    return this.formBuilder.group({
      label: [''],
      required: [false],
      fieldTypeOption: new FormControl(this.fieldTypeOptions[0]),
    });
  }

  createOptionGroup() {
    return this.formBuilder.group({
      label: [''],
      code: [''],
    });
  }

  addQuestion() {
    const control = this.layerForm.controls['questions'] as FormArray;
    control.push(this.createQuestionGroup());
  }

  addOption(control: FormArray) {
    control.push(
      this.formBuilder.group({
        label: [''],
        code: [''],
      })
    );
  }

  deleteQuestion(event: MouseEvent, index: number) {
    event.preventDefault();
    const dialogRef = this.confirmationDialog.open(
      ConfirmationDialogComponent,
      {
        maxWidth: '500px',
        data: {
          title: 'Warning',
          message:
            'Are you sure you wish to delete this field? Any associated data will be lost. This cannot be undone.',
        },
      }
    );

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        const control = this.layerForm.controls['questions'] as FormArray;
        control.removeAt(index);
      }
    });
  }

  onProjectLoaded(project: Project) {
    if (this.layerId === ':new') {
      this.layerId = this.dataStoreService.generateId();
      this.layer = {
        id: this.layerId,
      };
    } else {
      this.layer = project.layers.get(this.layerId);
    }
    this.layerName = this.layer?.name?.get(this.lang) || '';
    this.setFields();
    if (this.fields && Object.keys(this.fields).length > 0) {
      this.setQuestions(Object.values(this.fields));
    }

    if (!this.layer) {
      throw Error('No layer exists');
    }
    this.projectId = project.id;
  }

  convertQuestionToTextField(fieldId: string, question: Question): Field {
    return new Field(
      fieldId,
      FieldType.TEXT,
      StringMap({
        en: question.label || '',
      }),
      question.required,
      /*multipleChoice=*/ undefined
    );
  }

  convertQuestionToMultipleChoiceField(
    fieldId: string,
    question: Question
  ): Field {
    let options = Map<string, Option>();
    question.options.forEach((option: OptionModel) => {
      const optionId = this.dataStoreService.generateId();
      options = options.set(optionId, {
        id: optionId,
        code: option.code || '',
        label: StringMap({
          en: option.label || '',
        }),
      });
    });
    return new Field(
      fieldId,
      FieldType.MULTIPLE_CHOICE,
      StringMap({
        en: question.label || '',
      }),
      question.required,
      new MultipleChoice(Cardinality.SELECT_MULTIPLE, options)
    );
  }

  convertQuestionToField(fieldId: string, question: Question): Field {
    switch (question.fieldTypeOption.type) {
      case FieldType.TEXT:
        return this.convertQuestionToTextField(fieldId, question);
      case FieldType.MULTIPLE_CHOICE:
        return this.convertQuestionToMultipleChoiceField(fieldId, question);
      default:
        throw Error(
          `Unexpected question type ${question.fieldTypeOption.type}`
        );
    }
  }

  onSave() {
    // TODO: Wait for project to load before showing dialog.
    if (!this.projectId) {
      throw Error('Project not yet loaded');
    }
    let fields = Map<string, Field>();
    this.layerForm.value.questions.forEach(
      (question: Question, index: number) => {
        const layerFieldId = this.fields && Object.keys(this.fields)[index];
        const fieldId = layerFieldId
          ? layerFieldId
          : this.dataStoreService.generateId();
        fields = fields.set(
          fieldId,
          this.convertQuestionToField(fieldId, question)
        );
      }
    );
    const form = this.getForms();
    const formId = form ? form.id : this.dataStoreService.generateId();
    const layer = new Layer(
      this.layerId,
      this.layer?.color || DEFAULT_LAYER_COLOR,
      // TODO: Make layerName Map
      StringMap({ [this.lang]: this.layerName }),
      this.layerForm.value.questions &&
      this.layerForm.value.questions.length > 0
        ? Map({
            [formId]: new Form(formId, fields),
          })
        : Map<string, Form>()
    );

    // TODO: Inform user layer was saved
    this.dataStoreService
      .updateLayer(this.projectId, layer)
      .then(() => this.onClose())
      .catch(err => {
        alert('Layer update failed.');
      });
  }

  onClose() {
    this.dialogRef.close();
    // TODO: refactor this path into a custom router wrapper
    return this.router.navigate([`p/${this.projectId}`]);
  }

  setLayerName(value: string) {
    this.layerName = value;
  }

  private getForms(): Form | undefined {
    const forms = this.layer?.forms;
    return forms ? forms.valueSeq().first() : undefined;
  }

  private setFields() {
    const form = this.getForms();
    if (form) {
      this.fields = DataStoreService.formToJS(form).fields;
    }
  }

  private setQuestions(fields: FirestoreFieldModel[]) {
    this.layerForm.setControl('questions', this.formBuilder.array([]));
    const control = this.layerForm.controls.questions as FormArray;
    fields.forEach((field: FirestoreFieldModel) => {
      const questionGroup: QuestionGroupModel = {
        label: field.label.en,
        required: field.required,
        fieldTypeOption: this.getFieldType(field.type),
      };
      if (field.type === 'multiple_choice') {
        questionGroup['options'] = this.setOptions(field);
      }
      control.push(this.formBuilder.group(questionGroup));
    });
  }

  private getFieldType(type: string) {
    return type === 'multiple_choice'
      ? this.fieldTypeOptions[1]
      : this.fieldTypeOptions[0];
  }

  private setOptions(field: FirestoreFieldModel) {
    if ('options' in field && field['options']) {
      const options = new FormArray([]);
      Object.values(field['options']).forEach(
        (option: FirestoreOptionModel) => {
          options.push(
            this.formBuilder.group({
              label: option.label.en,
              code: option.code,
            })
          );
        }
      );
      return options;
    }
    return undefined;
  }

  getFieldTypeByQuestion(index: number) {
    const questions = this.layerForm.get('questions');
    return questions?.value[index].fieldTypeOption;
  }

  onFieldTypeSelect(event: FieldTypeOptionModel, control: FormGroup) {
    if (event.type === 2) {
      control.addControl(
        'options',
        this.formBuilder.array([this.createOptionGroup()])
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
