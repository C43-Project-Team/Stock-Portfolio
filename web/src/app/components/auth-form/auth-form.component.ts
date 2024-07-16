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
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

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
		ToastModule,
	],
	providers: [MessageService],
	templateUrl: "./auth-form.component.html",
	styles: "",
})
export class AuthFormComponent {
	@Input() isSignIn = true;
	authForm: FormGroup;
	selectedFile: File | null = null;
	selectedFileName: string | null = null;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
		private messageService: MessageService,
	) {
		this.authForm = this.fb.group({
			fullName: ["", Validators.required],
			username: ["", Validators.required],
			password: ["", Validators.required],
			profilePicture: ["", Validators.required],
		});
	}

	ngOnChanges() {
		if (this.isSignIn) {
			this.authForm.get("fullName")?.clearValidators();
			this.authForm.get("profilePicture")?.clearValidators();
		} else {
			this.authForm.get("fullName")?.setValidators(Validators.required);
			this.authForm.get("profilePicture")?.setValidators(Validators.required);
		}
		this.authForm.get("fullName")?.updateValueAndValidity();
		this.authForm.get("profilePicture")?.updateValueAndValidity();
	}

	onSubmit() {
		const { username, password, fullName } = this.authForm.value;

		if (this.isSignIn) {
			this.authService.login(username, password).subscribe({
				next: (response) => {
					console.log("Successfully signed in:", response);
					this.router.navigate(["/"]);
				},
				error: (error) => {
					this.showError(error.message);
				},
			});
		} else {
			const formData = new FormData();
			formData.append("fullName", fullName);
			formData.append("username", username);
			formData.append("password", password);
			if (this.selectedFile) {
				formData.append("profilePicture", this.selectedFile);
			}

			this.authService.signUp(formData).subscribe({
				next: (response) => {
					console.log("Successfully signed up:", response);
					this.router.navigate(["/"]);
				},
				error: (error) => {
					console.log(error);
					this.showError(error.message);
				},
			});
		}
	}

	onSelect(event: any) {
		this.selectedFile = event.files[0];
		this.authForm.patchValue({ profilePicture: event.files[0] });
		this.selectedFileName = this.selectedFile ? this.selectedFile.name : null;
	}

	showError(error: string) {
		this.messageService.add({
			severity: "error",
			summary: "Error",
			detail: error,
		});
	}

	// onUpload(event) {
	// 	this.authForm.patchValue({ profilePicture: event.files[0] });
	// }
}
