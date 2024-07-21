// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import environment from "@environment";
import type { FriendsTable } from "@models/friends-table";
import { take } from "rxjs";

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

	/* USER STUFF */

	async getProfilePicture(): Promise<{ profilePicture: string }> {
		return this.get<{ profilePicture: string }>("/auth/profile-picture");
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
}
