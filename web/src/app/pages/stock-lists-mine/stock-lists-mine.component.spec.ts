import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StockListsMineComponent } from "./stock-lists-mine.component";

describe("StockListsMineComponent", () => {
	let component: StockListsMineComponent;
	let fixture: ComponentFixture<StockListsMineComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [StockListsMineComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(StockListsMineComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
