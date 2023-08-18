import { Component, OnInit } from '@angular/core';
import {ApiService} from '@services/api/api.service';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';
import {ICustomer} from '@app/models/user';
import { trigger, transition, query, style, animate} from '@angular/animations'
import { AnimationInterval, CMSUserType, NoPermissionAlertInteral, PERMISSION_TYPE_DENY, PERMISSION_TYPE_ALL } from '../../constant';
import { StoreService } from '../../../../services/store/store.service';
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-customer-delete',
  templateUrl: './customer-delete.component.html',
  styleUrls: ['./customer-delete.component.scss'],
  animations: [
  ]
})
export class CustomerDeleteComponent implements OnInit {

  customers = [];
  user: any = {};
  users = [];
  roles = [];
  customer: ICustomer
  isDeleting = false

  constructor(public api: ApiService,
    public store: StoreService,
    public messageService: MessageService,
    public router: ActivatedRoute,
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

    /**************************** page started *************************/
    this.api.getCustomer(this.router.snapshot.params.id).subscribe(res => {
      this.customer = res;
    });
  }

  onRemoveCustomer = async () => {
    const filter = {
      where: {
        customerId: this.router.snapshot.params.id
      }
    }

    const filter1 = {
      where: {
        CustomerId: this.router.snapshot.params.id
      }
    }

    this.isDeleting = true

    // remove tickets
    await new Promise<void>(resolve => {
      this.api.deleteTicketsByWhere(JSON.stringify(filter.where)).subscribe(res => {
        resolve()

      })
    })

    // remove tickets
    await new Promise<void>(resolve => {
      this.api.deleteTicketsByWhere(JSON.stringify(filter.where)).subscribe(res => {
        resolve()

      })
    })

    // remove subscriptions
    await new Promise<void>(resolve => {
      this.api.deleteSubscriptionsByWhere(JSON.stringify(filter.where)).subscribe(res => {
        resolve()

      })
    })

    // remove documents
    await new Promise<void>(resolve => {
      this.api.deleteDocumentsByWhere(JSON.stringify(filter1.where)).subscribe(res => {
        resolve()

      })
    })

    // remove assets
    // await new Promise<void>(resolve => {
    //   this.api.getAssetsByFilter(JSON.stringify(filter)).subscribe(async results => {
    //     for (let el of results) {
    //       const assetFilter = {
    //         where: {
    //           assetId: el.id
    //         }
    //       }
    //
    //       // remove maintienance
    //       await new Promise<void>(subResolve => {
    //         this.api.deleteMainteinancesByWhere(JSON.stringify(assetFilter.where)).subscribe(res => {
    //           subResolve()
    //         })
    //       })
    //
    //       // remove assets
    //       await new Promise<void>(subResolve => {
    //         this.api.deleteAssetById(el.id).subscribe(res => {
    //           subResolve()
    //
    //         })
    //       })
    //     }
    //
    //     resolve()
    //   })
    // })

    // remove service providers
    // await new Promise<void>(resolve => {
    //   this.api.deleteServiceProvidersByWhere(JSON.stringify(filter1.where)).subscribe(res => {
    //     resolve()
    //
    //   })
    // })

    // update call logs customer id to 1
    // await new Promise<void>(resolve => {
    //   let updateInfo = {
    //     curCustomerId: this.router.snapshot.params.id,
    //     newCustomerId: 1
    //   }
    //   this.api.updateCallLogCustomer(updateInfo).subscribe(res => {
    //     resolve()
    //   })
    // })

    // update tracking sources customer id to 1
    await new Promise<void>(resolve => {
      let updateInfo = {
        curCustomerId: this.router.snapshot.params.id,
        newCustomerId: 1
      }
      this.api.updateTrackingSourceCustomer(updateInfo).subscribe(res => {

        resolve()
      })
    })

    // remove roles
    await new Promise<void>(resolve => {
      this.api.getRolesByFilter(JSON.stringify(filter)).subscribe(async roles => {
        for (let role of roles) {
          const roleFilter = {
            where: {
              roleId: role.id
            }
          }
          // remove role mappings
          await new Promise<void>(mappingResolve => {
            this.api.deleteRoleMappingByWhere(JSON.stringify(roleFilter.where)).subscribe(res => {
              mappingResolve()

            })
          })

          // remove gui visibilitys to remove roles
          await new Promise<void>(guiResolve => {
            this.api.deleteGuiVisibilityByWhere(JSON.stringify(roleFilter.where)).subscribe(res => {
              guiResolve()

            })
          })

          await new Promise<void>(roleResolve => {
            this.api.deleteRoleById(role.id).subscribe(res => {
              roleResolve()

            })
          })
        }

        // remove role mappings
        await new Promise<void>(mappingResolve => {
          this.api.deleteRoleMappingByWhere(JSON.stringify(filter.where)).subscribe(res => {
            mappingResolve()

          })
        })

        await new Promise<void>(mappingResolve => {
          this.api.deleteCustomerProductsRelByWhere(JSON.stringify(filter.where)).subscribe(res => {
            mappingResolve()

          })
        })

        resolve()
      })
    })

    // remove Users
    await new Promise<void>(resolve => {
      this.api.getUsersByFilter(JSON.stringify(filter)).subscribe(async users => {

        for (let user of users) {
          const userFilter = {
            where: {
              userId: user.id
            }
          }

          // remove address
          await new Promise<void>(addressResolve => {
            this.api.deleteAddressesByWhere(JSON.stringify(userFilter.where)).subscribe(res => {
              addressResolve()

            })
          })

          // remove observers
          await new Promise<void>(observerResolve => {
            this.api.deleteObserversByWhere(JSON.stringify(userFilter.where)).subscribe(res => {
              observerResolve()

            })
          })

          // remove redis subscription
          await new Promise<void>(redisResolve => {
            this.api.deleteRedisSubscriptionsByWhere(JSON.stringify(userFilter.where)).subscribe(res => {
              redisResolve()

            })
          })

          // remove users
          await new Promise<void>(userResolve => {
            this.api.deleteUserById(user.id).subscribe(res => {
              userResolve()

            })
          })
        }

        resolve()
      })
    })

    this.api.deleteCustomerById(this.router.snapshot.params.id).subscribe(res => {
      this.isDeleting = false
      if (!res || !res.count || res.count <= 0) {
        this.showSuccess('Unable to delete the customer, try again later!');
      } else {
        this.showSuccess('Customer successfully deleted!');
        this.onPressCancel();
      }
    }, error => {
      this.isDeleting = false
    }, () => {
      this.isDeleting = false
    });
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

  onPressCancel = () => {
    this.location.back();
  }
}
