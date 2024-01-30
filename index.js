const { MongoClient, ServerApiVersion } = require("mongodb");
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

app.get("/menu", async (req, res) => {
	try {
		await client.connect();
		const menu = client.db("BistroBossDB").collection("menu");
		const result = await menu.find().toArray();
		res.send(result);
	} finally {
		// await client.close();
	}
});

app.get("/reviews", async (req, res) => {
	try {
		await client.connect();
		const reviews = client.db("BistroBossDB").collection("reviews");
		const result = await reviews.find().toArray();
		res.send(result);
	} finally {
		// await client.close();
	}
});

app.listen(port, () => {
	console.log(`Listening to port ${port}`);
});
