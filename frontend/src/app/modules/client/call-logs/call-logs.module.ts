import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallLogsRoutingModule } from '@app/modules/client/call-logs/call-logs.routing';
import { IConfig, NgxMaskModule } from 'ngx-mask';

import { CallLogsComponent } from './call-logs/call-logs.component';

import { SharedModule } from '@app/modules/client/shared/shared.module';

import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {ToggleButtonModule} from "primeng/togglebutton";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {PaginatorModule} from "primeng/paginator";
import {TableModule} from "primeng/table";
import {TabViewModule} from "primeng/tabview";
import {InputTextareaModule} from "primeng/inputtextarea";
import {InputMaskModule} from "primeng/inputmask";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {CalendarModule} from "primeng/calendar";

const maskConfig: Partial<IConfig> = {
  validation: false
};

@NgModule({
    imports: [
        CommonModule,
        ToolbarModule,
        ButtonModule,
        CheckboxModule,
        DropdownModule,
        ToggleButtonModule,
        FormsModule,
        InputTextModule,
        ReactiveFormsModule,
        InputTextareaModule,
        TableModule,
        TabViewModule,
        PaginatorModule,
        CallLogsRoutingModule,
        ProgressSpinnerModule,
        NgxMaskModule.forRoot(maskConfig),
        SharedModule,
        InputMaskModule,
        ConfirmDialogModule,
        CalendarModule
    ],
  declarations: [
    CallLogsComponent,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})

export class CallLogsModule {}
