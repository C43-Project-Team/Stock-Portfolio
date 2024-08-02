import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockListsSharedComponent } from './stock-lists-shared.component';

describe('StockListsSharedComponent', () => {
  let component: StockListsSharedComponent;
  let fixture: ComponentFixture<StockListsSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockListsSharedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockListsSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
