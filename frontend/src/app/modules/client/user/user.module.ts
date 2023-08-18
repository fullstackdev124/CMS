import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { UserRoutingModule } from '@app/modules/client/user/user.routing';
import { UsersComponent } from '@app/modules/client/user/users/users.component';
import { UserAddComponent } from '@app/modules/client/user/user-add/user-add.component';
import { UserEditComponent } from '@app/modules/client/user/user-edit/user-edit.component';
import { UserDeleteComponent } from '@app/modules/client/user/user-delete/user-delete.component';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {PaginatorModule} from "primeng/paginator";
import {TableModule} from "primeng/table";
import {TabViewModule} from "primeng/tabview";
import {PasswordModule} from "primeng/password";
import {FileUploadModule} from "primeng/fileupload";
import {CheckboxModule} from "primeng/checkbox";
import {BlockUIModule} from "primeng/blockui";
import {AutoCompleteModule} from "primeng/autocomplete";

@NgModule({
    imports: [
        CommonModule,
        ButtonModule,
        ToolbarModule,
        InputTextModule,
        ColorPickerModule,
        PaginatorModule,
        TableModule,
        TabViewModule,
        PasswordModule,
        ProgressSpinnerModule,
        FileUploadModule,
        CheckboxModule,
        UserRoutingModule,
        ReactiveFormsModule,
        FormsModule,
        BlockUIModule,
        AutoCompleteModule,
    ],
  declarations: [
    UsersComponent,
    UserAddComponent,
    UserEditComponent,
    UserDeleteComponent
  ]
})

export class UserModule {}
