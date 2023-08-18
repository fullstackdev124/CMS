import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

export interface AppConfig {
  inputStyle: string;
  colorScheme: string;
  theme: string;
  pace: string,
  ripple: boolean;
  menuMode: string;
  scale: number;
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  profileSidebarVisible: boolean;
  configSidebarVisible: boolean;
  staticMenuMobileActive: boolean;
  menuHoverActive: boolean;
  // Whether the soft phone is displayed on the screen.
  softPhoneVisible: boolean;
  missedCalls: number;
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  config: AppConfig = {
    ripple: false,
    inputStyle: 'outlined',
    menuMode: 'static',
    colorScheme: 'dark',
    theme: 'md-dark-indigo',
    pace: 'yellow',
    scale: 13,
  };

  state: LayoutState = {
    staticMenuDesktopInactive: true,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    softPhoneVisible: false,
    missedCalls: 0,
  };

  private configUpdate = new Subject<AppConfig>();
  private stateUpdate = new Subject<LayoutState>();
  private overlayOpen = new Subject<any>();

  configUpdate$ = this.configUpdate.asObservable();
  stateUpdate$ = this.stateUpdate.asObservable();
  overlayOpen$ = this.overlayOpen.asObservable();

  onMenuToggle() {
    if (this.isOverlay()) {
      this.state.overlayMenuActive = !this.state.overlayMenuActive;
      if (this.state.overlayMenuActive) {
        this.overlayOpen.next(null);
      }
    }

    if (this.isDesktop()) {
      this.state.staticMenuDesktopInactive = !this.state.staticMenuDesktopInactive;
    } else {
      this.state.staticMenuMobileActive = !this.state.staticMenuMobileActive;

      if (this.state.staticMenuMobileActive) {
        this.overlayOpen.next(null);
      }
    }

    this.stateUpdate.next(this.state)
  }

  onOverlaySubmenuOpen() {
    this.overlayOpen.next(null);
  }

  showProfileSidebar() {
    this.state.profileSidebarVisible = !this.state.profileSidebarVisible;
    if (this.state.profileSidebarVisible) {
      this.overlayOpen.next(null);
    }
  }

  showConfigSidebar() {
    this.state.configSidebarVisible = true;
  }

  isOverlay() {
    return this.config.menuMode === 'overlay';
  }

  isDesktop() {
    return window.innerWidth > 991;
  }

  isSlim() {
    return this.config.menuMode === 'slim';
  }

  isMobile() {
    return !this.isDesktop();
  }

  onConfigUpdate() {
    this.configUpdate.next(this.config);
  }

  updateConfig(config: AppConfig) {
    this.config = config;
    this.configUpdate.next(config);
  }

  getConfig() {
    return this.config;
  }

  applyTheme(theme, scheme, pace) {
    const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
    const paceLink = <HTMLLinkElement>document.getElementById('pace-css');
    const newHref = themeLink.getAttribute('href')!.replace(this.config.theme, theme)
    const paceHref = paceLink.getAttribute('href')!.replace(this.config.pace, pace)

    this.replaceThemeLink(newHref, paceHref, () => {
      this.config.theme = theme;
      this.config.colorScheme = scheme;
      this.config.pace = pace
      this.onConfigUpdate();
    });
  }

  private replaceThemeLink(href: string, pace: string, onComplete: Function) {
    let loading = 0

    const id = 'theme-css';
    const themeLink = <HTMLLinkElement>document.getElementById(id);
    const cloneLinkElement = <HTMLLinkElement>themeLink.cloneNode(true);

    const pace_id = 'pace-css';
    const paceLink = <HTMLLinkElement>document.getElementById(pace_id);
    const paceCloneLinkElement = <HTMLLinkElement>paceLink.cloneNode(true);

    cloneLinkElement.setAttribute('href', href);
    cloneLinkElement.setAttribute('id', id + '-clone');

    paceCloneLinkElement.setAttribute('href', pace);
    paceCloneLinkElement.setAttribute('id', pace_id + '-clone');

    themeLink.parentNode!.insertBefore(cloneLinkElement, themeLink.nextSibling);
    paceLink.parentNode!.insertBefore(paceCloneLinkElement, paceLink.nextSibling);

    cloneLinkElement.addEventListener('load', () => {
      themeLink.remove();
      cloneLinkElement.setAttribute('id', id);

      loading++;
      if (loading==2)
        onComplete()
    });

    paceCloneLinkElement.addEventListener('load', () => {
      paceLink.remove();
      paceCloneLinkElement.setAttribute('id', pace_id);

      loading++;
      if (loading==2)
        onComplete()
    });
  }

  resetMenuForStatic() {
    setTimeout( () => {
      if (this.config.menuMode == 'static') {
        this.onMenuToggle()
      }
    }, 300 )
  }

  toggleSoftPhone() {
    this.state.softPhoneVisible = !this.state.softPhoneVisible;
    this.stateUpdate.next(this.state);
  }

  closeSoftPhone() {
    this.state.softPhoneVisible = false;
    this.stateUpdate.next(this.state);
  }

  showMissedCalls(calls: number) {
    this.state.missedCalls = calls
    this.stateUpdate.next(this.state);
  }

  getMissedCalls():number {
    return this.state.missedCalls
  }
}
