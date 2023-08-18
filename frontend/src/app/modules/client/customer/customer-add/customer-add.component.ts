import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '@services/api/api.service';
import { AnimationInterval, DEFAULT_PRIMARY_ADMIN_PASSWORD, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import { IUser } from '../../../../models/user';
import { StoreService } from '../../../../services/store/store.service';
import {ConfirmationService, MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";


@Component({
  selector: 'app-customer-add',
  templateUrl: './customer-add.component.html',
  styleUrls: ['./customer-add.component.scss'],
  providers: [ConfirmationService],
  animations: [
  ]
})

export class CustomerAddComponent implements OnInit {

  roles = [];

  username = null;
  languages = [];
  selectedRoleId = null;

  firstName = null;
  lastName = null;
  vatNumber = null;
  email = null;
  emailaccount = null;
  companyName = null;
  companyId = null;
  address = null;
  city = null;
  state = null;
  country = null;
  zip = null;
  phone = null;
  token = null;
  settings = null;

  blockContent = false

  constructor(public api: ApiService,
    public store: StoreService,
    public messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    public location: Location) { }

  async ngOnInit() {

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
        if (v.GuiSection.name == "Customer") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarning("You have no permission for this page")
        await new Promise<void>(resolve => { setTimeout(() => { resolve() }, NoPermissionAlertInteral) })
        this.location.back()
      }
    }

  }

  getRoles = () => {
    this.api.getRoles().subscribe(res => {
      this.roles = res;
      this.selectedRoleId = -1;
    });
  }

  handleChange = (event: any) => {
    this[event.target.name] = event.target.value;
  }

  checkValid = () => {
    if (!this.companyName) {
      return 'Please input company name!';
    }
    if (!this.companyId) {
      return 'Please input company ID!';
    }
    if (!this.email) {
      return 'Please input billing email!';
    }
    // if (!this.address) {
    //   return 'Please input address!';
    // }
    // if (!this.city) {
    //   return 'Please input city!';
    // }
    // if (!this.state) {
    //   return 'Please input state!';
    // }
    // if (!this.zip) {
    //   return 'Please input zip code!';
    // }
    // if (!this.phone) {
    //   return 'Please input phone number!';
    // }
    if (!this.firstName) {
      return 'Please input first name!';
    }
    if (!this.lastName) {
      return 'Please input last name!';
    }
    if (!this.emailaccount) {
      return 'Please input contact email!';
    }

    const emailValidator = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if (!this.email) {
      return 'Please fill email address!';
    }
    if (!emailValidator.test(this.email)) {
      return 'Please input a valid email address!';
    }

    return 'valid';
  }

  createCustomer = async () => {
    if (this.checkValid() === 'valid') {
      const adminGuiVisibilities = await new Promise<void>(resolve => {
        this.api.getGuiVisibilitiesByFilter(JSON.stringify({
          where: {
            roleId: 2
          }
        })).subscribe((res: any) => {
          resolve(res)
        });
      })

      const userGuiVisibilities = await new Promise<void>(resolve => {
        this.api.getGuiVisibilitiesByFilter(JSON.stringify({
          where: {
            roleId: 3
          }
        })).subscribe((res: any) => {
          resolve(res)
        });
      })

      const customer = {
        id: null,
        enabled: 1,
        balance: 0,
        billingEmail: this.email,
        contactEmail: this.emailaccount,
        firstName: this.firstName,
        lastName: this.lastName,
        vatNumber: this.vatNumber,
        companyName: this.companyName,
        companyId: this.companyId,
        address: this.address,
        city: this.city,
        state: this.state,
        country: this.country,
        zip: this.zip,
        phone: this.phone,
        token: this.token,
        settings: this.settings,
        isPostpaid: false,
      };

      this.blockContent = true
      this.api.addCustomer(customer).subscribe(res => {
        if (!res || !res.id) {
          this.showWarning('Error creating user, please check input and try again!')
          return
        }
        const newCustomerId = res.id

        this.blockContent = false
        this.showSuccess('Customer successfully created!')

        let username = this.emailaccount
        if (this.emailaccount.indexOf("@")>-1)
          username = this.emailaccount.substring(0, this.emailaccount.indexOf("@"))

        this.confirmationService.confirm({
          message: "Do you want to add users both admin and user?",
          header: 'User Creation Confirmation',
          acceptIcon: 'pi pi-check',
          acceptLabel: 'Yes',
          accept: async () => {
            this.blockContent = true
            const adminRoleId = await new Promise<void>(resolve => {
              this.api.createRole({
                id: null,
                name: customer.companyName + " Admin",
                description: customer.companyName + " Administration Role",
                customerId: newCustomerId,
                created: new Date().toISOString()
              }).subscribe((res: any) => {
                resolve(res.id)
              });
            })

            // @ts-ignore
            adminGuiVisibilities.forEach(item => {
              const guiVisibility = {...item};
              item.id = null
              item.roleId = adminRoleId
              item.DashRole.id = adminRoleId

              this.api.createGuiVisibility(guiVisibility)
            })

            const userRoleId = await new Promise<void>(resolve => {
              this.api.createRole({
                id: null,
                name: customer.companyName + " User",
                description: customer.companyName + " Normal User Role",
                customerId: newCustomerId,
                created: new Date().toISOString()
              }).subscribe((res: any) => {
                resolve(res.id)
              });
            })

            // @ts-ignore
            userGuiVisibilities.forEach(item => {
              const guiVisibility = {...item};
              item.id = null
              item.roleId = userRoleId
              item.DashRole.id = userRoleId

              this.api.createGuiVisibility(guiVisibility)
            })

            const primaryAdminUser = {
              activated: 1,
              username: "admin-" + username,
              emailVerified: 1,
              email: "admin-" + this.emailaccount,
              firstName: this.firstName,
              lastName: this.lastName,
              // primaryAdmin: 0,
              languagesId: 1,
              timezone: '-00:00',
              password: DEFAULT_PRIMARY_ADMIN_PASSWORD,
              customerId: newCustomerId,
            }

            const primaryUser = {
              activated: 1,
              username: "user-" + username,
              emailVerified: 1,
              email: "user-" + this.emailaccount,
              firstName: this.firstName,
              lastName: this.lastName,
              // primaryAdmin: 0,
              languagesId: 1,
              timezone: '-00:00',
              password: DEFAULT_PRIMARY_ADMIN_PASSWORD,
              customerId: newCustomerId,
            }

            this.api.addUser(primaryAdminUser).subscribe(res => {
              this.api.createRoleMapping({
                principalId: res.id,
                principalType: "Administrator",
                roleId: adminRoleId,
                customerId: newCustomerId
              }).subscribe(() => {
              }, error => {
              }, () => {
              })

              this.api.addUser(primaryUser).subscribe(res => {
                this.api.createRoleMapping({
                  principalId: res.id,
                  principalType: "Administrator",
                  roleId: userRoleId,
                  customerId: newCustomerId
                }).subscribe((res) => {
                }, error => {
                }, () => {
                })

                this.blockContent = false
                this.router.navigateByUrl(RoutePath.user.users)
              }, error => {
                this.blockContent = false
                this.router.navigateByUrl(RoutePath.customer.customers)
              }, () => {
                this.blockContent = false
              });
            }, error => {
              this.blockContent = false
              // this.router.navigateByUrl(RoutePath.customer.customers)
            })

          },
          reject: () => {
            this.blockContent = true
            const primaryAdminUser = {
              activated: 1,
              email: this.emailaccount,
              emailVerified: 1,
              username: this.emailaccount,
              firstName: this.firstName,
              lastName: this.lastName,
              primaryAdmin: 1,
              languagesId: 1,
              timezone: '-00:00',
              password: DEFAULT_PRIMARY_ADMIN_PASSWORD,
              customerId: res.id,
            }

            this.api.addUser(primaryAdminUser).subscribe(userRes => {
              this.blockContent = false
              if (!userRes || !userRes.id) {
                this.showWarning('Error creating user')
                return
              }

              this.router.navigateByUrl(RoutePath.customer.customers)
            }, error => {
              this.blockContent = false
            }, () => {
              this.blockContent = false
            })
          },
          key: "confirmDialog"
        });

      }, error => {
        this.blockContent = false
      }, () => {
      });

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
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };
}
