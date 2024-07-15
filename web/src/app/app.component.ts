import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ButtonModule } from "primeng/button";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet, ButtonModule, RouterLink],
	templateUrl: "./app.component.html",
})
export class AppComponent {
	title = "web";
}
