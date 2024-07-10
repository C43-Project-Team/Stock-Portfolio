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

	constructor(private fb: FormBuilder) {
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
			if (this.isSignIn) {
				// Handle sign in logic
				console.log("Signing in with:", this.authForm.value);
			} else {
				// Handle sign up logic
				console.log("Signing up with:", this.authForm.value);
			}
		}
	}

	// onUpload(event) {
	// 	this.authForm.patchValue({ profilePicture: event.files[0] });
	// }
}
