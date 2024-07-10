import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
// biome-ignore lint/style/useImportType: angular needs the whole module for elements passed in constructor
import {
	FormsModule,
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { FileUploadModule } from "primeng/fileupload";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "../../services/auth.service";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";

@Component({
	selector: "app-auth-form",
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		InputTextModule,
		PasswordModule,
		ButtonModule,
		FileUploadModule,
	],
	templateUrl: "./auth-form.component.html",
	styles: "",
})
export class AuthFormComponent {
	@Input() isSignIn = true;
	authForm: FormGroup;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
	) {
		this.authForm = this.fb.group({
			fullName: [""],
			username: ["", Validators.required],
			password: ["", Validators.required],
		});
	}

	ngOnChanges() {
		if (this.isSignIn) {
			this.authForm.get("fullName")?.clearValidators();
		} else {
			this.authForm.get("fullName")?.setValidators(Validators.required);
		}
		this.authForm.get("fullName")?.updateValueAndValidity();
	}

	onSubmit() {
		if (this.authForm.valid) {
			const { username, password, fullName } = this.authForm.value;

			if (this.isSignIn) {
				this.authService.login(username, password).subscribe({
					next: (response) => {
						console.log("Successfully signed in:", response);
						this.router.navigate(["/"]);
					},
					error: (error) => {
						console.error("Sign-in error:", error);
					},
				});
			} else {
				this.authService.signUp(fullName, username, password).subscribe({
					next: (response) => {
						console.log("Successfully signed up:", response);
						this.router.navigate(["/"]);
					},
					error: (error) => {
						console.error("Sign-up error:", error);
					},
				});
			}
		}
	}

	// onUpload(event) {
	// 	this.authForm.patchValue({ profilePicture: event.files[0] });
	// }
}
