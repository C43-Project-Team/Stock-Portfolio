import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StockMatrixComponent } from "./stock-matrix.component";

describe("StockMatrixComponent", () => {
	let component: StockMatrixComponent;
	let fixture: ComponentFixture<StockMatrixComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [StockMatrixComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(StockMatrixComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
