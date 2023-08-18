import { IUser } from '@app/models/user';
import {Component, ElementRef, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '@services/store/store.service';
import { ApiService } from '@services/api/api.service';
import { closePanels } from '../utils'
import {defaultDarkTheme, defaultLightTheme, defaultQuickPages} from '../default-ui-setting-values';
import { CMSUserType, GUI_VISIBILITY_MATCH, PERMISSION_TYPE_DENY } from '../constant';
import revision from '@app/app.revision';
import {LayoutService} from "@services/app.layout.service";
import {MenuItem, MessageService} from "primeng/api";
import {isArray} from "util";
import {RoutePath} from "@app/app.routes";


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class HeaderComponent implements OnInit {

  @ViewChild('filterInput') filterInput: ElementRef
  title: any                  // title of project
  userId: number              // user id
  colorScheme = 'dark'     // theme mode (dark, light)
  user: IUser                 // user information
  quickPages = []             // quick page links
  avatar = ''                 // avatar image data(base64)
  logoImg = ''                // logo image data(base64)
  versionNumber = revision

  isSorted = false
  balance = 0;

  placeholder = "loading";

  cmsUserType = CMSUserType;
  menuItems!: MenuItem[];

  userInfo = {
    name: '',
    avatarName: '',
    email: '',
    role: 'Administrator',
    accountName: '',
    accountID: '',
    supportPIN: '',
    accountingType: 0,
  }

  constructor(private route: Router, private routerdata: ActivatedRoute, public store: StoreService, private api: ApiService, private messageService: MessageService, public layoutService: LayoutService) {
    this.title = route.url

    // debugger
    this.title = this.title.replace(/\//g, '')
    this.title = this.title.toUpperCase()
  }

  async ngOnInit() {
    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    this.routerdata.data.subscribe(d => {
      this.title = d.title
      this.title = this.title.replace(/\//g, '')
      this.title = this.title.toUpperCase()
    })

    // set theme mode and logo image
    this.store.state$.subscribe(async (state) => {
      if (state.token) {
        this.userId = state.token.userId
      }

      if (state.token && state.user && state.guiVisibility) {
        this.user = state.user

        this.userInfo.name = this.user.firstName + ' ' + this.user.lastName
        if (this.user.firstName.length>0)
          this.userInfo.avatarName = this.user.firstName.substr(0, 1);
        if (this.user.lastName.length>0)
          this.userInfo.avatarName += this.user.lastName.substr(0, 1);
        this.userInfo.email = this.user.email

        if (this.user.hasOwnProperty('Customer')) {
          this.userInfo.accountName = this.user.Customer.companyName
          this.userInfo.accountID = this.user.Customer.billingId==null ? "" : this.user.Customer.billingId
          this.userInfo.accountingType = this.user.Customer.accounting_type
        }

        if (this.user.hasOwnProperty('DashRoleMapping') && Array.isArray(this.user.DashRoleMapping) && this.user.DashRoleMapping.length>0
          && this.user.DashRoleMapping[0].hasOwnProperty('DashRole') )
          this.userInfo.role = this.user.DashRoleMapping[0].DashRole.name

        let uiSettings = JSON.parse(state.user.uiSettings)

        // Update Balance if any
        if(this.user.hasOwnProperty('Customer') && this.user.Customer.hasOwnProperty('balance'))
          this.balance = this.user.Customer['balance'];
        else
          this.balance = 0;

        // if the ui setting information of the user exists
        if (uiSettings) {
          // set custom logo image
          if (uiSettings.customLogoImg != undefined)
            this.logoImg = uiSettings.customLogoImg

          this.quickPages = JSON.parse(JSON.stringify(defaultQuickPages))    // quick page links

          // set quick page links
          if (uiSettings.customQuickPageEnables != undefined) {
            for (let i = 0; i < uiSettings.customQuickPageEnables.length; i++) {
              if (this.quickPages[i] != undefined)
                this.quickPages[i].isQuick = uiSettings.customQuickPageEnables[i]
            }
          }

          // check quickPages that belongs to the user's role permission
          if (this.store.getUserType() != CMSUserType.superAdmin) {
            for (let i = this.quickPages.length - 1; i >= 0; i--) {
              let permission = PERMISSION_TYPE_DENY
              if (this.user.DashRoleMapping && this.user.DashRoleMapping.length > 0) {
                for (let v of state.guiVisibility) {
                  if (GUI_VISIBILITY_MATCH[v.GuiSection.name] == this.quickPages[i].title) {
                    permission = v.GuiPermission.name
                    break
                  }
                }
              }

              if (permission == PERMISSION_TYPE_DENY)
                this.quickPages[i].isQuick = false
            }
          }

          let quickPages = JSON.parse(JSON.stringify(this.quickPages))
          await quickPages.sort((page1, page2) => page1.isQuick - page2.isQuick)
          this.quickPages = quickPages.filter(page => page.isQuick)

          // set custom avatar
          if (uiSettings.customAvatar != undefined)
            this.avatar = uiSettings.customAvatar

          if (uiSettings.colorScheme)
            this.colorScheme = uiSettings.colorScheme
        }

        this.menuItems = [
          {
            label: 'Account Settings', icon: 'pi pi-fw pi-user-edit', routerLink: '/service/user/edit/'+this.userId
          },
          // {
          //   label: 'Account Settings', icon: 'pi pi-fw pi-cog', routerLink: '/service/user/edit/' + this.userId
          // },
          {
            label: 'Billing Settings', icon: 'pi pi-fw pi-wallet', routerLink: '/service/billing/settings'
          },
          {
            label: this.colorScheme=='dark' ? 'Light Mode' : 'Dark Mode', icon: 'pi pi-fw pi-send', command: (event) => {this.toggleMode()}
          },
          {
            separator: true
          },
          {
            label: 'Sign Out', icon: 'pi pi-fw pi-sign-out', command: (event) => { this.onSignout(); }
          },
        ];
      }
    })

    // subscribe for balance update
    this.store.getBalance().subscribe((value: any) => {
      if(value)
        this.balance = value;
    })
  }

  toggleMode() {
    this.colorScheme = this.colorScheme=='dark' ? 'light' : 'dark'

    this.menuItems = [
      {
        label: 'Account Settings', icon: 'pi pi-fw pi-user-edit', routerLink: '/service/user/edit/'+this.userId
      },
      // {
      //   label: 'Account Settings', icon: 'pi pi-fw pi-cog', routerLink: '/service/user/edit/' + this.userId
      // },
      {
        label: 'Billing Settings', icon: 'pi pi-fw pi-wallet', routerLink: '/service/billing/settings'
      },
      {
        label: this.colorScheme=='dark' ? 'Light Mode' : 'Dark Mode', icon: 'pi pi-fw pi-send', command: (event) => {this.toggleMode()}
      },
      {
        separator: true
      },
      {
        label: 'Sign Out', icon: 'pi pi-fw pi-sign-out', command: (event) => { this.onSignout(); }
      },
    ];

    let uiSettings = JSON.parse(this.store.getUser().uiSettings)
    if (uiSettings == null) {
      uiSettings = {}
    }

    uiSettings.colorScheme = this.colorScheme

    let dark = defaultDarkTheme
    if (uiSettings.darkTheme != undefined) {
      dark = uiSettings.darkTheme
    }

    let light = defaultLightTheme
    if (uiSettings.lightTheme != undefined) {
      light = uiSettings.lightTheme
    }

    this.applyTheme(this.colorScheme=='dark' ? dark : light)

    this.user.uiSettings = JSON.stringify(uiSettings);
    this.store.storeUser(this.user);
    try {
      this.api.updateUser(this.user)
        .subscribe(
          res => {
            if (res) {
            } else {
            }
          });
    } catch (e) {
    }
  }

  applyTheme(theme) {
    this.layoutService.applyTheme(theme.key, theme.mode, theme.pace)
  }

  get isAdmin() {
    //return false;
    return (this.user && this.user.id==1)
  }

  /**
   * this is called when the user clicks sign out button
   */
  onSignout = () => {
    this.api.logout()
      .subscribe(res => {
        this.store.removeToken();
        this.store.removeUser();

        this.route.navigateByUrl(RoutePath.auth.login);
      }, err => {
        this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: err.error.message });
      });
  }



  onBalanceUpdate(event) {
  }

  /**
   * this is called when the user clicks the quick page icon
   */
  onClickQuickPage = () => {
    closePanels()
  }

  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  }
}
