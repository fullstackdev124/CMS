import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {trigger, transition, query, style, animate} from '@angular/animations'
import {ApiService} from '@services/api/api.service';
import {ActivatedRoute, Router} from '@angular/router';
import {timezones} from '@app/modules/client/user/user-edit/timezone';
import {ViewChild, ElementRef} from '@angular/core';
import {FormControl, FormBuilder, Validators, FormGroup} from '@angular/forms';
import {StoreService} from '@services/store/store.service';
import {
  defaultQuickPages,
  defaultLogo,
  defaultAvatar,
  defaultDarkTheme,
  defaultLightTheme
} from '../../default-ui-setting-values';
import {FontSizeType, LineHeightType, LetterSpacingType, WordSpacingType, UISettingIndex, UISettingThemeCSIndex} from '../enumtypes';
import * as ClsName from '../classnames';

// tslint:disable-next-line:max-line-length
import {
  AnimationInterval,
  CMSUserType,
  PERMISSION_TYPE_DENY,
  GUI_VISIBILITY_MATCH,
  PERMISSION_TYPE_ALL,
  NoPermissionAlertInteral, DATE_FORMAT, WEEKEND_FORMAT
} from '../../constant';
import {MessageService} from "primeng/api";
import {LayoutService} from "@services/app.layout.service";
import {MenuService} from "@services/app.menu.service";
import {RoutePath} from "@app/app.routes";

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss'],
  animations: [
  ]
})

export class UserEditComponent implements OnInit {

  permission = PERMISSION_TYPE_ALL;
  permissionTypeDeny = PERMISSION_TYPE_DENY;

  selectedRoleId = 0;
  selectedCustomerId = 0;
  selectedUserType = '';
  roles = [];
  showRoles = [];
  languages = [];
  customers = [];
  user: any = {};

  selectedUserName = ''
  selectedEmail = ''
  selectedFirstName = ''
  selectedLastName = ''
  selectedTimezone: any
  selectedLanguage: any
  selectedCustomer: any
  selectedRole: any

  cmsUserType = CMSUserType;

  tzs = [];
  isUserEnabled = false;
  selectedTimezoneOffset = null;
  selectedLanguageId = null;
  newPassword: string = null;
  newPasswordRepeat: string = null;

  logoImg: string = defaultLogo
  avatar: string = defaultAvatar

  // quick page clicks
  quickPages: any = JSON.parse(JSON.stringify(defaultQuickPages))
  isQuickPageLoaded = false

  filterValue = ""
  defVars = {
    id:0,
    maxQuantity:1,
    price:"0",
    recur:"month",
    currency:"USD"
  }
  defProd = {
    id:0,
    name:"",
    description:"",
    sku:"ecms-plan-",
    group:"plans",
    token:"-",
    Variations:[this.defVars]
  }


  @ViewChild('customLogo')
  customLogoRef: ElementRef;
  @ViewChild('customAvatar')
  customAvatarRef: ElementRef;

  menuTypes = [
    { label: 'Static', key: 'static' },
    // { label: 'Slim', key: 'slim' },
    { label: 'Overlay', key: 'overlay' },
  ]

  darkThemes = [
    // { pace: 'yellow', label: 'Bootstrap Blue', mode: 'dark', key: 'bootstrap4-dark-blue'},
    // { pace: 'yellow', label: 'Bootstrap Purple', mode: 'dark', key: 'bootstrap4-dark-purple'},
    { pace: 'yellow', label: 'Material Design Indigo', mode: 'dark', key: 'md-dark-indigo'},
    { pace: 'yellow', label: 'Material Design Deep Purple', mode: 'dark', key: 'md-dark-deeppurple'},
    // { pace: 'yellow', label: 'Vela Blue', mode: 'dark', key: 'vela-blue'},
    // { pace: 'yellow', label: 'Vela Green', mode: 'dark', key: 'vela-green'},
    // { pace: 'yellow', label: 'Vela Orange', mode: 'dark', key: 'vela-orange'},
    // { pace: 'yellow', label: 'Vela Purple', mode: 'dark', key: 'vela-purple'},
    // { pace: 'yellow', label: 'Arya Blue', mode: 'dark', key: 'arya-blue'},
    // { pace: 'yellow', label: 'Arya Green', mode: 'dark', key: 'arya-green'},
    // { pace: 'yellow', label: 'Arya Orange', mode: 'dark', key: 'arya-orange'},
    // { pace: 'yellow', label: 'Arya Purple', mode: 'dark', key: 'arya-purple'},
    // { pace: 'yellow', label: 'Lara Blue', mode: 'dark', key: 'lara-dark-blue'},
    // { pace: 'yellow', label: 'Lara Indigo', mode: 'dark', key: 'lara-dark-indigo'},
    // { pace: 'yellow', label: 'Lara Purple', mode: 'dark', key: 'lara-dark-purple'},
    // { pace: 'yellow', label: 'Lara Teal', mode: 'dark', key: 'lara-dark-teal'},
  ]

