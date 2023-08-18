import {Component, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import { trigger, transition, query, style, animate} from '@angular/animations'
import {ApiService} from '@services/api/api.service';
import {StoreService} from '@services/store/store.service';
import {IUserToken, IUser} from '@app/models/user';
import {Observable, of, Subscription, throwError} from 'rxjs';
import {mergeMap, pluck, take, map, tap, filter} from 'rxjs/operators';
import { CMSUserType, USER_TYPE_ADMINISTRATOR, USER_TYPE_NORMAL_USER } from '../constant';
import {GuiVisibility} from '@app/models/gui';
import {NavigationEnd, Router} from "@angular/router";
import {LayoutService} from "@services/app.layout.service";
import {MenuService} from "@services/app.menu.service";
import {LeftmenuComponent} from "@app/modules/client/leftmenu/leftmenu.component";
import {MessageService} from "primeng/api";


@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy{
  token: IUserToken;
  activeUser: boolean;
  observuserCache: Observable<IUser>;

  overlayMenuOpenSubscription: Subscription;

  menuOutsideClickListener: any;

  @ViewChild(LeftmenuComponent) appSidebar!: LeftmenuComponent;

  private layoutUpdateSubscription: Subscription;
  callSidebarVisible = false;

  dialNumber: string = "";

  constructor(private menuService: MenuService,
              public messageService: MessageService,
              public layoutService: LayoutService, public renderer: Renderer2, public router: Router, private api: ApiService, private store: StoreService) {
    this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
      if (!this.menuOutsideClickListener) {
        this.menuOutsideClickListener = this.renderer.listen('document', 'click', event => {
          const isOutsideClicked = !(this.appSidebar.el.nativeElement.isSameNode(event.target) || this.appSidebar.el.nativeElement.contains(event.target)
            || event.target.classList.contains('p-trigger') || event.target.parentNode.classList.contains('p-trigger'));

          if (isOutsideClicked) {
            this.layoutService.state.profileSidebarVisible = false;
            this.layoutService.state.overlayMenuActive = false;
            this.layoutService.state.staticMenuMobileActive = false;
            this.layoutService.state.menuHoverActive = false;
            this.menuService.reset();
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
            this.unblockBodyScroll();
          }
          else {
            if (this.layoutService.state.staticMenuMobileActive) {
              this.blockBodyScroll();
            }
          }
        });
      }
    });

    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.unblockBodyScroll();
      });
  }

  ngOnInit(): void {
    const subscription = this.store.state$.pipe(
      map(state => {
        return { token: state.token, user: state.user };
      }),
      take(1),
      mergeMap(({token, user}) => {
        this.token = token;
        this.activeUser = !!user;
        console.log("Active user -----------------------", this.activeUser)
        if ((!!this.token && !this.activeUser) || !this.observuserCache ) {
          this.observuserCache = this.api.retrieveLoggedUserOb(this.token)
          //return this.observuserCache;
        }
        //else {
        //  return throwError(new Error('Cached user -- No need to retrieve Logged User'));
        //}
        return this.observuserCache;
      }),
      mergeMap((curUser) => {
        if (curUser.id === 1) {
          this.store.setUserType(CMSUserType.superAdmin);

        } else if (curUser.customerId != null) {
          this.api.hasPrimaryMethod().subscribe(res => {
            if (res && res.success==false) {
              this.showWarning("You have to setup Primary Payment method first!")
            }
          })

          if (curUser.primaryAdmin) {
            this.store.setUserType(CMSUserType.primaryAdmin);

          } else {
            if (curUser.DashRoleMapping && curUser.DashRoleMapping.length > 0) {
              if (curUser.DashRoleMapping[0].principalType === USER_TYPE_ADMINISTRATOR) {
                this.store.setUserType(CMSUserType.administrator);
              }
            }
          }
        }

        return this.retrieveGuiVisibilityOb(curUser);
      }),
    );

    subscription.subscribe((_) => {
      // TODO - apply user's ui settings
    }, error => {
    });

    this.subscribeToLayoutEvent();
  }

  public retrieveGuiVisibilityOb(user: IUser): Observable<GuiVisibility[]> {
    let result = of([]);
    if (user.DashRoleMapping && user.DashRoleMapping.length !== 0) {
      const filter = {
        where: {
          roleId: user.DashRoleMapping[0].roleId
        }
      };
      result = this.api.getGuiVisibilitiesByFilter(JSON.stringify(filter));
    }
    return result.pipe(tap(res => this.store.setGuiVisibility(res)));
  }

  blockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll');
    }
    else {
      document.body.className += ' blocked-scroll';
    }
  }

  unblockBodyScroll(): void {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll');
    }
    else {
      document.body.className = document.body.className.replace(new RegExp('(^|\\b)' +
        'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }

  get containerClass() {
    return {
      'layout-theme-light': this.layoutService.config.colorScheme === 'light',
      'layout-theme-dark': this.layoutService.config.colorScheme === 'dark',
      'layout-overlay': this.layoutService.config.menuMode === 'overlay',
      'layout-static': this.layoutService.config.menuMode === 'static',
      'layout-slim': this.layoutService.config.menuMode === 'slim',
      'layout-horizontal': this.layoutService.config.menuMode === 'horizontal',
      'layout-static-inactive': this.layoutService.state.staticMenuDesktopInactive && this.layoutService.config.menuMode === 'static',
      'layout-overlay-active': this.layoutService.state.overlayMenuActive,
      'layout-mobile-active': this.layoutService.state.staticMenuMobileActive,
      'p-input-filled': this.layoutService.config.inputStyle === 'filled',
      'p-ripple-disabled': !this.layoutService.config.ripple
    }
  }

  ngOnDestroy() {
    if (this.overlayMenuOpenSubscription) {
      this.overlayMenuOpenSubscription.unsubscribe();
    }

    if (this.menuOutsideClickListener) {
      this.menuOutsideClickListener();
    }

    this.unsubscribeFromLayoutEvent();
  }

  onHideSidebar() {
    this.layoutService.closeSoftPhone()
  }

  onDialNumberClicked(number) {
    if (this.dialNumber.length==10)
      return;

    this.dialNumber += number;
    this.dialNumber = this.dialNumber.replace(/-|_/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/ /g, '');
  }

  onDialNumberChanged(e) {
    let number = e.target.value;
    this.dialNumber = number.replace(/-|_/g, '').replace(/\(/g, '').replace(/\)/g, '').replace(/ /g, '');
  }

  private subscribeToLayoutEvent()  {
    this.layoutUpdateSubscription = this.layoutService.stateUpdate$.subscribe(state => {
        this.callSidebarVisible = state.softPhoneVisible;
    })
  }

  private unsubscribeFromLayoutEvent() {
    if (this.layoutUpdateSubscription)
      this.layoutUpdateSubscription.unsubscribe();
  }

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };
}
