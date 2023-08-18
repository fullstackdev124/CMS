import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate, Router } from '@angular/router';
import { StoreService } from '@app/services/store/store.service';
import { ApiService } from '@app/services/api/api.service';
import { IUserToken } from '@app/models/user';

@Injectable({ providedIn: 'root' })

export class AuthGuard implements CanActivate {

	private activeUser: boolean;
	private token: IUserToken;

	constructor(private router: Router, private store: StoreService, private api: ApiService) {
		this.store.state$.subscribe(async (state) => {
			this.activeUser = !!state.user;
			this.token = state.token;
		});
	}

	public async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		if (!this.activeUser) {
			try {
				await this.api.retrieveLoggedUser(this.token);
				return true;
			} catch (e) {
				return false;
			}
		} else {
			return this.activeUser && !!this.token;
		}
	}

	public async canLoad() {
		return this.activeUser && !!this.token;
	}
}
