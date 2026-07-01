import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RH_AUTH_CONFIG } from '@restheart-cloud/kit-ng';

import { Accept } from './accept';

describe('Accept', () => {
  let component: Accept;
  let fixture: ComponentFixture<Accept>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Accept],
      providers: [
        provideRouter([]),
        { provide: RH_AUTH_CONFIG, useValue: { apiBaseUrl: 'http://localhost:8080' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Accept);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
