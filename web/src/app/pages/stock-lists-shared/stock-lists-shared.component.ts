import { Component, type OnInit } from "@angular/core";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { MessageService } from "primeng/api";
import type { StocksList } from "@models/stock-list";
import type { HttpErrorResponse } from "@angular/common/http";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { ToastModule } from "primeng/toast";
import { ButtonModule } from "primeng/button";

@Component({
	selector: "app-stock-lists-shared",
	standalone: true,
	imports: [TableModule, CommonModule, ToastModule, ButtonModule],
	providers: [MessageService],
	templateUrl: "./stock-lists-shared.component.html",
	styles: "",
})
export class StockListsSharedComponent implements OnInit {
	stockLists: StocksList[] = [];
	username = "";

	constructor(
		private router: Router,
		private apiService: ApiService,
		private authService: AuthService,
		private messageService: MessageService,
	) {}

	ngOnInit(): void {
		this.authService.getCredentials().subscribe((user) => {
			this.username = user.username;
			this.loadSharedStockLists();
		});
	}

	async loadSharedStockLists() {
		try {
			this.stockLists =
				await this.apiService.getAllPrivateStockListsSharedWithUser();
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	goToStockList(stockList: StocksList) {
		this.router.navigate([
			"/stock-lists/user/",
			stockList.owner,
			stockList.stock_list_name,
		]);
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
