const express = require('express');
const cors = require('cors');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); //from mongodb application code
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); // from .env document
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb application code 
console.log('User Name:', process.env.DB_USER, '&& Password:', process.env.DB_PASS,);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.afx5ss3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const galleryCollection = client.db('disneyDreamlandDoll').collection('gallery');
    const toysCollection = client.db('disneyDreamlandDoll').collection('toys');

    // indexing toy name field 
    const indexKey = { name: 1 };
    const indexField = { name: "toyName" };
    const result = await toysCollection.createIndex(indexKey, indexField);
    console.log(result);



    app.get('/gallery', async (req, res) => {
      const cursor = galleryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // all toys page data load 
    app.get("/all-toys", async (req, res) => {
      console.log(req.query);

      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.page) || 5;
      const skip = page * limit;
      const result = await toysCollection.find().skip(skip).limit(limit).toArray();
      res.send(result);
    });

    // pagination part
    app.get("/total-toys", async (req, res) => {
      const result = await toysCollection.estimatedDocumentCount();
      res.send({ totalToys: result });
    })

    // get user specific toy details 
    app.get('/my-toys/:email', async (req, res) => {
      const result = await toysCollection.find({ sellerEmail: req.params.email }).toArray();
      res.send(result);
    })

    // search by toy name 
    app.get("/toySearch/:text", async (req, res) => {
      const toy = req.params.text;
      const result = await toysCollection.find({
        name: { $regex: toy, $options: "i" }
      })
        .toArray();
      res.send(result);
    });

    // get specific toy data for view
    app.get("/all-toys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { image: 1, name: 1, price: 1, rating: 1, subcategory: 1, availableQuantity: 1, productDetails: 1, sellerEmail: 1, sellerName: 1 },
      };
      const result = await toysCollection.findOne(query, options)
      res.send(result);

    })

    // get specific toy data for update 
    app.put("/update-toys/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      console.log(body);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDetails = {
        $set: {
          price: body.price,
          availableQuantity: body.availableQuantity,
          productDetails: body.productDetails,
        },
      };
      const result = await toysCollection.updateOne(filter, updateDetails, options);
      res.send(result);

    })

    // send add toy data to server  
    app.post("/add-toy", async (req, res) => {
      const body = req.body;
      
      const result = await toysCollection.insertOne(body);
      console.log(body);
      console.log(result);
      res.send(result);
      
    });

    // delete a toy
    app.delete('/my-toys/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// connection checking 
app.get('/', (req, res) => {
  res.send(`Disney Dreamland Doll server is running `);
})

app.listen(port, () => {
  console.log(`Disney Dreamland Doll server is running on port ${port}`);
})