const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const secret = process.env.ACCESS_TOKEN_SECRET;
const stripe = require("stripe")(process.env.SECRET_KEY);
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
		const bookingsColl = client.db("BistroBossDB").collection("bookings");
		const cartsColl = client.db("BistroBossDB").collection("carts");
		const menuColl = client.db("BistroBossDB").collection("menu");
		const paymentsColl = client.db("BistroBossDB").collection("payments");
		const reviewsColl = client.db("BistroBossDB").collection("reviews");
		const usersColl = client.db("BistroBossDB").collection("users");

		//

		const verifyToken = (req, res, next) => {
			if (!req.headers.authorization) {
				return res.status(401).send({ message: "unauthorized access" });
			}

			const token = req.headers.authorization.split(" ")[1];

			jwt.verify(token, secret, (error, decoded) => {
				if (error) {
					return res
						.status(401)
						.send({ message: "unauthorized access" });
				}

				req.decoded = decoded;
				next();
			});
		};

		const verifyAdmin = async (req, res, next) => {
			const user = await usersColl.findOne({ email: req.decoded.email });

			if (user?.role !== "admin") {
				return res.status(403).send({ message: "forbidden access" });
			}

			next();
		};

		app.post("/auth", (req, res) => {
			const token = jwt.sign(req.body, secret, { expiresIn: "1h" });
			res.send({ token });
		});

		//

		app.get("/menu", async (req, res) => {
			const result = await menuColl.find().toArray();
			res.send(result);
		});

		app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
			const result = await menuColl.insertOne(req.body);
			res.send(result);
		});

		app.patch("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
			const _id = new ObjectId(req.params.id);
			const update = { $set: req.body };
			const result = await menuColl.updateOne({ _id }, update);
			res.send(result);
		});

		app.delete("/menu/:id", verifyToken, verifyAdmin, async (req, res) => {
			const _id = new ObjectId(req.params.id);
			const result = await menuColl.deleteOne({ _id });
			res.send(result);
		});

		//

		app.get("/reviews", async (req, res) => {
			const result = await reviewsColl.find().toArray();
			res.send(result);
		});

		app.get("/reviews/:email", async (req, res) => {
			const { email } = req.params;
			const result = await reviewsColl.findOne({ email });
			res.send(result);
		});

		app.post("/reviews", verifyToken, async (req, res) => {
			const result = await reviewsColl.insertOne(req.body);
			res.send(result);
		});

		app.patch("/reviews/:email", verifyToken, async (req, res) => {
			const { email } = req.params;
			const update = { $set: req.body };
			const result = await reviewsColl.updateOne({ email }, update);
			res.send(result);
		});

		//

		app.get("/carts/:email", verifyToken, async (req, res) => {
			const { email } = req.params;
			const result = await cartsColl.find({ email }).toArray();
			res.send(result);
		});

		app.post("/carts", verifyToken, async (req, res) => {
			const result = await cartsColl.insertOne(req.body);
			res.send(result);
		});

		app.delete("/carts/:id", verifyToken, async (req, res) => {
			const _id = new ObjectId(req.params.id);
			const result = await cartsColl.deleteOne({ _id });
			res.send(result);
		});

		//

		app.get("/bookings/:email", verifyToken, async (req, res) => {
			const { email } = req.params;
			const result = await bookingsColl.find({ email }).toArray();
			res.send(result);
		});

		app.get("/bookings", verifyToken, verifyAdmin, async (req, res) => {
			const result = await bookingsColl.find().toArray();
			res.send(result);
		});

		app.post("/bookings", verifyToken, async (req, res) => {
			const result = await bookingsColl.insertOne(req.body);
			res.send(result);
		});

		app.delete("/bookings/:id", verifyToken, async (req, res) => {
			const _id = new ObjectId(req.params.id);
			const result = await bookingsColl.deleteOne({ _id });
			res.send(result);
		});

		//

		app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
			const result = await usersColl.find().toArray();
			res.send(result);
		});

		app.post("/users", async (req, res) => {
			const { email } = req.body;
			const update = { $set: req.body };
			const upsert = { upsert: true };
			const result = await usersColl.updateOne({ email }, update, upsert);
			res.send(result);
		});

		app.get("/admin/:email", verifyToken, async (req, res) => {
			if (req.decoded.email !== req.params.email) {
				return res.status(403).send({ message: "forbidden access" });
			}

			const user = await usersColl.findOne({ email: req.params.email });
			const isAdmin = user?.role === "admin" ? true : false;
			res.send({ isAdmin });
		});

		app.patch("/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
			const _id = new ObjectId(req.params.id);
			const update = { $set: { role: "admin" } };
			const result = await usersColl.updateOne({ _id }, update);
			res.send(result);
		});

		app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
			const _id = new ObjectId(req.params.id);
			const result = await usersColl.deleteOne({ _id });
			res.send(result);
		});

		//

		app.get("/payments/:email", verifyToken, async (req, res) => {
			const { email } = req.params;
			const result = await paymentsColl.find({ email }).toArray();
			res.send(result);
		});

		app.post("/create-payment-intent", verifyToken, async (req, res) => {
			const amount = parseInt(req.body.price * 100);
			const payment_method_types = ["card"];
			const intent = { amount, currency: "usd", payment_method_types };
			const paymentIntent = await stripe.paymentIntents.create(intent);
			res.send({ clientSecret: paymentIntent.client_secret });
		});

		app.post("/payments", verifyToken, async (req, res) => {
			const result = await paymentsColl.insertOne(req.body);
			const objectIDs = req.body.dataIDs.map((id) => new ObjectId(id));
			const filter = { _id: { $in: objectIDs } };

			if (req.body.category === "Food Order") {
				await cartsColl.deleteMany(filter);
			} else if (req.body.category === "Table Booking") {
				const update = { $set: { paid: true } };
				await bookingsColl.updateMany(filter, update);
			}

			res.send(result);
		});

		app.get("/stats/admin", verifyToken, verifyAdmin, async (req, res) => {
			const customers = await usersColl.estimatedDocumentCount();
			const products = await menuColl.estimatedDocumentCount();
			const orders = await paymentsColl.estimatedDocumentCount();

			const total = await paymentsColl
				.aggregate([
					{ $group: { _id: null, revenue: { $sum: "$price" } } },
				])
				.toArray();

			const sold = await paymentsColl
				.aggregate([
					{ $unwind: "$menuIDs" },
					{
						$lookup: {
							from: "menu",
							let: { menuID: { $toObjectId: "$menuIDs" } },
							pipeline: [
								{
									$match: {
										$expr: { $eq: ["$_id", "$$menuID"] },
									},
								},
							],
							as: "item",
						},
					},
					{ $unwind: "$item" },
					{
						$group: {
							_id: "$item.category",
							quantity: { $sum: 1 },
							revenue: { $sum: "$item.price" },
						},
					},
					{ $sort: { _id: 1 } },
					{
						$project: {
							_id: 0,
							category: "$_id",
							quantity: "$quantity",
							revenue: "$revenue",
						},
					},
				])
				.toArray();

			res.send({
				customers,
				orders,
				products,
				sold,
				totalRevenue: total[0] ? total[0].revenue : 0,
			});
		});

		app.get("/stats/user/:email", verifyToken, async (req, res) => {
			const { email } = req.params;
			const bookings = await bookingsColl.countDocuments({ email });
			const cart = await cartsColl.countDocuments({ email });
			const payments = await paymentsColl.countDocuments({ email });
			res.send({ bookings, cart, payments });
		});
	} finally {
		// await client.close();
	}
};

run();

app.listen(port, () => {
	console.log(`Listening to port ${port}`);
});
