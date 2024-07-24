import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicStockListsComponent } from './public-stock-lists.component';

describe('PublicStockListsComponent', () => {
  let component: PublicStockListsComponent;
  let fixture: ComponentFixture<PublicStockListsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicStockListsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicStockListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
