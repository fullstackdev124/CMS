import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { RoleRouting } from '@app/modules/client/role/role.routing';
import { RolesComponent } from '@app/modules/client/role/roles/roles.component';
import { RoleAddComponent } from './role-add/role-add.component';
import { RoleEditComponent } from './role-edit/role-edit.component';
import { RoleDeleteComponent } from './role-delete/role-delete.component';

import {RippleModule} from "primeng/ripple";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TableModule} from "primeng/table";
import {PaginatorModule} from "primeng/paginator";
import {TabViewModule} from "primeng/tabview";
import {InputSwitchModule} from "primeng/inputswitch";
import {BlockUIModule} from "primeng/blockui";

@NgModule({
    imports: [
        CommonModule,
        ButtonModule,
        ToolbarModule,
        InputTextModule,
        RippleModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        PaginatorModule,
        TabViewModule,
        InputSwitchModule,
        ProgressSpinnerModule,
        RoleRouting,
        BlockUIModule,
    ],
  declarations: [
    RolesComponent,
    RoleAddComponent,
    RoleEditComponent,
    RoleDeleteComponent,
  ]
})

export class RoleModule {}
