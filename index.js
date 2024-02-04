const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

app.get("/", (req, res) => {
	res.redirect("https://gs-bistro-boss-frontend.vercel.app/");
});

const run = async () => {
	try {
		await client.connect();
		const menuColl = client.db("BistroBossDB").collection("menu");
		const reviewsColl = client.db("BistroBossDB").collection("reviews");
		const cartsColl = client.db("BistroBossDB").collection("carts");

		app.get("/menu", async (req, res) => {
			const result = await menuColl.find().toArray();
			res.send(result);
		});

		app.get("/reviews", async (req, res) => {
			const result = await reviewsColl.find().toArray();
			res.send(result);
		});

		app.get("/carts", async (req, res) => {
			const { email } = req.query;
			const result = await cartsColl.find({ email }).toArray();
			res.send(result);
		});

		app.post("/carts", async (req, res) => {
			const { item } = req.body;
			const result = await cartsColl.insertOne(item);
			res.send(result);
		});

		app.delete("/carts/:id", async (req, res) => {
			const { id } = req.params;
			const result = await cartsColl.deleteOne({
				_id: new ObjectId(id),
			});
			res.send(result);
		});
	} finally {
		// await client.close();
	}
};

run();

app.listen(port, () => {
	console.log(`Listening to port ${port}`);
});
