import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {Router, ActivatedRoute} from '@angular/router';
import {ApiService} from '@services/api/api.service';
import {GetSources} from '@app/models/tracking_numbers';
import {
  AnimationInterval,
  PERMISSION_TYPE_DENY,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral,
  CMSUserType
} from '../../constant';
import {StoreService} from '../../../../services/store/store.service';
import {catchError, mergeMap, tap} from "rxjs/operators";
import {of} from "rxjs";
import {MessageService} from "primeng/api";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-tracking-source-edit',
  templateUrl: './tracking-source-edit.component.html',
  styleUrls: ['./tracking-source-edit.component.scss'],
  animations: [
  ]
})

export class TrackingSourceEditComponent implements OnInit {

  current = 'source-general';
  source: GetSources = {
    id: null,
    name: null,
    type: null,
    position: null,
    lastTouch: null,
    updatedAt: null,
    description: null,
    color: null,
    customerId: 1
  };

  customerList: any[] = []
  cmsUserType = CMSUserType

  isReleasing = false     // the flag if the tracking number is releasing

  selectedCustomer : any
  selectedDescription = ''
  selectedName = ''

  blockContent = false

  constructor(public route: ActivatedRoute,
              public api: ApiService,
              public router: Router,
              public messageService: MessageService,
              public location: Location,
              public store: StoreService) {
  }

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
        if (v.GuiSection.name == "TrackingSources") {
          permission = v.GuiPermission.name
          break
        }
      }

      if (permission != PERMISSION_TYPE_ALL) {
        this.showWarn("You have no permission for this page")
        await new Promise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, NoPermissionAlertInteral)
        })
        this.location.back()
      }
    }

    this.api.getSourceDetailById(this.route.snapshot.params.id).subscribe(res => {
      this.source = res

      this.selectedName = this.source.name
      this.selectedDescription = this.source.description
    }, e => {

    })

    if (this.store.getUserType() == CMSUserType.superAdmin) {
      this.selectedCustomer = this.store.getUser().Customer

      this.api.getAllCustomerList().subscribe(res => {
        this.customerList = res;

        this.selectedCustomer = this.customerList.find((cus) => cus.id==this.source.customerId)
      }, e => {
      });
    } else {
      this.customerList.push(this.store.getUser().Customer)
    }
  }

  showWarn = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'warn', summary: 'Warning', detail: msg });
  }
  showError = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'error', summary: 'Error', detail: msg });
  }
  showSuccess = (msg: string) => {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: msg });
  };

  /**
   *
   * @param section
   */
  scrollTo(section) {
    this.current = section;
    const element = document.getElementById(section);
    element.scrollIntoView(true);
  }

  /**
   *
   */
  onChangeOnsite = () => {
    this.source.type = this.source.type === 'onsite' ? 'offsite' : 'onsite';
  }

  /**
   *
   * @param event
   */
  onChangeName = (event: Event) => {
    this.source.name = (event.target as HTMLInputElement).value;
  }

  /**
   *
   * @param event
   */
  onChangeDescription = (event: Event) => {
    this.source.description = (event.target as HTMLInputElement).value;
  }

  /**
   *
   */
  onClickSave = () => {
    this.source.name = this.selectedName
    this.source.description = this.selectedDescription

    let filter = {
      where: {
        customerId: this.source.customerId,
        name: this.source.name
      }
    }

    this.blockContent = true
    this.api.getSourcesByFilter(filter).subscribe(res => {
      if (res.length > 1 || (res.length === 1 && res[0].id !== this.source.id)) {
        this.blockContent = false
        this.showWarn("There is already the same name.")
        return;
      }

      this.api.saveSourceById(this.source).subscribe(res => {
        this.blockContent = false
        this.showSuccess('Updating Succeeded!')
        this.router.navigateByUrl(RoutePath.tracking_source.sources)
      }, error => {
        this.blockContent = false
        this.showError("Error in updating tracking source!")
      }, () => {
        this.blockContent = false
      })
    }, error => {
      this.blockContent = false
      this.showError("Error in updating tracking source!")
    })
  }

  /**
   * this is called at clicking Release Tracking Number button
   */
  onDeleteSource = async () => {
    this.isReleasing = true
    this.api.deleteSourceById(this.route.snapshot.params.id).subscribe(res => {
      this.showSuccess("Release Succeeded")
      this.isReleasing = false
      this.router.navigateByUrl(RoutePath.tracking_source.sources)
    }, e => {

    })
  }

}

