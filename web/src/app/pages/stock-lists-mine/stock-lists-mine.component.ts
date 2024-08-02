import { Component, type OnInit } from "@angular/core";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { ConfirmationService, MessageService } from "primeng/api";
import type { StocksList } from "@models/stock-list";
import type { HttpErrorResponse } from "@angular/common/http";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";

@Component({
	selector: "app-stock-lists-mine",
	standalone: true,
	imports: [
		TableModule,
		CommonModule,
		ButtonModule,
		DialogModule,
		CheckboxModule,
		FormsModule,
		InputTextModule,
		ConfirmDialogModule,
		ToastModule,
	],
	providers: [MessageService, ConfirmationService],
	templateUrl: "./stock-lists-mine.component.html",
	styles: "",
})
export class StockListsMineComponent implements OnInit {
	stockLists: StocksList[] = [];
	username = "";
	displayCreateStockListDialog = false;
	newStockListName = "";
	isPrivate = false;

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
			this.loadStockLists();
		});
	}

	async loadStockLists() {
		try {
			this.stockLists = await this.apiService.getUserStockLists();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async createStockList() {
		try {
			await this.apiService.createStockList(
				this.newStockListName,
				this.isPrivate,
			);
			this.logSuccess("Success", "Stock list created successfully");
			this.displayCreateStockListDialog = false;
			this.loadStockLists();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async deleteStockList(stockListName: string) {
		try {
			await this.apiService.deleteStockList(stockListName);
			this.logSuccess("Success", "Stock list deleted successfully");
			this.loadStockLists();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	confirmDelete(stockListName: string) {
		this.confirmationService.confirm({
			message: "Are you sure you want to delete this stock list?",
			accept: () => {
				this.deleteStockList(stockListName);
			},
		});
	}

	goToStockList(stockListName: string) {
		this.router.navigate(["/stock-lists/user/", this.username, stockListName]);
	}

	showCreateStockListDialog() {
		this.displayCreateStockListDialog = true;
	}

	logSuccess(summary: string, detail: string) {
		this.messageService.add({
			severity: "success",
			summary,
			detail,
		});
	}

	logError(detail: string) {
		this.messageService.add({
			severity: "error",
			summary: "Error",
			detail: detail,
		});
	}
}
