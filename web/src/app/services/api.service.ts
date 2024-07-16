// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import environment from "@environment";
import { take } from "rxjs";

@Injectable({
	providedIn: "root",
})
export class ApiService {
	private readonly API_URL = environment.api_url;

	constructor(private http: HttpClient) {}

	private async get<T>(endpoint: string): Promise<T> {
		return new Promise<T>((res, rej) => {
			this.http
				.get<T>(encodeURI(`${this.API_URL}${endpoint}`))
				.pipe(take(1))
				.subscribe({ next: res, error: rej });
		});
	}

	private async post<T>(endpoint: string, body: any): Promise<T> {
		return new Promise<T>((res, rej) => {
			this.http
				.post<T>(encodeURI(`${this.API_URL}${endpoint}`), body)
				.pipe(take(1))
				.subscribe({ next: res, error: rej });
		});
	}

	async getProfilePicture(): Promise<{ profilePicture: string }> {
		return this.get<{ profilePicture: string }>("/auth/profile-picture");
	}
}
