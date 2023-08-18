import { TestBed } from '@angular/core/testing';

import { EnvironmentLoaderService } from './environment-loader.service';

describe('EnvironmentLoaderService', () => {
  let service: EnvironmentLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnvironmentLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
