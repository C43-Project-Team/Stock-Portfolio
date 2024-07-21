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
	],
	providers: [ConfirmationService, MessageService],
	templateUrl: "./connections.component.html",
	styles: "",
})
export class ConnectionsComponent implements OnInit {
	connections: FriendsTable[] = [];
	incomingRequests: FriendsTable[] = [];
	sentRequests: FriendsTable[] = [];
	newFriendUsername = "";

	constructor(
		private apiService: ApiService,
		private confirmationService: ConfirmationService,
		private messageService: MessageService,
	) {}

	ngOnInit(): void {
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
		if (this.newFriendUsername.trim()) {
			try {
				await this.apiService.requestFriend(this.newFriendUsername);
				this.messageService.add({
					severity: "success",
					summary: "Friend Request Sent",
					detail: `Friend request sent to ${this.newFriendUsername}`,
				});
				this.newFriendUsername = "";
				this.loadSentRequests(); // Reload sent requests to reflect the new request
			} catch (error) {
				this.messageService.add({
					severity: "error",
					summary: "Error",
					detail: (error as HttpErrorResponse).error.error,
				});
			}
		}
	}

	acceptRequest(request: FriendsTable) {
		// Implement the accept friend request logic here
	}

	removeConnection(connection: FriendsTable) {
		// Implement the remove friend logic here
	}

	withdrawRequest(request: FriendsTable) {
		// Implement the withdraw friend request logic here
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
