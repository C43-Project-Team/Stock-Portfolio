import { Component, type OnInit } from "@angular/core";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { ConfirmationService, MessageService } from "primeng/api";
import type { Portfolio } from "@models/portfolio";
import type { HttpErrorResponse } from "@angular/common/http";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";

@Component({
	selector: "app-portfolios",
	standalone: true,
	imports: [
		TableModule,
		CommonModule,
		ButtonModule,
		DialogModule,
		FormsModule,
		InputTextModule,
		ConfirmDialogModule,
		ToastModule,
	],
	providers: [MessageService, ConfirmationService],
	templateUrl: "./portfolios.component.html",
	styles: "",
})
export class PortfoliosComponent implements OnInit {
	portfolios: Portfolio[] = [];
	displayCreatePortfolioDialog = false;
	newPortfolioName = "";
	initialDeposit = 0;
	username = "";

	constructor(
		private router: Router,
		private apiService: ApiService,
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
	) {}

	ngOnInit(): void {
		this.authService.getCredentials().subscribe((user) => {
			this.username = user.username;
			this.loadPortfolios();
		});
	}

	async loadPortfolios() {
		try {
			this.portfolios = await this.apiService.getUserPortfolios();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async createPortfolio() {
		try {
			await this.apiService.createPortfolio(
				this.newPortfolioName,
				this.initialDeposit,
			);
			this.messageService.add({
				severity: "success",
				summary: "Success",
				detail: "Portfolio created successfully",
			});
			this.displayCreatePortfolioDialog = false;
			this.loadPortfolios();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async deletePortfolio(portfolioName: string) {
		try {
			await this.apiService.deletePortfolio(portfolioName);
			this.messageService.add({
				severity: "success",
				summary: "Success",
				detail: "Portfolio deleted successfully",
			});
			this.loadPortfolios();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	confirmDeletePortfolio(portfolioName: string) {
		this.confirmationService.confirm({
			message: "Are you sure you want to delete this portfolio?",
			accept: () => {
				this.deletePortfolio(portfolioName);
			},
		});
	}

	goToPortfolio(portfolioName: string) {
		this.router.navigate([
			`/user/id/${this.username}/portfolios`,
			portfolioName,
		]);
	}

	showCreatePortfolioDialog() {
		this.displayCreatePortfolioDialog = true;
	}
}
