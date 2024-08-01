import { Component } from "@angular/core";
import { NavbarComponent } from "./components/nav/nav.component";
import { RouterModule } from "@angular/router";

@Component({
	selector: "app-layout",
	standalone: true,
	imports: [NavbarComponent, RouterModule],
	templateUrl: "./layout.component.html",
	styles: "",
})
export class LayoutComponent {}
