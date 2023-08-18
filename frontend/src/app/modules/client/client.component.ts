import { Component, OnInit } from '@angular/core';
import {StoreService} from "@services/store/store.service";
import {LayoutService} from "@services/app.layout.service";
import {IUser, IUserToken} from "@app/models/user";
import {Observable, of} from "rxjs";
import {ApiService} from "@services/api/api.service";

@Component({
    selector: 'app-client',
    templateUrl: './client.component.html'
})
export class ClientComponent implements OnInit {

  token: IUserToken;
  activeUser: boolean;
  observuserCache: Observable<IUser>;

    constructor(private store: StoreService, private api: ApiService, private layoutService: LayoutService) { }

    ngOnInit(): void {

    }
    closeMenu() {
    }

}
