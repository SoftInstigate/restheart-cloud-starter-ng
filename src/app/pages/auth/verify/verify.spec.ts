import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RH_AUTH_CONFIG } from '@restheart-cloud/kit-ng';

import { Verify } from './verify';

describe('Verify', () => {
  let component: Verify;
  let fixture: ComponentFixture<Verify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verify],
      providers: [
        provideRouter([]),
        // Verify injects RhAuthService, which injects this token — without it
        // the component cannot be constructed at all.
        { provide: RH_AUTH_CONFIG, useValue: { apiBaseUrl: 'http://localhost:8080' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Verify);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
