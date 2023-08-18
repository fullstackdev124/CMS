import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from '@app/modules/client/dashboard/dashboard.component';
import { DashboardRouting } from '@app/modules/client/dashboard/dashboard.routing';
import { CountToModule } from 'angular-count-to';
import {ChartModule} from "primeng/chart";
import {SharedModule} from "@app/modules/client/shared/shared.module";
import {TableModule} from "primeng/table";
import {SelectButtonModule} from "primeng/selectbutton";
import {FormsModule} from "@angular/forms";
import {BlockUIModule} from "primeng/blockui";
import {ProgressSpinnerModule} from "primeng/progressspinner";
import {MultiSelectModule} from "primeng/multiselect";


@NgModule({
  imports: [
    CommonModule,
    CountToModule,
    ChartModule,
    TableModule,
    SharedModule,
    DashboardRouting,
    SelectButtonModule,
    FormsModule,
    BlockUIModule,
    ProgressSpinnerModule,
    MultiSelectModule
  ],
  declarations: [
    DashboardComponent
  ]
})

export class DashboardModule { }
