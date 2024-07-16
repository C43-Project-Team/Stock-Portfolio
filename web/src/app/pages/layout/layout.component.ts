import { Component } from "@angular/core";
import { NavbarComponent } from "./components/nav/nav.component";

@Component({
	selector: "app-layout",
	standalone: true,
	imports: [NavbarComponent],
	templateUrl: "./layout.component.html",
	styles: "",
})
export class LayoutComponent {}
