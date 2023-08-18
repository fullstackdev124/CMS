import { NumberManRouting } from './numberman.routing';

import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IConfig, NgxMaskModule } from 'ngx-mask'
import { SharedModule  } from '@app/modules/client/shared/shared.module'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { FileUploadModule } from 'primeng/fileupload';
import { HttpClientModule } from '@angular/common/http';

import { NumberManComponent } from '@app/modules/client/numberman/numberman/numberman.component'
import {BlockUIModule} from "primeng/blockui";

const maskConfig: Partial<IConfig> = {
  validation: false
};

@NgModule({
    imports: [
        CommonModule,
        NgxMaskModule.forRoot(maskConfig),
        NumberManRouting,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        ToolbarModule,
        CheckboxModule,
        DropdownModule,
        InputTextModule,
        InputNumberModule,
        AutoCompleteModule,
        SelectButtonModule,
        ConfirmDialogModule,
        ProgressSpinnerModule,
        FileUploadModule,
        HttpClientModule,
        BlockUIModule
    ],
  declarations: [
    NumberManComponent,
  ]
})

export class NumberManModule {}
