export interface Review {
	reviewer: string;
	stock_list_owner: string;
	stock_list_name: string;
	content: string;
	rating: number;
	review_creation_time: Date;
	review_last_updated: Date | null;
}