  lightThemes = [
    // { pace: 'blue', label: 'Bootstrap Blue', mode: 'light', key: 'bootstrap4-light-blue'},
    // { pace: 'blue', label: 'Bootstrap Purple', mode: 'light', key: 'bootstrap4-light-purple'},
    { pace: 'blue', label: 'Material Design Indigo', mode: 'light', key: 'md-light-indigo'},
    { pace: 'blue', label: 'Material Design Deep Purple', mode: 'light', key: 'md-light-deeppurple'},
    // { pace: 'blue', label: 'Tailwind', mode: 'light', key: 'tailwind-light'},
    // { pace: 'blue', label: 'Fluent', mode: 'light', key: 'fluent-light'},
    // { pace: 'blue', label: 'Saga Blue', mode: 'light', key: 'saga-blue'},
    // { pace: 'blue', label: 'Saga Green', mode: 'light', key: 'saga-green'},
    // { pace: 'blue', label: 'Saga Orange', mode: 'light', key: 'saga-orange'},
    // { pace: 'blue', label: 'Saga Purple', mode: 'light', key: 'saga-purple'},
    // { pace: 'blue', label: 'Lara Blue', mode: 'light', key: 'lara-light-blue'},
    // { pace: 'blue', label: 'Lara Indigo', mode: 'light', key: 'lara-light-indigo'},
    // { pace: 'blue', label: 'Lara Purple', mode: 'light', key: 'lara-light-purple'},
    // { pace: 'blue', label: 'Lara Teal', mode: 'light', key: 'lara-light-teal'},
  ]

  selectedDarkTheme = defaultDarkTheme
  selectedLightTheme = defaultLightTheme
  selectedMenuType: any

  previewThemeId: any
  isThemePreview = false
  previewMenuId: any
  isMenuPreview = false

  blockContent = false

  isAccountProfile = false

  selectedFailSafeNumber : any
  filterNumbers = []

  timeFormats = DATE_FORMAT
  selectedDateFormat = {label: 'mm/dd/yyyy', value: 'mm/dd/yyyy'}

  weekendFormats = WEEKEND_FORMAT
  selectedWeekendFormat = {label: 'Sunday - Saturday', value: 0};


  constructor(public api: ApiService,
              public router: ActivatedRoute,
              private routes: Router,
              private location: Location,
              private formBuilder:FormBuilder,
              private messageService: MessageService,
              private layoutService: LayoutService,
              private menuService: MenuService,
              public store: StoreService) {

  }

  async ngOnInit() {
    this.tzs.push(	{
      "value": "",
        "offset": "",
        "text": "Auto Detect"
      },
    )
    this.tzs = this.tzs.concat(timezones)

    this.selectedTimezone = {
      "value": "",
      "offset": "",
      "text": "Auto Detect"
    }

    await new Promise<void>(resolve => {
      const mainUserInterval = setInterval(() => {
        if (this.store.getUser() && this.store.getGuiVisibility()) {
          clearInterval(mainUserInterval);
          resolve();
        }
      }, 100);
    });

    this.initUser(true)

    this.api.getLanguages().subscribe(languages => {
      this.languages = languages;
    });
  }

  initUser(compl = false) {
    this.api.getUser(this.router.snapshot.params.id).subscribe(async res => {
      this.user = res;

      if(!compl)return

      /**************************** permission checking *************************/
      if (this.store.getUserType() !== CMSUserType.superAdmin) {
        const guiVisibility = this.store.getGuiVisibility();
        // console.log(guiVisibility)

        let permission = PERMISSION_TYPE_DENY;
        if (guiVisibility) {
          for (let v of guiVisibility) {
            if (v.GuiSection.name === 'User') {
              permission = v.GuiPermission.name;
              break;
            }
          }
        }

        if (permission !== PERMISSION_TYPE_ALL && this.store.getUser() && this.store.getUser().id !== this.user.id) {
          this.showWarning('You have no permission for this page')
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve();
            }, NoPermissionAlertInteral);
          });
          this.location.back();
        }

