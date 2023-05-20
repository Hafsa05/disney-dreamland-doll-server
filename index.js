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
    app.get("/all-toys", async (req, res) => {
      const result = await toysCollection.find({}).toArray()
      // .find({})
      // .sort({ createdAt: -1 })
      // .toArray();
      res.send(result);
    });

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

    // send add toy data to server  
    app.post("/add-toy", async (req, res) => {
      const body = req.body;
      // body.createdAt = new Date();
      const result = await toysCollection.insertOne(body);
      console.log(body);
      console.log(result);
      res.send(result);
      // if (result?.insertedId) {
      //   return res.status(200).send(result);
      // } else {
      //   return res.status(404).send({
      //     message: "can not insert try again leter",
      //     status: false,
      //   });
      // }
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