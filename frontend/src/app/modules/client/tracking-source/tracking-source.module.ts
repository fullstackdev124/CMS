import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import {TrackingSourceRouting} from '@app/modules/client/tracking-source/tracking-source.routing';
import {TrackingSourcesComponent} from '@app/modules/client/tracking-source/tracking-sources/tracking-sources.component';
import {TrackingSourceEditComponent} from '@app/modules/client/tracking-source/tracking-source-edit/tracking-source-edit.component';
import {TrackingSourceNewComponent} from '@app/modules/client/tracking-source/tracking-source-new/tracking-source-new.component';
import {TrackingSourceDeleteComponent} from '@app/modules/client/tracking-source/tracking-source-delete/tracking-source-delete.component';

import {IConfig, NgxMaskModule} from 'ngx-mask'
import {TableModule} from "primeng/table";
import {PaginatorModule} from "primeng/paginator";
import {TabViewModule} from "primeng/tabview";
import {MessagesModule} from "primeng/messages";
import {InputTextareaModule} from "primeng/inputtextarea";
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
        TableModule,
        PaginatorModule,
        TabViewModule,
      ProgressSpinnerModule,
        MessagesModule,
        InputTextareaModule,
        NgxMaskModule.forRoot(maskConfig),
        TrackingSourceRouting,
        BlockUIModule,
    ],
  declarations: [
    TrackingSourcesComponent,
    TrackingSourceEditComponent,
    TrackingSourceNewComponent,
    TrackingSourceDeleteComponent
  ]
})

export class TrackingSourceModule {}
