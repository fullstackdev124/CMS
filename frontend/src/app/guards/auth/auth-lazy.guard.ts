import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router, CanLoad} from '@angular/router';
import { StoreService } from '@app/services/store/store.service';
import { ApiService } from '@app/services/api/api.service';
import {IUser, IUserToken} from '@app/models/user';
import {
  defaultAvatar, defaultDarkTheme, defaultLightTheme,
  defaultLogo,
  defaultQuickPages,
} from "@app/modules/client/default-ui-setting-values";
import {LayoutService} from "@services/app.layout.service";
import {MenuService} from "@services/app.menu.service";

@Injectable({
  providedIn: 'root'
})
export class AuthLazyGuard implements CanLoad {

  private activeUser: boolean;
  private token: IUserToken;
  private user: IUser

  constructor(private router: Router, private store: StoreService, private api: ApiService, private layoutService: LayoutService, private menuService: MenuService) {
    this.store.state$.subscribe(async (state) => {
      this.activeUser = !!state.user;
      this.token = state.token;
    });
  }

  public async canLoad() {
    // For more advanced checks, we can set 'data' to,
    // the app-routing.module and get it with next.data.role
    this.store.state$.subscribe(async (state) => {
      this.activeUser = !!state.user;
      this.user = state.user
      this.token = state.token
    });

    if (!!this.token) {
      await this.api.retrieveLoggedUserOb(this.token).subscribe((user) => {
        this.getUISettingFromUserInfo()
        return true;
      }, error => {
        this.router.navigateByUrl('auth/login');
        return false;
      }, () => {
      })

      return true;
    } else {
      this.router.navigateByUrl('auth/login');
      return false;
    }
  }

  getUISettingFromUserInfo = () => {
    let user = this.store.getUser()
    let uiSettings = JSON.parse(user.uiSettings)

    if (!uiSettings)
      uiSettings = {}

    if (uiSettings.customLogoImg == undefined || uiSettings.customLogoImg == '') {
      uiSettings.customLogoImg = defaultLogo
    }

    if (uiSettings.customAvatar == undefined || uiSettings.customAvatar == '') {
      uiSettings.customAvatar = defaultAvatar
    }

    if (uiSettings.customQuickPageEnables == undefined) {
      uiSettings.customQuickPageEnables = defaultQuickPages.map(page => {
        return page.isQuick
      })
    }

    if (uiSettings.darkTheme == undefined) {
      uiSettings.darkTheme = defaultDarkTheme
    }

    if (uiSettings.lightTheme == undefined) {
      uiSettings.lightTheme = defaultLightTheme
    }

    uiSettings.colorScheme = this.layoutService.config.colorScheme
    // if (uiSettings.colorScheme == undefined) {
    //   uiSettings.colorScheme = 'dark'
    // }

    delete uiSettings.customQuickPages

    user.uiSettings = JSON.stringify(uiSettings)
    this.store.storeUser(user)

    this.setUIWithSettingValue(uiSettings)
  }

  setUIWithSettingValue = (uiSettings) => {
    this.layoutService.applyTheme(uiSettings.colorScheme=='dark' ? uiSettings.darkTheme.key : uiSettings.lightTheme.key,
      uiSettings.colorScheme=='dark' ? uiSettings.darkTheme.mode : uiSettings.lightTheme.mode,
      uiSettings.colorScheme=='dark' ? uiSettings.darkTheme.pace : uiSettings.lightTheme.pace)
  }

}
