import { TestBed } from '@angular/core/testing';

import { ComponentCommService } from './component-comm.service';

describe('ComponentCommService', () => {
  let service: ComponentCommService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComponentCommService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
