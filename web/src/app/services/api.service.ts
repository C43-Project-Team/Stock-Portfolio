// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import environment from "@environment";
import type { FriendsTable } from "@models/friends-table";
import { catchError, take, throwError } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class ApiService {
	private readonly API_URL = environment.api_url;

	constructor(private http: HttpClient) {}

	private handleError(error: HttpErrorResponse) {
		if (error.status === 0) {
			// A client-side or network error occurred. Handle it accordingly.
			console.error("An error occurred:", error.error);
		} else {
			// The backend returned an unsuccessful response code.
			// The response body may contain clues as to what went wrong.
			console.error(
				`Backend returned code ${error.status}, body was: `,
				error.error,
			);
		}
		// Return an observable with a user-facing error message.
		return throwError(
			() => new Error("Something bad happened; please try again later."),
		);
	}

	private async get<T>(endpoint: string): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.get<T>(encodeURI(`${this.API_URL}${endpoint}`))
				.pipe(
					catchError(this.handleError), // then handle the error
					take(1),
				)
				.subscribe({
					next: (res) => resolve(res),
					error: (err) => reject(err),
				});
		});
	}

	private async post<T>(endpoint: string, body: any): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			this.http
				.post<T>(encodeURI(`${this.API_URL}${endpoint}`), body)
				.pipe(
					catchError(this.handleError), // then handle the error
					take(1),
				)
				.subscribe({
					next: (res) => resolve(res),
					error: (err) => reject(err),
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
}
