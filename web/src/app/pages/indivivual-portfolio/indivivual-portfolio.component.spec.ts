import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndivivualPortfolioComponent } from './indivivual-portfolio.component';

describe('IndivivualPortfolioComponent', () => {
  let component: IndivivualPortfolioComponent;
  let fixture: ComponentFixture<IndivivualPortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndivivualPortfolioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndivivualPortfolioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
