import { Component, OnInit } from '@angular/core';
import {ApiService} from "@services/api/api.service";
import {MessageService} from "primeng/api";
import {Router} from "@angular/router";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  providers: [
  ]
})
export class ForgotPasswordComponent implements OnInit {

  selectedEmail = ''

  blockContent = false

  constructor(public api: ApiService,
              private routes: Router,
              private messageService: MessageService) {

  }

  ngOnInit(): void {
  }

  onForgotPassword = () => {
    if (this.selectedEmail=='') {
      this.showWarning("Please input email address to recover password")
      return
    }

    this.blockContent = true
    this.api.forgotPassword(this.selectedEmail).subscribe(res => {
      this.blockContent = false
      if (res) {
        this.showSuccess('Account successfully reset. Check given mailbox for instructions.')
        this.routes.navigateByUrl(RoutePath.auth.login);
      } else {
        this.showWarning('Unable to reset account. Contact an administrator for details.')
      }
    }, error => {
      this.blockContent = false
    }, () => {
      this.blockContent = false
    })
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
