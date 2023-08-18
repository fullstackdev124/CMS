import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { trigger, transition, query, style, animate } from '@angular/animations'
import { Router } from '@angular/router';
import { ApiService } from '@services/api/api.service';
import { timezones } from '@app/modules/client/user/user-edit/timezone';
import { StoreService } from '@services/store/store.service'

import {
  AnimationInterval,
  USER_TYPE_ADMINISTRATOR,
  USER_TYPE_NORMAL_USER,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral, DATE_FORMAT, WEEKEND_FORMAT
} from '../../constant';
import {catchError, map, mergeMap} from "rxjs/operators";
import {of} from "rxjs";
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-user-add',
  templateUrl: './user-add.component.html',
  styleUrls: ['./user-add.component.scss'],
  animations: [
    trigger('queryAnimation', [
      transition('* => loadingPageWithAnimation', [
        // hide the inner elements
        query('.section-body', style({opacity: 0})),

        // animate the inner elements in, one by one
        query('.section-body', animate(AnimationInterval, style({opacity: 1}))),
      ])
    ])
  ]
})

export class UserAddComponent implements OnInit {

  email = null;
  username = null;
  lastName = null;
  firstName = null;
  tzs = []
  selectedRoleId = 0;
  selectedCustomerId = 0;
  selectedTimezone = null;
  selectedLanguageId = null;
  selectedUserType = USER_TYPE_ADMINISTRATOR;
  languages = [];
  roles = [];
  showRoles = [];
  customers = [];
  user: any = {};

  timeFormats = DATE_FORMAT
  selectedDateFormat = "mm/dd/yyyy";

  weekendFormats = WEEKEND_FORMAT
  selectedWeekendFormat = 0;

  cmsUserType = CMSUserType

  userTypeAdministrator: string = USER_TYPE_ADMINISTRATOR;
  userTypeNormalUser: string = USER_TYPE_NORMAL_USER;

  tabIndex = 0
  selectedCustomer: any

  blockContent = false

  constructor(public api: ApiService,
              private router: Router,
              private messageService: MessageService,
              public store: StoreService,
              public location: Location
  ) {  }

