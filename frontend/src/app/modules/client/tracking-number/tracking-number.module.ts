import { NgModule } from '@angular/core';
import {CommonModule, DecimalPipe} from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { TrackingNumberRoutingModule } from './tracking-number-routing.module';
import { TrackingComponent } from '@app/modules/client/tracking-number/tracking/tracking.component';
import { TrackingDeleteComponent } from '@app/modules/client/tracking-number/tracking-delete/tracking-delete.component';
import { IConfig, NgxMaskModule } from 'ngx-mask';
import { TrackingEditComponent } from '@app/modules/client/tracking-number/tracking-edit/tracking-edit.component';
import { TrackingAddComponent } from './tracking-add/tracking-add.component';

import { SharedModule } from '@app/modules/client/shared/shared.module';
import {TrackingSetupComponent} from "@app/modules/client/tracking-number/setup/tracking.setup.component";
import {TableModule} from "primeng/table";
import {PaginatorModule} from "primeng/paginator";
import {TabViewModule} from "primeng/tabview";
import {InputTextareaModule} from "primeng/inputtextarea";
import {DropdownModule} from "primeng/dropdown";
import {CheckboxModule} from "primeng/checkbox";
import {RippleModule} from "primeng/ripple";
import {MessagesModule} from "primeng/messages";
import {InputMaskModule} from "primeng/inputmask";
import {TooltipModule} from "primeng/tooltip";
import {BlockUIModule} from "primeng/blockui";
import {InputNumberModule} from "primeng/inputnumber";
import {AutoCompleteModule} from "primeng/autocomplete";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CalcPeriodUniquePercPipe} from "@app/helper/utils";
import {PhoneFormatPipe} from "@pipes/phone-format.pipe";

const maskConfig: Partial<IConfig> = {
  validation: false
};

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    ToolbarModule,
    InputTextModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    NgxMaskModule.forRoot(maskConfig),
    TrackingNumberRoutingModule,
    SharedModule,
    TableModule,
    TabViewModule,
    InputTextareaModule,
    DropdownModule,
    CheckboxModule,
    RippleModule,
    MessagesModule,
    PaginatorModule,
    TooltipModule,
    InputMaskModule,
    BlockUIModule,
    InputNumberModule,
    AutoCompleteModule,
    ReactiveFormsModule,
    FormsModule
  ],
  declarations: [
    TrackingComponent,
    TrackingEditComponent,
    TrackingDeleteComponent,
    TrackingAddComponent,
    TrackingSetupComponent
  ],
  providers: [PhoneFormatPipe]
})
export class TrackingNumberModule { }
