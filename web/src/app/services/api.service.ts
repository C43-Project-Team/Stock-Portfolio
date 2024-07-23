// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import environment from "@environment";
import type { FriendsTable } from "@models/friends-table";
import type { StocksList } from "@models/stock-list";
import { take } from "rxjs";
import type { Portfolio } from "@models/portfolio";

@Injectable({
	providedIn: "root",
})
export class ApiService {
	private readonly API_URL = environment.api_url;

	constructor(private http: HttpClient) {}

	private async get<T>(endpoint: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.get<T>(encodeURI(`${this.API_URL}${endpoint}`))
				.pipe(take(1))
				.subscribe({
					next: (res) => resolve(res),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: necessary
	private async post<T>(endpoint: string, body: any): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.post<T>(encodeURI(`${this.API_URL}${endpoint}`), body)
				.pipe(take(1))
				.subscribe({
					next: (res) => resolve(res),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	// biome-ignore lint/suspicious/noExplicitAny: necessary
	private async delete<T>(endpoint: string, body: any): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.http
				.request<void>("delete", encodeURI(`${this.API_URL}${endpoint}`), {
					body,
				})
				.pipe(take(1))
				.subscribe({
					next: () => resolve(),
					error: (err: HttpErrorResponse) => reject(err),
				});
		});
	}

	/* USER STUFF */

	async getMyProfilePicture(): Promise<{ profilePicture: string }> {
		return this.get<{ profilePicture: string }>("/user/my-profile-picture");
	}

	async getOtherProfilePicture(
		username: string,
	): Promise<{ profilePicture: string }> {
		return this.get<{ profilePicture: string }>(
			`/user/profile-picture/${username}`,
		);
	}

	/* FRIEND STUFF */

	async getConnections(): Promise<{
		connections: FriendsTable[];
		incomingRequests: FriendsTable[];
	}> {
		return this.get<{
			connections: FriendsTable[];
			incomingRequests: FriendsTable[];
		}>("/friends/connections");
	}

	async getSentRequests(): Promise<FriendsTable[]> {
		return this.get<FriendsTable[]>("/friends/sent-requests");
	}

	async requestFriend(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/request", { friend: username });
	}

	async acceptFriendRequest(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/accept", { friend: username });
	}

	async removeFriend(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/remove", { friend: username });
	}

	async withdrawFriendRequest(username: string): Promise<FriendsTable | null> {
		return this.post<FriendsTable>("/friends/withdraw", { friend: username });
	}

	/* STOCK LIST STUFF */

	async getUserStockLists(): Promise<StocksList[]> {
		return this.get<StocksList[]>("/stock-list");
	}

	async createStockList(
		stockListName: string,
		isPrivate: boolean,
	): Promise<{ stockList: StocksList }> {
		return this.post("/stock-list/create", {
			stock_list_name: stockListName,
			private: isPrivate,
		});
	}

	async deleteStockList(stockListName: string): Promise<void> {
		return this.delete<void>("/stock-list/delete", {
			stock_list_name: stockListName,
		});
	}

	async getPrivateStockListsSharedWithUser(
		username: string,
	): Promise<StocksList[]> {
		return this.get<StocksList[]>(`/stock-list/private-shared/${username}`);
	}

	async getPublicStockLists(): Promise<StocksList[]> {
		return this.get<StocksList[]>("/stock-list/public");
	}

	/* PORTFOLIO STUFF */

	async getUserPortfolios(): Promise<Portfolio[]> {
		return this.get<Portfolio[]>("/portfolio");
	}

	async createPortfolio(
		portfolioName: string,
		initialDeposit: number,
	): Promise<{ portfolio: Portfolio }> {
		return this.post("/portfolio/create", {
			portfolio_name: portfolioName,
			initialDeposit,
		});
	}

	async deletePortfolio(portfolioName: string): Promise<void> {
		return this.delete("/portfolio/delete", {
			portfolio_name: portfolioName,
		});
	}
}
