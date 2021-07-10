import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureListComponent } from './feature-list.component';

@NgModule({
  declarations: [FeatureListComponent],
  imports: [CommonModule],
  exports: [FeatureListComponent],
})
export class FeatureListModule {}
