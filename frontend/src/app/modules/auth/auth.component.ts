import {Component, OnDestroy, OnInit} from '@angular/core';
import {LayoutService} from "@services/app.layout.service";
import {Subscription} from "rxjs";
import {defaultDarkTheme, defaultLightTheme} from "@app/modules/client/default-ui-setting-values";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {

  scheme = 'dark'
  subscription: Subscription;

  constructor(private layoutService: LayoutService) {

  }

  ngOnInit(): void {
    this.scheme = this.layoutService.config.colorScheme
    this.subscription = this.layoutService.configUpdate$.subscribe(config => {
      this.scheme = config.colorScheme;
    });
  }

  ngOnDestroy() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  changeScheme() {
    this.layoutService.applyTheme(this.scheme=='dark' ? defaultLightTheme.key : defaultDarkTheme.key,
      this.scheme=='dark' ? defaultLightTheme.mode : defaultDarkTheme.mode,
      this.scheme=='dark' ? defaultLightTheme.pace : defaultDarkTheme.pace )
  }

}
