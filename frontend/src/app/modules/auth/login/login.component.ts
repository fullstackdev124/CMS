import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "@app/services/api/api.service";
import { StoreService } from "@app/services/store/store.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { LayoutService } from "@app/services/app.layout.service";
import { MessageService } from "primeng/api";
import { RoutePath } from "@app/app.routes";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  providers: [],
})
export class LoginComponent implements OnInit {
  private localdb: Storage = window.localStorage;
  public submitted = false;
  loginForm: FormGroup;

  blockContent = false;

  constructor(
    private router: Router,
    private api: ApiService,
    private store: StoreService,
    private formBuilder: FormBuilder,
    private layoutService: LayoutService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    // if (this.localdb.getItem(DBKEYS.TOKEN) && JSON.parse(this.localdb.getItem(DBKEYS.TOKEN)).rememberedIf) {
    //   this.router.navigateByUrl(RouteNames.dashboard);
    // }
    // this.localdb.clear();

    this.loginForm = this.formBuilder.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
      rememberedIf: [false],
    });

    if (this.store.retrieveToken()!=null) {
      const token = this.store.retrieveToken()
      if (token.rememberedIf && token.id!=null && token.id!=""){
        await this.api.retrieveLoggedUserOb(token).subscribe((user) => {
          if (user)
            this.router.navigate([RoutePath.dashboard]);
          else
            this.localdb.clear()
        }, error => {
          this.localdb.clear()
        }, () => {
        })
      }
    }

    // this.store.state$.pipe(pluck('isLoginFailed'), take(1)).subscribe(isLoginFailed => {
    //   if (isLoginFailed) {
    //     this.submitted = false
    //     this.store.setIsLoginFailed(false)
    //   }
    // })

    this.store.state$.subscribe((state) => {
      if (state.isLoginFailed) {
        this.submitted = false;
        this.store.setIsLoginFailed(false);
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  showWarn = (msg: string) => {
    this.messageService.add({
      key: "tst",
      severity: "warn",
      summary: "Warning",
      detail: msg,
    });
  };
  showError = (msg: string) => {
    this.messageService.add({
      key: "tst",
      severity: "error",
      summary: "Error",
      detail: msg,
    });
  };
  showSuccess = (msg: string) => {
    this.messageService.add({
      key: "tst",
      severity: "success",
      summary: "Success",
      detail: msg,
    });
  };

  onLoginSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.blockContent = true;

    this.submitted = true;
    this.api
      .login(
        { username: this.f.username.value, password: this.f.password.value },
        this.f.rememberedIf.value
      )
      .subscribe(
        async (res) => {
          this.blockContent = false;

          // @ts-ignore
          if (res.statusCode && res.statusCode === 401) {
            // @ts-ignore
            this.showWarn(res.message);
            this.submitted = false;
            return;
          }

          if (res) {
            this.store.storePassword(this.f.password.value);
            await this.router.navigate([RoutePath.dashboard]);
          }

          this.showSuccess("User logged in successfully");
          this.submitted = false;
        },
        (err: any) => {
          this.blockContent = false;

          this.submitted = false;
        },
        () => {
          this.blockContent = false;
        }
      );
    // this.submitted = false;
  }
}
