import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConfig, NgxMaskModule } from 'ngx-mask';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ReceivingNumbersComponent } from '@app/modules/client/receiving/receiving-numbers/receiving-numbers.component';
import { ReceivingAddComponent } from '@app/modules/client/receiving/receiving-add/receiving-add.component';
import { ReceivingEditComponent } from '@app/modules/client/receiving/receiving-edit/receiving-edit.component';
import { ReceivingDeleteComponent } from '@app/modules/client/receiving/receiving-delete/receiving-delete.component';
import { ReceivingRouting } from '@app/modules/client/receiving/receiving.routing';

import { SharedModule } from '@app/modules/client/shared/shared.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {TableModule} from "primeng/table";
import {RippleModule} from "primeng/ripple";
import {PaginatorModule} from "primeng/paginator";
import {TabViewModule} from "primeng/tabview";
import {InputMaskModule} from "primeng/inputmask";
import {InputTextareaModule} from "primeng/inputtextarea";
import {MessagesModule} from "primeng/messages";
import {CardModule} from "primeng/card";
import {TooltipModule} from "primeng/tooltip";
import {BlockUIModule} from "primeng/blockui";

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
        NgxMaskModule.forRoot(maskConfig),
        ReceivingRouting,
        SharedModule,
        FormsModule,
        TableModule,
        RippleModule,
        PaginatorModule,
        TabViewModule,
        InputMaskModule,
        InputTextareaModule,
        MessagesModule,
        CardModule,
        ReactiveFormsModule,
        TooltipModule,
        BlockUIModule
    ],
  declarations: [
    ReceivingNumbersComponent,
    ReceivingAddComponent,
    ReceivingEditComponent,
    ReceivingDeleteComponent
  ]
})

export class ReceivingModule {}
