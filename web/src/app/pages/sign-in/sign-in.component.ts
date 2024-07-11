import { Component } from "@angular/core";
import { AuthFormComponent } from "../../components/auth-form/auth-form.component";
import { RouterModule } from "@angular/router";

@Component({
	selector: "app-sign-in",
	standalone: true,
	imports: [AuthFormComponent, RouterModule],
	templateUrl: "./sign-in.component.html",
	styles: "",
})
export class SignInComponent {}
