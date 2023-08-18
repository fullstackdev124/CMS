import { matchRegexp } from './services/api/api.filters';
import { NavigationStart } from '@angular/router';
import { IUser, IUserToken } from './models/user';
import { StoreService } from '@app/services/store/store.service';
import { Component, OnInit, ViewChild } from '@angular/core'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { PrimeNGConfig } from 'primeng/api'
import { filter } from 'rxjs/operators'
import {EnvironmentLoaderService} from "@services/environment-loader.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  private sessionToken: IUserToken = null;

  constructor(
    private readonly environmentLoaderService: EnvironmentLoaderService,
    private router: Router,
    private store: StoreService,
    private titleService: Title,
    private primengConfig: PrimeNGConfig,
    private activatedRoute: ActivatedRoute
  ) {
    this.store.state$.subscribe(async (state) => {
			this.sessionToken = state.token;
		});
  }

  // Main App Title
  title = 'eCMS'

  ngOnInit(): void {

    this.primengConfig.ripple = true;
    document.documentElement.style.fontSize = '13px';

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
    ).subscribe(() => {

      var rt = this.getChild(this.activatedRoute)

      rt.data.subscribe(data => {
        this.titleService.setTitle(data.title)
      })
    })

    // Global router events subscriber  --  this allows me to do
    // shared action without injecting same Guard on every route
    // e.g.: check if user session is still valid.
    this.router.events.subscribe(event => {
      if(event && event instanceof NavigationStart
        && (
          (event.url.match(/^\/$/g) == null)
          && (event.url.match(/^\/auth\/login/g) == null)
          && (event.url.match(/^\/signup/g) == null)
          && (event.url.match(/^\/account-activate/g) == null)
          && (event.url.match(/^\/forgot-password/g) == null)
          && (event.url.match(/^\/error-404/g) == null)
          && (event.url.match(/^\/error-500/g) == null)
        ) && (this.sessionToken == null || this.sessionToken.expires <= (new Date()))
      ) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getChild(activatedRoute: ActivatedRoute) {
    if (activatedRoute.firstChild) {
      return this.getChild(activatedRoute.firstChild)
    } else {
      return activatedRoute
    }
  }

  /**
   * this is called when the user clicks main contents body panel
   */
  closeMenu() {

  }
}
