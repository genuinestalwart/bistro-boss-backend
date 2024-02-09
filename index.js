const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
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
	res.redirect("https://gs-bistro-boss-restaurant.web.app/");
});

const run = async () => {
	try {
		// await client.connect();
		const menuColl = client.db("BistroBossDB").collection("menu");
		const reviewsColl = client.db("BistroBossDB").collection("reviews");
		const cartsColl = client.db("BistroBossDB").collection("carts");
		const usersColl = client.db("BistroBossDB").collection("users");

		//

		const verifyToken = (req, res, next) => {
			if (!req.headers.authorization) {
				return res.status(401).send({ message: "unauthorized access" });
			}

			const token = req.headers.authorization.split(" ")[1];
			jwt.verify(
				token,
				process.env.ACCESS_TOKEN_SECRET,
				(error, decoded) => {
					if (error) {
						return res
							.status(401)
							.send({ message: "unauthorized access" });
					}
					req.decoded = decoded;
					next();
				}
			);
		};

		const verifyAdmin = async (req, res, next) => {
			const user = await usersColl.findOne({ email: req.decoded.email });

			if (user?.role !== "admin") {
				return res.status(403).send({ message: "forbidden access" });
			}

			next();
		};

		app.post("/auth", (req, res) => {
			const token = jwt.sign(req.body, process.env.ACCESS_TOKEN_SECRET, {
				expiresIn: "1h",
			});

			res.send({ token });
		});

		//

		app.get("/menu", async (req, res) => {
			const result = await menuColl.find().toArray();
			res.send(result);
		});

		app.get("/reviews", async (req, res) => {
			const result = await reviewsColl.find().toArray();
			res.send(result);
		});

		//

		app.get("/carts", verifyToken, async (req, res) => {
			const { email } = req.query;
			const result = await cartsColl.find({ email }).toArray();
			res.send(result);
		});

		app.post("/carts", verifyToken, async (req, res) => {
			const result = await cartsColl.insertOne(req.body);
			res.send(result);
		});

		app.delete("/carts/:id", verifyToken, async (req, res) => {
			const result = await cartsColl.deleteOne({
				_id: new ObjectId(req.params.id),
			});

			res.send(result);
		});

		//

		app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
			const result = await usersColl.find().toArray();
			res.send(result);
		});

		app.post("/users", async (req, res) => {
			const result = await usersColl.updateOne(
				{ email: req.body.email },
				{ $set: req.body },
				{ upsert: true }
			);

			res.send(result);
		});

		app.get("/users/admin/:email", verifyToken, async (req, res) => {
			if (req.decoded.email !== req.params.email) {
				return res.status(403).send({ message: "forbidden access" });
			}

			const user = await usersColl.findOne({ email: req.params.email });
			const isAdmin = user?.role === "admin" ? true : false;
			res.send({ isAdmin });
		});

		app.patch(
			"/users/admin/:id",
			verifyToken,
			verifyAdmin,
			async (req, res) => {
				const result = await usersColl.updateOne(
					{ _id: new ObjectId(req.params.id) },
					{ $set: { role: "admin" } }
				);

				res.send(result);
			}
		);

		app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
			const result = await usersColl.deleteOne({
				_id: new ObjectId(req.params.id),
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