  async ngOnInit() {
    this.tzs.push(	{
        "value": "",
        "offset": "",
        "text": "Auto Detect"
      },
    )
    this.tzs = this.tzs.concat(timezones)

    await new Promise<void>(resolve => {
      let mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval)

          resolve()
        }
      }, 100)
    })

    /**************************** permission checking *************************/
    if (this.store.getUserType() != CMSUserType.superAdmin) {
      let guiVisibility = this.store.getGuiVisibility()

      let permission = PERMISSION_TYPE_DENY
      for (let v of guiVisibility) {
        if (v.GuiSection.name == "User") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarning("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    /**************************** page started *************************/
    await this.getRoles()
    this.getAllCustomers()
    this.api.getLanguages().subscribe(languages => {
      this.languages = languages;
    }, e => {

    })
  }


  /**
   * get roles from backend
   */
  getRoles = async () => {
    await new Promise<void>(resolve => {
      try {
        this.api.getRoles().subscribe(res => {
          this.roles = res
          this.selectedRoleId = 0
          resolve()
        })
      } catch (e) { }
    })
  }

  /**
   * get all customers from backend
   */
  getAllCustomers = () => {
    if (this.store.getUserType() == CMSUserType.superAdmin) {
      this.api.getAllCustomerList().subscribe(res => {
        this.customers = res
      })
    } else {
      this.customers.push(this.store.getUser().Customer)
      this.selectedCustomer = this.store.getUser().Customer
      this.selectedCustomerId = this.store.getUser().customerId

      for (let role of this.roles) {
        if (role.customerId == this.selectedCustomerId) {
          this.showRoles.push(role)
        }
      }

      this.showRoles = [ ...this.showRoles ]
    }
  }

  /**
   *
   * @param event role select control
   */
  onRoleChange = (event: any) => {
    this.selectedRoleId = event;
  }

  /**
   *
   * @param event timezone control
   */
  onTimezoneChange = (event: any) => {
    this.selectedTimezone = event.value.offset;
  }

  /**
   *
   * @param event language control
   */
  onLanguageChange = (event: any) => {
    this.selectedLanguageId = event.value.id;
  }

  onDateChange = (event: any) => {
    this.selectedDateFormat = event.value.value;
  }

  onWeekendChange = (event: any) => {
    this.selectedWeekendFormat = event.value.value;
  }

  /**
   *
   * @param event common input control
   */
  handleChange = (event: any) => {
    this[event.target.name] = event.target.value;

    if (event.target.name === 'username') {
      this.api.isUserUnique('username', this.username).subscribe(unique => {
        if (!unique) {
          this.username = ''
          event.target.select()
          this.showWarning('Username ' + event.target.value + ' already taken')
        }
      }, e => {

      })
    }

    if (event.target.name === 'email') {
      this.api.isUserUnique('email', this.email).subscribe(unique => {
        if (!unique) {
          this.email = ''
          event.target.select()
          this.showWarning('Email ' + event.target.value + ' already taken')
        }
      }, e => {

      })
    }
  }

  /**
   * check validation
   */
  checkValid = () => {
    const emailValidator = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    if (!this.username || this.username.trim().length < 2) {
      return 'Please input user name!';
    }

    if (!this.email) {
      return 'Please fill email address!';
    }
    if (!emailValidator.test(this.email)) {
      return 'Please input a valid email address!';
    }

    if (!this.firstName || this.firstName == '') {
      return 'Please input first name!'
    }

    if (!this.lastName || this.lastName == '') {
      return 'Please input last name!'
    }

    if (!this.selectedCustomerId || this.selectedCustomerId <= 0) {
      return 'Please select a customer id!';
    }

    if (!this.selectedRoleId || this.selectedRoleId <= 0) {
        return 'Please select a valid user role!';
    }

    return 'valid';
  }

  /**
   * this is called at changing customer on the Assign Role & Customer Tab
   * @param id Customer Id
   */
  onCustomerSelect = (id: any) => {
    this.selectedCustomerId = parseInt(id)

    this.showRoles = []
    this.roles.map(role => {
      if (role.customerId == this.selectedCustomerId) {
        this.showRoles.push(role)
        this.showRoles = [ ...this.showRoles ]
      }
    })

  }

  /**
   * create user
   */
  createUser = () => {
    if (this.checkValid() === 'valid') {

      const user = {
        activated: 1,
        email: this.email,
        username: this.username,
        lastName: this.lastName,
        firstName: this.firstName,
        password: Math.random().toString(36).slice(-8),
        roleId: this.selectedRoleId == 0 ? null : this.selectedRoleId,
        timezone: this.selectedTimezone ? this.selectedTimezone.offset : '',
        languagesId: (this.selectedLanguageId) ? this.selectedLanguageId : 1,
        customerId: this.selectedCustomerId == 0 ? null : this.selectedCustomerId,
        uiSettings: JSON.stringify({
          timezone: this.selectedTimezone ? this.selectedTimezone.value : "",
          dateFormat: this.selectedDateFormat,
          weekendFormat: this.selectedWeekendFormat,
        }),
      }

      /*
      if (this.selectedTimezone) user.timezone = this.selectedTimezone;
      if (this.selectedLanguageId) user.languagesId = this.selectedLanguageId;
      */
      this.blockContent = true

      this.api.addUser(user).pipe(
        map(res => {
          if (!res || !res.id) {
            this.blockContent = false
            this.showWarning('Error creating user, please check input and try again!')
          } else {
            if (this.selectedRoleId) {
              const principal = {
                principalId: res.id,
                principalType: this.selectedUserType,
                roleId: this.selectedRoleId,
                customerId: this.selectedCustomerId
              };

              this.api.createRoleMapping(principal).subscribe(() => {
                this.blockContent = false
                this.showSucess('User successfully created!')
                this.router.navigateByUrl(RoutePath.user.users)
              }, error => {
                this.blockContent = false
              }, () => {
                this.blockContent = false
              })
            } else {
              this.blockContent = false
              this.showSucess('User successfully created!')
              this.router.navigateByUrl(RoutePath.user.users)
            }
          }
        }), catchError((_) => {
          this.blockContent = false
          return of(0);
        })
      ).toPromise()

    } else {
      this.showWarning(this.checkValid());
    }
  }

  showWarning = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSucess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };


}
