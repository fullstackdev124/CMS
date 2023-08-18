import { Component, OnInit } from '@angular/core';
import {ApiService} from '@app/services/api/api.service';
import { Router, ActivatedRoute} from "@angular/router";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-account-activate',
  templateUrl: './account-activate.component.html',
  styleUrls: ['./account-activate.component.scss']
})
export class AccountActivateComponent implements OnInit {

  token: string;
  name: string = 'User';
  submitted = false;

  blockContent = false

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      this.token = p.token;
      this.name = p.name;
    })
  }

  onActivate = () => {
    if (!this.token) return;
    this.submitted = true;
    this.blockContent = true
    this.api.accountActivate(this.token)
      .subscribe(res => {
        this.submitted = false;
        this.blockContent = false
        if (res) this.router.navigateByUrl(RoutePath.auth.login)
      }, error => {
        this.blockContent = false
      }, () => {
        this.blockContent = false
      })
  }

}
