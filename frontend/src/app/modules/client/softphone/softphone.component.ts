import { DOCUMENT } from "@angular/common";
import {Component, HostListener, Inject, OnDestroy, OnInit, Renderer2} from "@angular/core";
import { LayoutService } from "@app/services/app.layout.service";
import { StoreService } from "@app/services/store/store.service";
import { Subscription } from "rxjs";
import {MessageService} from "primeng/api";
import {EnvironmentLoaderService} from "@services/environment-loader.service";
import {environment} from "@env/environment";

// The JavaScript files that have to be loaded in order to have the soft phone work.
// FIXME: These should be included into the main application bundle.
const SOFTPHONE_JAVASCRIPT_ASSETS = [
  "/assets/plugin/phone/js/jquery.min.js",
  "/assets/plugin/phone/js/jquery-ui.min.js",
  "/assets/plugin/phone/js/jquery.md5-min.js",
  "/assets/plugin/phone/js/chart.bundle.js",
  "/assets/plugin/phone/js/croppie.min.js",
  "/assets/plugin/phone/js/fabric.min.js",
  "/assets/plugin/phone/js/moment-with-locales.min.js",
  "/assets/plugin/phone/js/strophe.umd.min.js",
  "/assets/plugin/phone/js/sip.min.js",
  "/assets/plugin/phone/js/phone.js",
];

// The CSS styles for the soft phone and its dependencies.
// FIXME: Add the softphone styles directly to the SCSS file.
const SOFTPHONE_CSS_ASSETS = [
  "/assets/plugin/phone/css/croppie.css",
  "/assets/plugin/phone/css/font-awesome.min.css",
  "/assets/plugin/phone/css/jquery-ui.min.css",
  "/assets/plugin/phone/css/normalize.css",
  "/assets/plugin/phone/css/phone.css",
  // "/assets/plugin/phone/css/roboto.css",
];

@Component({
  selector: "softphone",
  templateUrl: "./softphone.component.html",
  styleUrls: ["./softphone.component.scss"],
})
export default class SoftPhoneComponent implements OnInit, OnDestroy {
  visible = false;

  private layoutUpdateSubscription: Subscription;
  private softPhoneAssetsLoaded = false;

  constructor(
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private _document: Document,
    private layoutService: LayoutService,
    private storeService: StoreService,
    private messageService: MessageService,
    private environmentLoaderService: EnvironmentLoaderService,
  ) {}

  async ngOnInit() {
    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.storeService.getUser() && this.storeService.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    });

    await this.configurePhone();
    this.subscribeToLayoutEvent();

    this.loadCSSAssets();
    await this.loadJavascriptAssets();
  }

  ngOnDestroy() {
    console.log("SoftPhone OnDestroy")
    this.unsubscribeFromLayoutEvent();

    this.shutdownPhone()
    this.removeAssets()
    setTimeout(()=> {
      window.location.reload()
    }, 500)
  }

  private configurePhone() {
    let env = this.environmentLoaderService.getEnvConfig()
    if (env) {

    } else
      env = environment

    const user = this.storeService.getUser();
    globalThis.phoneOptions = {
      hostingPrefix: "/assets/plugin/phone/",
      userAgentStr: 'eCMS WebRTC SoftPhone',

      wssServer: env.softphone.server,
      WebSocketPort: env.softphone.port,
      ServerPath: env.softphone.path,
      ServerScheme: env.softphone.scheme,

      SipUsername: user.username,
      SipPassword: this.storeService.getPassword(),
      SipDomain: env.softphone.sipDomain + user.customerId,

      profileUser: user.username,
      profileName: user.firstName + ' ' + user.lastName,

      RegisterExpires: 3600,
      EnableAccountSettings: false,

      NotificationsActive: true,
      ShowCallAnswerWindow: true,
    };
  }


  private shutdownPhone() {
    // This is defined globally in the phone.js component, but we don't have type definitions for it.
    // @ts-ignore
    if (window.Unregister) {
      // @ts-ignore
      window.Unregister();
    }
  }

  private subscribeToLayoutEvent()  {
    this.layoutUpdateSubscription = this.layoutService.stateUpdate$.subscribe(state => {
        this.visible = state.softPhoneVisible;
    })
  }

  private unsubscribeFromLayoutEvent() {
    if (this.layoutUpdateSubscription)
      this.layoutUpdateSubscription.unsubscribe();
  }

  private loadCSSAssets() {
    SOFTPHONE_CSS_ASSETS.forEach((asset) => {
      const style = document.createElement("link");
      style.dataset.softphoneAsset = "true";
      style.rel = "stylesheet";
      style.type = "text/css";
      style.href = asset;

      this.renderer2.appendChild(this._document.body, style);
    });
  }

  private async loadJavascriptAssets() {
    const rootElement = this._document.documentElement;

    // Don't load the Javascript assets twice.
    // FIXME: This can cause multiple loads if the load is re-attempted before being finished.
    if (this.softPhoneAssetsLoaded) return;

    return new Promise<void>((resolve, reject) => {
      const onComplete = () => {
        this.softPhoneAssetsLoaded = true;
        resolve();
      };

      const onError = (event, source?, lineno?, colno?, error?: Error) => {
        reject(error);
      };

      // Here we serialize the loading of assets by wrapping callback functions inside each other.
      const loadAssets = SOFTPHONE_JAVASCRIPT_ASSETS.reverse().reduce<
        () => void
      >((innerCallback, asset) => {
        return () => {
          const script = document.createElement("script");
          script.src = asset;
          script.dataset.softphoneAsset = "true";
          script.onload = innerCallback;
          script.onerror = onError;

          this.renderer2.appendChild(this._document.body, script);
        };
      }, onComplete);

      loadAssets();
    });
  }

  private removeAssets() {
    this._document.querySelectorAll("[data-softphone-asset]").forEach(el => el.remove())
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


  @HostListener('window:toast.success', ['$event'])
  onToastSuccess(event): void {
  }

  @HostListener('window:badge.missed', ['$event'])
  onMissedCalls(event): void {
    // when missed call or not
    console.log("Have MIssed Call", event)
    this.layoutService.showMissedCalls(event.detail)
  }

}
