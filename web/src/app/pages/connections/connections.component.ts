import { Component, type OnInit } from "@angular/core";
import { ToastModule } from "primeng/toast";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import type { FriendsTable } from "@models/friends-table";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { ApiService } from "@services/api.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import type { HttpErrorResponse } from "@angular/common/http";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { AuthService } from "@services/auth.service";
import { ConfirmDialogModule } from "primeng/confirmdialog";
// biome-ignore lint/style/useImportType: Angular needs the whole module for elements passed in constructor
import { Router } from "@angular/router";
import { AutoCompleteModule } from "primeng/autocomplete";
import type { User } from "@models/user";

@Component({
	selector: "app-connections",
	standalone: true,
	imports: [
		ToastModule,
		TableModule,
		CommonModule,
		FormsModule,
		InputTextModule,
		ButtonModule,
		ConfirmDialogModule,
		AutoCompleteModule,
	],
	providers: [ConfirmationService, MessageService],
	templateUrl: "./connections.component.html",
	styles: "",
})
export class ConnectionsComponent implements OnInit {
	connections: FriendsTable[] = [];
	incomingRequests: FriendsTable[] = [];
	sentRequests: FriendsTable[] = [];
	newFriend: User | null = null;
	filteredUsers: User[] = [];
	myId = "";

	constructor(
		private apiService: ApiService,
		private authService: AuthService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService,
		private router: Router,
	) {}

	ngOnInit(): void {
		this.authService.getCredentials().subscribe((user) => {
			this.myId = user.username;
		});
		this.loadConnections();
		this.loadSentRequests();
	}

	async loadConnections() {
		try {
			const { connections, incomingRequests } =
				await this.apiService.getConnections();
			this.connections = connections;
			this.incomingRequests = incomingRequests;
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async searchUsers(event: any) {
		try {
			const query = event.query;
			const response = await this.apiService.searchForPotentialFriends(query);
			this.filteredUsers = response.users;
			console.log(this.filteredUsers);
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async loadSentRequests() {
		try {
			this.sentRequests = await this.apiService.getSentRequests();
		} catch (error) {
			this.messageService.add({
				severity: "error",
				summary: "Error",
				detail: (error as HttpErrorResponse).error.error,
			});
		}
	}

	async addFriend() {
		if (!this.newFriend) {
			return;
		}
		const newFriendUsername = this.newFriend.username;
		if (newFriendUsername.trim()) {
			try {
				await this.apiService.requestFriend(newFriendUsername);
				this.logSuccess(
					"Friend Request Sent",
					`Friend request sent to ${newFriendUsername}`,
				);

				this.loadSentRequests(); // Reload sent requests to reflect the new request
			} catch (error) {
				this.logError((error as HttpErrorResponse).error.error);
			} finally {
				this.newFriend = null;
			}
		}
	}

	goToUserPage(username: string) {
		this.router.navigate([`/user/id/${username}`]);
	}

	async acceptRequest(request: FriendsTable) {
		try {
			await this.apiService.acceptFriendRequest(request.requesting_friend);
			this.logSuccess(
				"Friend Request Accepted",
				`Friend request from ${request.requesting_friend} accepted`,
			);
			this.loadConnections(); // Reload connections to reflect the new connection
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async removeConnection(connection: FriendsTable) {
		try {
			console.log(
				connection.receiving_friend,
				this.myId,
				connection.receiving_friend === this.myId,
			);
			await this.apiService.removeFriend(
				connection.receiving_friend === this.myId
					? connection.requesting_friend
					: connection.receiving_friend,
			);
			this.logSuccess(
				"Connection Removed",
				`Connection with ${connection.receiving_friend === this.myId ? connection.requesting_friend : connection.receiving_friend} removed`,
			);
			this.loadConnections(); // Reload connections to reflect the removed connection
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
	}

	async withdrawRequest(request: FriendsTable) {
		try {
			await this.apiService.withdrawFriendRequest(request.receiving_friend);
			this.logSuccess(
				"Friend Request Withdrawn",
				`Friend request to ${request.receiving_friend} withdrawn`,
			);
			this.loadSentRequests(); // Reload sent requests to reflect the new request
		} catch (error) {
			this.logError((error as HttpErrorResponse).error.error);
		}
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

	confirmAccept(request: FriendsTable) {
		this.confirmationService.confirm({
			message: "Are you sure you want to accept this friend request?",
			accept: () => {
				this.acceptRequest(request);
			},
		});
	}

	confirmRemove(connection: FriendsTable) {
		this.confirmationService.confirm({
			message: "Are you sure you want to remove this connection?",
			accept: () => {
				this.removeConnection(connection);
			},
		});
	}

	confirmWithdraw(request: FriendsTable) {
		this.confirmationService.confirm({
			message: "Are you sure you want to withdraw this friend request?",
			accept: () => {
				this.withdrawRequest(request);
			},
		});
	}
}