        // check if other customer user is trying to edit user or no primary user is trying to edit primary user
        // tslint:disable-next-line:max-line-length
        if (this.store.getUser().customerId != this.user.customerId || (this.store.getUserType() != CMSUserType.primaryAdmin && this.user.primaryAdmin)) {
          this.showWarning("You have no permission for this user")
          await new Promise<void>(resolve => {
            setTimeout(() => {
              resolve()
            }, NoPermissionAlertInteral)
          })
          this.location.back()
        }

        this.permission = permission
      }

      this.isUserEnabled = this.user.emailVerified
      this.selectedTimezoneOffset = this.user.timezone
      this.selectedLanguageId = this.user.languagesId

      this.selectedUserName = this.user.username
      this.selectedEmail = this.user.email
      this.selectedFirstName = this.user.firstName
      this.selectedLastName = this.user.lastName
      this.selectedLanguage = this.user.Languages

      if (this.user.tracking_numberId!=null)
        this.filterTrackingNumberForInitial(this.user.tracking_numberId)

      if (this.user.DashRoleMapping && this.user.DashRoleMapping.length > 0) {
        this.selectedUserType = this.user.DashRoleMapping[0].principalType
        this.selectedCustomerId = this.user.DashRoleMapping[0].customerId
        this.selectedCustomer = this.user.DashRoleMapping[0].Customer
        this.selectedRoleId = this.user.DashRoleMapping[0].roleId ? this.user.DashRoleMapping[0].roleId : 0
      }

      await this.getAllCustomers();
      await this.getRoles();

      this.store.state$.subscribe(async (state) => {
        if (state.token && state.user && state.guiVisibility) {
          await this.getUISettings()
        }
      });

      if (this.store.getUser() && this.store.getUser().id == this.user.id){
        this.isAccountProfile = true
      }
    });
  }

  /**
   * get ui settings from user information
   */
  getUISettings = async () => {
    if (this.user.uiSettings) {
      let uiSettings = JSON.parse(this.user.uiSettings)

      if (uiSettings.timezone!=undefined) {
        const tz = this.tzs.find((tz)=>tz.value==uiSettings.timezone)
        if (tz) {
          this.selectedTimezone = tz
          this.selectedTimezoneOffset = this.selectedTimezone.offset
        } else {
          this.selectedTimezoneOffset = ""
        }
      }

    if (uiSettings.dateFormat!=undefined) {
      this.selectedDateFormat = { label: uiSettings.dateFormat, value: uiSettings.dateFormat}
    }

      if (uiSettings.weekendFormat!=undefined) {
        const w = this.weekendFormats.find(item => item.value==uiSettings.weekendFormat)
        if (w)
          this.selectedWeekendFormat = w
      }

      if (uiSettings.customLogoImg != undefined) {
        this.logoImg = uiSettings.customLogoImg
      }

      if (uiSettings.customAvatar != undefined) {
        this.avatar = uiSettings.customAvatar
      }

      // if (uiSettings.menuType != undefined) {
      //   this.selectedMenuType = uiSettings.menuType
      // }

      if (uiSettings.darkTheme != undefined) {
        this.selectedDarkTheme = uiSettings.darkTheme
      }

      if (uiSettings.lightTheme != undefined) {
        this.selectedLightTheme = uiSettings.lightTheme
      }

      this.quickPages = JSON.parse(JSON.stringify(defaultQuickPages))

      if (uiSettings.customQuickPageEnables != undefined) {
        for (let i = 0; i < uiSettings.customQuickPageEnables.length; i++) {
          this.quickPages[i].isQuick = uiSettings.customQuickPageEnables[i]
        }
      }

      // check quickPages that belongs to the user's role permission
      if (this.store.getUserType() != CMSUserType.superAdmin) {
        if (this.user.DashRoleMapping && this.user.DashRoleMapping.length > 0) {
          for (let i = this.quickPages.length - 1; i >= 0; i--) {
            let permission = PERMISSION_TYPE_DENY
            if (this.store.getGuiVisibility()) {
              for (let v of this.store.getGuiVisibility()) {
                if (GUI_VISIBILITY_MATCH[v.GuiSection.name] == this.quickPages[i].title) {
                  permission = v.GuiPermission.name
                  break
                }
              }
            }

            if (permission == PERMISSION_TYPE_DENY) {
              this.quickPages.splice(i, 1)
            }
          }
        } else {
          this.quickPages = []
        }
      }

    } else {
      // this.applySettings()
    }

    this.customLogoRef.nativeElement.value = ''
    this.customAvatarRef.nativeElement.value = ''
  }

  /**
   * get roles from backend
   */
  getRoles = async () => {
    this.api.getRoles().subscribe(res => {
      this.roles = res
      if (this.selectedCustomerId) {
        res.map(role => {
          if (role.customerId == this.selectedCustomerId) {
            this.showRoles.push(role)
          }
        })
      } else {
        this.showRoles = res
      }

      this.showRoles = [ ...this.showRoles ]
      if (this.selectedRoleId) {
        this.selectedRole = this.showRoles.find((role) => role.id==this.selectedRoleId)
      }
    })
  }

  /**
   * get all customers from backend
   */
  getAllCustomers = async () => {
    await new Promise<void>(resolve => {
      if (this.store.getUserType() == CMSUserType.superAdmin) {
        this.api.getAllCustomerList().subscribe(res => {
          this.customers = res
          resolve()
        })
      } else {
        this.customers.push(this.user.Customer)
        this.selectedCustomerId = this.user.customerId
      }
      resolve()
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

  handleChange = (key: string, event: any) => {
    this.user[key] = event.target.value
  }

  /**
   * this is called at clicking save change button on the User Datail Tab
   */
  onSaveDetail = async () => {
    if (this.isAccountProfile && this.selectedFailSafeNumber?.id)
     this.user.tracking_numberId = this.selectedFailSafeNumber?.id;

    let uiSettings = JSON.parse(this.user.uiSettings)

    if (this.store.getUser() && this.user.id == this.store.getUser().id) {
      uiSettings = JSON.parse(this.store.getUser().uiSettings)
    }

    if (uiSettings == null) {
      uiSettings = {}
    }

    uiSettings.timezone = this.selectedTimezone ? this.selectedTimezone.value : ""
    this.user.timezone = this.selectedTimezone ? this.selectedTimezone.offset : ""

    uiSettings.dateFormat = this.selectedDateFormat ? this.selectedDateFormat.value: "mm/dd/yyyy"
    uiSettings.weekendFormat = this.selectedWeekendFormat ? this.selectedWeekendFormat.value: 0

    if (this.store.getUser() && this.user.id == this.store.getUser().id) {
      // save the user into store
      const curUser = this.store.getUser();
      curUser.uiSettings = JSON.stringify(uiSettings);
      this.store.storeUser(curUser);
    }

    this.user.uiSettings = JSON.stringify(uiSettings);

    this.blockContent = true
    this.api.updateUser(this.user).subscribe(res => {
      if (this.store.getUser().id==this.user.id) {
        setTimeout(() => {
          this.retrieveUser();
        }, 10)
      }

      this.blockContent = false
      this.user = res;
      this.showSuccess('User update succeeded!');
    }, error => {
      this.blockContent = false
    });
  }

  retrieveUser = () => {
    this.api.retrieveLoggedUser(this.store.retrieveToken());
  }

  /**
   * this is called at clicking Force New Password button on Authentication Tab
   * @returns
   */
  onPasswordUpdate = () => {
    if (!this.newPassword || !this.newPasswordRepeat || this.newPassword.trim().length <= 0 || this.newPasswordRepeat.trim().length <= 0) {
      this.showWarning('Wrong input supplied, please check data and try again.');
      return;
    } else if (this.newPassword !== this.newPasswordRepeat) {
      this.showWarning('Passwords does not matches.');
      return;
    }

    this.blockContent = true
    this.api.updateUserPassword(this.user.id, this.newPassword).subscribe(res => {
      this.store.storePassword(this.newPassword);

      this.blockContent = false
      this.user = res;
      this.showSuccess('User password successfully updated!');
    }, error => {
      this.blockContent = false
    });
  }

  /**
   * this is called at clicking Send Password Reset button on Authentication Tab
   */
  onPasswordReset = () => {
    this.blockContent = true
    this.api.accountReset(this.user.id).subscribe(res => {
      this.blockContent = false
      if (res) {
        this.showSuccess('Account successfully reset. Check given mailbox for instructions.')
      } else {
        this.showWarning('Unable to reset account. Contact an administrator for details.')
      }
    }, error => {
      this.blockContent = false
    })
  }

  /**
   * this is called at changing role on the Assign Role & Customer Tab
   * @param id Role Id
   */
  onRoleChange = (id: any) => {
    // this.user.roleId = parseInt(id);
    // this.user.DashRole = this.roles.filter(role => role.id === this.user.roleId)[0];
    this.selectedRoleId = parseInt(id)
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
      }
    })

    this.showRoles = [ ...this.showRoles ]
  }

  /**
   * this is called at changing Time Zone on the User Details Tab
   * @param event time zone select field
   */
  onTimezoneChange = (event: any) => {
    if (event) {
      this.user.timezone = event.value.offset
    }
  }

  /**
   * this is called at changing language select field
   * @param event language select field
   */
  onLanguageChange = (event: any) => {
    if (event) {
      this.user.languagesId = event.value.id;
    }
  }

  /**
   * this is called at Logo Remove button on UI Settings tab
   */
  onClickRemoveLogo = () => {
    this.logoImg = ''
    this.customLogoRef.nativeElement.value = ''
  }

  /**
   * this is called at Avatar Remove button on UI Settings tab
   */
  onClickRemoveAvatar = () => {
    this.avatar = ''
    this.customAvatarRef.nativeElement.value = ''
  }

  /**
   * this is called at clicking Apply button of Assign Role & Customer Tab
   * @returns
   */
  onAssign = async () => {
    let principal = {
      principalId: this.user.id,
      principalType: this.selectedUserType,
      roleId: this.selectedRoleId == 0 ? null : this.selectedRoleId,
      customerId: this.selectedCustomerId == 0 ? null : this.selectedCustomerId
    };

    // get role mapping that already exists
    const filter = {
      where: {
        principalId: this.user.id,
      }
    };

    this.blockContent = true
    this.api.getRoleMappingByFilter(JSON.stringify(filter))
      .subscribe(async res => {
        // update user
        this.user.customerId = this.selectedCustomerId == 0 ? null : this.selectedCustomerId;

        this.api.updateUser(this.user).subscribe(res => {

        });

        // if exists, update
        if (res.length > 0) {
          const data = {...principal, id: res[0].id};
          this.api.updateRoleMapping(data).subscribe(r => {
            if (this.store.getUser().id==this.user.id) {
              setTimeout(() => {
                this.retrieveUser();
              }, 10)
            }

            this.blockContent = false
            this.showSuccess('Assigned Successfully');
            this.routes.navigate([RoutePath.user.users]);
          }, error => {
            this.blockContent = false
          }, () => {
            this.blockContent = false
          })
          return;
        }

        // not exists, create
        if (this.selectedRoleId) {
          this.api.createRoleMapping(principal).subscribe(r => {
            if (this.store.getUser().id==this.user.id) {
              setTimeout(() => {
                this.retrieveUser();
              }, 10)
            }

            this.blockContent = false
            this.showSuccess('Assigned Successfully');
            this.routes.navigate([RoutePath.user.users]);
          }, error => {
            this.blockContent = false
          }, () => {
            this.blockContent = false
          });
        } else {
          this.blockContent = false
        }
      }, e => {
        this.blockContent = false
      });
  }

  /**
   * Unassign all user roles
   */
  onUnassign = async () => {
    if (!this.user.DashRoleMapping) {
      this.showWarning('User have no assigned roles.');
      return;
    }

    this.blockContent = true
    this.api.deleteAllUserRoleMapping(this.user.id).subscribe(r => {
      if (this.store.getUser().id==this.user.id) {
        setTimeout(() => {
          this.retrieveUser();
        }, 10)
      }

      this.blockContent = false
      this.showSuccess('User roles successfully deleted.');
      this.routes.navigate([RoutePath.user.users]);
    }, e => {
      this.blockContent = false
      this.showWarning('Unable to delete user roles.');
    }, () => {
      this.blockContent = false
    });
  }

  /**
   * set ui with setting value
   */
  setUIWithSettingValue = (scheme) => {
    this.layoutService.applyTheme(scheme=='dark' ? this.selectedDarkTheme.key : this.selectedLightTheme.key,
      scheme=='dark' ? this.selectedDarkTheme.mode : this.selectedLightTheme.mode,
      scheme=='dark' ? this.selectedDarkTheme.pace : this.selectedLightTheme.pace)
  }

  /**
   * this is called when the user change the custom logo
   * @param ev logo file input field
   */
  onChangeCustomLogoImg(ev) {
    var reader = new FileReader()
    let pThis: any = this

    reader.onload = function () {
      pThis.logoImg = reader.result
    }

    // check the width/height of the image
    var _URL = window.URL || window.webkitURL
    var file = ev.target.files[0]
    var img = new Image();
    var objectUrl = _URL.createObjectURL(file)
    img.onload = function (event) {
      const loadedImage: any = event.currentTarget
      let width = parseFloat(loadedImage.width)
      let height = parseFloat(loadedImage.height)

      _URL.revokeObjectURL(objectUrl)

      // Enable that for preserving a fixed image rate
      //let rate = width / height
      //if (0.9 < rate && rate < 4) {
        if (width > 200 || height > 100) {
          pThis.showError('Please select the image that width and height are less than 200px')
          pThis.customLogoRef.nativeElement.value = ''

        } else {
          reader.readAsDataURL(file)
        }

      //} else {
      //  pThis.toastr.error('Please select the image with the almost same width and height', '', {positionClass: 'toast-top-right'})
      //  pThis.customLogoRef.nativeElement.value = ''
      //}
    }
    img.src = objectUrl

  }

  /**
   * this is called when the user change the avatar
   * @param ev avatar file input field
   */
  onChangeAvatar(ev) {
    var reader = new FileReader()
    let pThis: any = this

    reader.onload = function (event) {

      pThis.avatar = reader.result
    }

    // check the width/height of the image
    var _URL = window.URL || window.webkitURL
    var file = ev.target.files[0]
    var img = new Image();
    var objectUrl = _URL.createObjectURL(file)
    img.onload = function (event) {
      const loadedImage: any = event.currentTarget
      let width = parseFloat(loadedImage.width)
      let height = parseFloat(loadedImage.height)

      _URL.revokeObjectURL(objectUrl)

      let rate = width / height
      if (0.9 < rate && rate < 1.1) {
        if (width > 100 || height > 100) {
          pThis.toastr.error('Please select the image that width and height are less than 200px', '', {positionClass: 'toast-top-right'})
          pThis.customAvatarRef.nativeElement.value = ''

        } else {
          reader.readAsDataURL(file)
        }

      } else {
        pThis.toastr.error('Please select the image with the almost same width and height', '', {positionClass: 'toast-top-right'})
        pThis.customAvatarRef.nativeElement.value = ''
      }
    }
    img.src = objectUrl
  }

  /**
   * save ui settings into the session storage and update user information
   */
  applySettings = () => {
    // next, update the ui setting of the user
    let uiSettings = JSON.parse(this.user.uiSettings)

    if (this.store.getUser() && this.user.id == this.store.getUser().id) {
      uiSettings = JSON.parse(this.store.getUser().uiSettings)
    }

    if (uiSettings == null) {
      uiSettings = {}
    }

    // images
    uiSettings.customLogoImg = this.logoImg

    // save avatar
    uiSettings.customAvatar = this.avatar

    // custom quick page
    let sourceQuickPages = JSON.parse(JSON.stringify(defaultQuickPages))
    for (let page of sourceQuickPages) {
      page.isQuick = false
      for (const page1 of this.quickPages) {
        if (page1.title == page.title) {
          page.isQuick = page1.isQuick
          break
        }
      }
    }

    this.store.setQuickPages(sourceQuickPages)
    uiSettings.customQuickPageEnables = sourceQuickPages.map(page => page.isQuick)

    // uiSettings.menuType = this.selectedMenuType
    uiSettings.darkTheme = this.selectedDarkTheme
    uiSettings.lightTheme = this.selectedLightTheme

    let scheme = 'dark'
    if (uiSettings.colorScheme)
      scheme = uiSettings.colorScheme
    else
      uiSettings.colorScheme = scheme

    // apply the setting values to UI if the user is just the user
    if (this.store.getUser() && this.user.id == this.store.getUser().id) {
      this.setUIWithSettingValue(scheme);

      // save the user into store
      const curUser = this.store.getUser();
      curUser.uiSettings = JSON.stringify(uiSettings);
      this.store.storeUser(curUser);
    }

    // save the user into store
    this.user.uiSettings = JSON.stringify(uiSettings);

    this.blockContent = true
    // call the user update api
    try {
      this.api.updateUser(this.user)
        .subscribe(
          res => {
            this.blockContent = false
            if (res) {
              this.showSuccess('UI settings successfully updated.')
            } else {
              this.showWarning('Wrong input supplied, please check data and try again.');
            }
        }, error => {
            this.blockContent = false
        }, () => {
            this.blockContent = false
          });
    } catch (e) {
      this.blockContent = false
    }
  }

  applyMenu = async () => {
    if (this.isMenuPreview)
      return

    let menu = this.getCurrentMenuType()
    if (menu == this.selectedMenuType.key)
      return

    this.isMenuPreview = true
    this.layoutService.config.menuMode = this.selectedMenuType.key;
    if (this.layoutService.isSlim()) {
      this.menuService.reset();
    }

    this.previewMenuId = setTimeout( () => {
      this.restoreMenu()
    }, 10000)

    this.showSuccess("Menu will be restored within 10 seconds")
  }

  getCurrentMenuType() {
    let uiSettings = JSON.parse(this.store.getUser().uiSettings)
    if (uiSettings == null) {
      uiSettings = {}
    }

    let menu = 'static'
    if (uiSettings.menuType)
      menu = uiSettings.menuType

    return menu
  }

  restoreMenu = async () => {
    this.layoutService.config.menuMode = this.getCurrentMenuType();
    if (this.layoutService.isSlim()) {
      this.menuService.reset();
    }

    this.isMenuPreview = false
  }

  applyTheme = async (mode) => {
    if (this.isThemePreview)
      return

    this.isThemePreview = true
    await this.layoutService.applyTheme(mode=='dark' ? this.selectedDarkTheme.key : this.selectedLightTheme.key,
      mode=='dark' ? this.selectedDarkTheme.mode : this.selectedLightTheme.mode,
      mode=='dark' ? this.selectedDarkTheme.pace : this.selectedLightTheme.pace)

    this.previewThemeId = setTimeout(() => {
      this.restoreTheme()
    }, 5000)

    this.showSuccess("Theme will be restored within 5 seconds")
  }

  getCurrentTheme() {
    let uiSettings = JSON.parse(this.store.getUser().uiSettings)
    if (uiSettings == null) {
      uiSettings = {}
    }

    let darkTheme = defaultDarkTheme
    if (uiSettings.darkTheme) {
      darkTheme = uiSettings.darkTheme
    }

    let lightTheme = defaultLightTheme
    if (uiSettings.lightTheme) {
      lightTheme = uiSettings.lightTheme
    }

    let scheme = 'dark'
    if (uiSettings.colorScheme)
      scheme = uiSettings.colorScheme

    return scheme=='dark' ? darkTheme : lightTheme
  }

  restoreTheme = async() => {
    let theme = this.getCurrentTheme()
    await this.layoutService.applyTheme(theme.key, theme.mode, theme.pace)
    this.isThemePreview = false
  }

  filterTrackingNumber(event) {
    let query = event.query.toLowerCase()

    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        customerId: this.store.getUser().customerId
      }
    }

    this.api.getTrackingNumbersForAutoComplete(query, customerFilter).subscribe(res => {
      this.filterNumbers = []
      res.body.forEach(item => {
        let number = item.tracking_number
        item.formatted_tracking_number = "(" + number.substring(0, 3) + ") " +number.substring(3, 6) + "-" + number.substring(6)
        this.filterNumbers.push(item)
      })
    })
  }

  filterTrackingNumberForInitial(id) {
    let customerFilter = null
    if (this.store.getUserType() !== CMSUserType.superAdmin) {
      customerFilter = {
        id: id,
        customerId: this.store.getUser().customerId
      }
    }

    this.api.getTrackingNumbersForAutoComplete("", customerFilter).subscribe(res => {
      this.filterNumbers = []
      res.body.forEach(item => {
        if (item.id==id) {
          let number = item.tracking_number
          item.formatted_tracking_number = "(" + number.substring(0, 3) + ") " +number.substring(3, 6) + "-" + number.substring(6)
          this.filterNumbers.push(item)
          this.selectedFailSafeNumber = item
        }
      })
    })
  }
}
