import { Component, type OnInit } from "@angular/core";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ActivatedRoute, Router } from "@angular/router";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { MessageService } from "primeng/api";
import type { StocksList } from "@models/stock-list";
import type { HttpErrorResponse } from "@angular/common/http";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";

@Component({
	selector: "app-user",
	standalone: true,
	imports: [TableModule, CommonModule],
	providers: [MessageService],
	templateUrl: "./user.component.html",
	styles: "",
})
export class UserComponent implements OnInit {
	stockLists: StocksList[] = [];
	isCurrentUser = false;
	username = "";
	myUsername = "";

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private apiService: ApiService,
		private authService: AuthService,
		private messageService: MessageService,
	) {}

	ngOnInit(): void {
		this.authService.getCredentials().subscribe((user) => {
			this.myUsername = user.username;
			this.checkUser();
		});

		this.route.params.subscribe((params) => {
			// biome-ignore lint/complexity/useLiteralKeys: angular index signature requirement
			this.username = params["username"];
			this.checkUser();
		});
	}

	checkUser() {
		this.isCurrentUser = this.username === this.myUsername;
		if (this.isCurrentUser) {
			this.loadStockLists();
		}
	}

	async loadStockLists() {
		try {
			this.stockLists = await this.apiService.getUserStockLists();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	goToStock(stockListName: string) {
		this.router.navigate(["/stocks", stockListName]);
	}
}
