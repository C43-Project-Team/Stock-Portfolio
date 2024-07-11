import { Component } from "@angular/core";
import { AuthFormComponent } from "../../components/auth-form/auth-form.component";
import { RouterModule } from "@angular/router";

@Component({
	selector: "app-sign-up",
	standalone: true,
	imports: [AuthFormComponent, RouterModule],
	templateUrl: "./sign-up.component.html",
	styles: "",
})
export class SignUpComponent {}
