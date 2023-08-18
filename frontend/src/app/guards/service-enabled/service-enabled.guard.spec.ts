import { TestBed, async, inject } from '@angular/core/testing';

import { ServiceEnabledGuard } from './service-enabled.guard';

describe('ServiceEnabledGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiceEnabledGuard]
    });
  });

  it('should ...', inject([ServiceEnabledGuard], (guard: ServiceEnabledGuard) => {
    expect(guard).toBeTruthy();
  }));
});
