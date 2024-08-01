import { ComponentFixture, TestBed } from "@angular/core/testing";

import { IndividualStockListComponent } from "./individual-stock-list.component";

describe("IndividualStockListComponent", () => {
	let component: IndividualStockListComponent;
	let fixture: ComponentFixture<IndividualStockListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [IndividualStockListComponent],
		}).compileComponents();

		fixture = TestBed.createComponent(IndividualStockListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
