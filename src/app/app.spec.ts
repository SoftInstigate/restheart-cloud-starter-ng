import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RH_AUTH_CONFIG } from '@restheart-cloud/kit-ng';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        // App renders ConsentsGate, which injects RhAuthService — and that
        // injects this token.
        { provide: RH_AUTH_CONFIG, useValue: { apiBaseUrl: 'http://localhost:8080' } },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
