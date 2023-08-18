import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { SipGatewaysComponent } from '@app/modules/client/sipgateway/sipgateway/sipgateway.component'
import { SipGatewayAddComponent } from '@app/modules/client/sipgateway/sipgateway-add/sipgateway-add.component'
import { SipGatewayEditComponent } from '@app/modules/client/sipgateway/sipgateway-edit/sipgateway-edit.component'
import { SipGatewayDeleteComponent } from '@app/modules/client/sipgateway/sipgateway-delete/sipgateway-delete.component'
import { SipGatewayRouting } from '@app/modules/client/sipgateway/sipgateway.routing'

import { IConfig, NgxMaskModule } from 'ngx-mask'
import { SharedModule } from '@app/modules/client/shared/shared.module'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import {TableModule} from "primeng/table";
import {PaginatorModule} from "primeng/paginator";
import {TabViewModule} from "primeng/tabview";
import {MessagesModule} from "primeng/messages";
import {InputTextareaModule} from "primeng/inputtextarea";
import {BlockUIModule} from "primeng/blockui";
import {RadioButtonModule} from "primeng/radiobutton";
import {TooltipModule} from "primeng/tooltip";
import {OrderListModule} from "primeng/orderlist";
import { SipgatewayOrderComponent } from './sipgateway-order/sipgateway-order.component';
import {DragDropModule} from "primeng/dragdrop";
import {ConfirmDialogModule} from "primeng/confirmdialog";

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
    TableModule,
    PaginatorModule,
    TabViewModule,
    MessagesModule,
    InputTextareaModule,
    NgxMaskModule.forRoot(maskConfig),
    SipGatewayRouting,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    BlockUIModule,
    RadioButtonModule,
    OrderListModule,
    TooltipModule,
    DragDropModule,
    ConfirmDialogModule
  ],
  declarations: [
    SipGatewaysComponent,
    SipGatewayAddComponent,
    SipGatewayEditComponent,
    SipGatewayDeleteComponent,
    SipgatewayOrderComponent
  ]
})

export class SipGatewayModule {}
