const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());





// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.08goo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.08goo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Middleware by myself
const logger = async(req, res, next) => {
  console.log('called', req.host, req.originalUrl);
  next();
}

const verifyToken = async(req, res, next) => {
  const token = req.cookies?.token;
  console.log('value of token in middleware', token);
  if(!token){
    return res.status(401).send({message: 'Not Authorized'});
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    // error
    if(err){
      console.log(err);
      return res.status(401).send({message: 'Unauthorized'});
    }
    // if token is valid then it would be decoded
    console.log('Value in the token', decoded);
    req.user = decoded;
    next();
  });
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');

    // Auth related api
    app.post('/jwt', logger, async(req, res) => {
      const user = req.body;
      console.log(user);

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });

      res
      .cookie('token', token, {
        httpOnly: true,
        secure: false
      })
      .send({success: true});
    });

    // Services related api
    app.get('/services', logger, async(req, res) => {
        const cursor = servicesCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    // Single services related api
    app.get('/services/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const options = {
            // Include only the `title` and `imdb` fields in the returned document
            projection: { title: 1, img: 1, price: 1 }
          };
        const result = await servicesCollection.findOne(query, options);
        res.send(result);
    });

    // Bookings
    app.get('/totalbookings', logger, verifyToken, async(req, res) => {
        // console.log(req.query);
        // console.log('tok tok token', req.cookies.token);
        console.log('User from decoded token', req.user);
        if(req.query.email !== req.user.email){
          return res.status(403).send({message: 'Forbidden'});
        }
        let query = {}
        if(req.query?.email){
          query = {email: req.query.email}
        }else if(req.query?.mobile){
          query = {mobile: req.query.mobile}
        }
        const result = await bookingCollection.find(query).toArray();
        res.send(result);
    });

    // Delete Bookings
    app.delete('/totalbookings/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Update Bookings
    app.patch('/totalbookings/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updatedBooking = req.body;
      // console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status
        },
      };
      const result = await bookingCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.post('/booking', async(req, res) => {
        const booking = req.body;
        // console.log(booking);
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
    });


    app.get('/bookings', async(req, res) => {
        const cursor = bookingCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.log);





app.get('/', (req, res) => {
    res.send("Car Doctor Running...!");
});

app.listen(port, () => {
    console.log(`Car Doctor Server Running on Port ${port}`);
});