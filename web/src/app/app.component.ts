import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { ChartModule } from "primeng/chart";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, ButtonModule, RouterLink, ChartModule],
	templateUrl: "./app.component.html",
})
export class AppComponent {
	title = "web";
}
