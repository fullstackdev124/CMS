import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IConfig, NgxMaskModule } from 'ngx-mask';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CustomerRouting } from '@app/modules/client/customer/customer.routing';
import { CustomersComponent } from '@app/modules/client/customer/customers/customers.component';
import { CustomerAddComponent } from '@app/modules/client/customer/customer-add/customer-add.component';
import { CustomerEditComponent } from '@app/modules/client/customer/customer-edit/customer-edit.component';
import { CustomerDeleteComponent } from '@app/modules/client/customer/customer-delete/customer-delete.component';
import {PaginatorModule} from "primeng/paginator";
import {TableModule} from "primeng/table";
import {RippleModule} from "primeng/ripple";
import {TabViewModule} from "primeng/tabview";
import {InputMaskModule} from "primeng/inputmask";
import {BlockUIModule} from "primeng/blockui";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {DialogModule} from "primeng/dialog";
import {CheckboxModule} from "primeng/checkbox";

const maskConfig: Partial<IConfig> = {
  validation: false
};
@NgModule({
    imports: [
        CommonModule,
        ButtonModule,
        ToolbarModule,
        InputTextModule,
        InputNumberModule,
        ProgressSpinnerModule,
        ReactiveFormsModule,
        PaginatorModule,
        TableModule,
        RippleModule,
        FormsModule,
        TabViewModule,
        InputMaskModule,
        CustomerRouting,
        NgxMaskModule.forRoot(maskConfig),
        BlockUIModule,
        ConfirmDialogModule,
        DialogModule,
        CheckboxModule
    ],
  declarations: [
    CustomersComponent,
    CustomerAddComponent,
    CustomerEditComponent,
    CustomerDeleteComponent
  ]
})

export class CustomerModule {}
