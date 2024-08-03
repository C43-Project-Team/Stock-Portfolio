import { CommonModule } from "@angular/common";
import type { HttpErrorResponse } from "@angular/common/http";
import { Component, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";
import type { StocksList } from "@models/stock-list";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { PaginatorModule } from "primeng/paginator";
import { TableModule } from "primeng/table";

@Component({
	selector: "app-public-stock-lists",
	standalone: true,
	imports: [
		TableModule,
		CommonModule,
		ButtonModule,
		PaginatorModule,
		FormsModule,
	],
	providers: [MessageService],
	templateUrl: "./public-stock-lists.component.html",
	styles: "",
})
export class PublicStockListsComponent implements OnInit {
	publicStockLists: StocksList[] = [];
	totalRecords = 0;
	loading = false;
	rowsPerPage = 10;
	page = 0;

	constructor(
		private apiService: ApiService,
		private messageService: MessageService,
		private router: Router,
	) {}

	ngOnInit() {
		this.loadPublicStockLists();
		this.getPublicStockListCount();
	}

	async loadPublicStockLists() {
		this.loading = true;
		try {
			this.publicStockLists = await this.apiService.getPublicStockLists(
				this.page + 1,
				this.rowsPerPage,
			);
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		} finally {
			this.loading = false;
		}
	}

	async getPublicStockListCount() {
		try {
			const response = await this.apiService.getPublicStockListCount();
			this.totalRecords = response.count;
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	onPageChange(event: any) {
		this.page = event.page;
		this.loadPublicStockLists();
	}

	goToStockList(stockList: StocksList) {
		this.router.navigate([
			"/stock-lists/user",
			stockList.owner,
			stockList.stock_list_name,
		]);
	}

	logError(detail: string) {
		this.messageService.add({
			severity: "error",
			summary: "Error",
			detail: detail,
		});
	}
}
