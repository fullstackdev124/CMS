import { Injectable } from '@angular/core';
// @ts-ignore
import {EnvConfig} from '@app/core/model/env.config';
import {HttpClient} from "@angular/common/http";
import {tap} from "rxjs/operators";
import {of} from "rxjs";
import {ApiService} from "@services/api/api.service";

@Injectable({
  providedIn: 'root'
})
export class EnvironmentLoaderService {
  private envConfig: EnvConfig

  constructor(private readonly http: HttpClient) {
  }

  async loadEnvConfig(configPath: string) {
    // @ts-ignore
    this.envConfig = await this.http.get<any>(configPath).pipe(tap((res: any)=> {
      return of(res);
    })).toPromise().catch(err => this.envConfig = null)

    console.log("env", this.envConfig)
  }

  getEnvConfig(): EnvConfig {
    return this.envConfig;
  }
}
