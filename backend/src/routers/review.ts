import { stockListDatabase } from "@/database/StockListDatabase";
import { type AuthedRequest, verifyToken } from "@/middleware/auth";
import { Router, type Response } from "express";

export const reviewRouter = Router({ mergeParams: true });

reviewRouter.post(
	"/",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const reviewer = req.user?.username;
			const { stock_list_owner, stock_list_name } = req.params;
			const { content, rating } = req.body;

			if (!reviewer || !content || rating == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			if (rating < 0 || rating > 5) {
				return res
					.status(400)
					.json({ error: "Rating must be between 0 and 5" });
			}

			await stockListDatabase.createReview(
				reviewer,
				stock_list_owner,
				stock_list_name,
				content,
				rating,
			);

			res.json({ message: "Review created successfully" });
		} catch (error) {
			if (error instanceof Error && error.message === "Access denied") {
				return res.status(403).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error creating review" });
		}
	},
);

reviewRouter.patch(
	"/",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const reviewer = req.user?.username;
			const { stock_list_owner, stock_list_name } = req.params;
			const { content, rating } = req.body;

			if (!reviewer || !content || rating == null) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			if (rating < 0 || rating > 5) {
				return res
					.status(400)
					.json({ error: "Rating must be between 0 and 5" });
			}

			await stockListDatabase.updateReview(
				reviewer,
				stock_list_owner,
				stock_list_name,
				content,
				rating,
			);

			res.json({ message: "Review updated successfully" });
		} catch (error) {
			if (error instanceof Error && error.message === "Access denied") {
				return res.status(403).json({ error: error.message });
			}
			return res.status(500).json({ error: "Error updating review" });
		}
	},
);

reviewRouter.get(
	"/",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			console.log("hello");
			const { stock_list_owner, stock_list_name } = req.params;

			console.log(stock_list_owner, stock_list_name);

			if (!stock_list_owner || !stock_list_name) {
				return res.status(400).json({ error: "Missing required parameters" });
			}

			const reviews = await stockListDatabase.getReviews(
				stock_list_owner,
				stock_list_name,
			);

			res.json(reviews);
		} catch (error) {
			return res.status(500).json({ error: "Error fetching reviews" });
		}
	},
);

reviewRouter.delete(
	"/",
	verifyToken,
	async (req: AuthedRequest, res: Response) => {
		try {
			const reviewer = req.user?.username;
			const { stock_list_owner, stock_list_name } = req.params;

			if (!reviewer) {
				return res.status(400).json({ error: "Reviewer not found" });
			}

			await stockListDatabase.deleteReview(
				reviewer,
				stock_list_owner,
				stock_list_name,
			);

			res.json({ message: "Review deleted successfully" });
		} catch (error) {
			if (error instanceof Error && error.message === "Review not found") {
				return res.status(404).json({ error: error.message });
			}
		}
	},
);
