import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OauthButtons } from './oauth-buttons';

describe('OauthButtons', () => {
  let component: OauthButtons;
  let fixture: ComponentFixture<OauthButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OauthButtons],
    }).compileComponents();

    fixture = TestBed.createComponent(OauthButtons);
    fixture.componentRef.setInput('providers', ['google', 'github']);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
