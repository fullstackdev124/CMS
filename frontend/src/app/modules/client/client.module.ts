import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';

import { LeftmenuComponent } from './leftmenu/leftmenu.component';
import { SharedModule} from './shared/shared.module';

import {AppMenuitemComponent} from "@app/modules/client/leftmenu/menuitem.component";
import {MenuModule} from "primeng/menu";
import {ButtonModule} from "primeng/button";
import {RippleModule} from "primeng/ripple";
import {SplitButtonModule} from "primeng/splitbutton";
import {ToggleButtonModule} from "primeng/togglebutton";
import {PanelMenuModule} from "primeng/panelmenu";
import {TableModule} from "primeng/table";
import {ChartModule} from "primeng/chart";
import {SelectButtonModule} from "primeng/selectbutton";
import {AutoCompleteModule} from "primeng/autocomplete";
import {InputTextModule} from "primeng/inputtext";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {CountToModule} from "angular-count-to";
import {FooterComponent} from "@app/modules/client/footer/footer.component";
import {LayoutComponent} from "@app/modules/client/layout/layout.component";
import SoftPhoneComponent from "@app/modules/client/softphone/softphone.component";
import {SidebarModule} from 'primeng/sidebar';
import { InputMaskModule } from 'primeng/inputmask';

// FullCalendarModule.registerPlugins([ // register FullCalendar plugins
//   dayGridPlugin,
//   timeGridPlugin,
//   interactionPlugin
// ]);

// const maskConfig: Partial<IConfig> = {
//   validation: false
// };

@NgModule({
  imports: [
    CommonModule,
    ClientRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,

    // primeng component modules
    MenuModule,
    ButtonModule,
    RippleModule,
    SplitButtonModule,
    ToggleButtonModule,
    TableModule,
    PanelMenuModule,
    ChartModule,
    SelectButtonModule,
    AutoCompleteModule,
    InputTextModule,
    InputMaskModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    SidebarModule,
    // ---------------------------------
    CountToModule,
  ],
  declarations: [
    HeaderComponent,
    LeftmenuComponent,
    AppMenuitemComponent,
    FooterComponent,
    LayoutComponent,
    SoftPhoneComponent,
  ],
  providers: [],
  exports: [
    LeftmenuComponent,
    HeaderComponent,
    FooterComponent
  ]
})
export class ClientModule { }
