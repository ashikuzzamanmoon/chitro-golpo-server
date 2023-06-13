const express = require('express');
const cors = require('cors');
const app = express();
const jwt=require("jsonwebtoken")
require('dotenv').config();
// const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// verifyJwt middleware

const verifyJwt=(req,res,next)=>{
  const authorization=req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error:true,message:"unauthorize access"})
  }
  // bearer token
  const token=authorization.split(" ")[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res
      .status(401)
      .send({error:true,message:"unauthorize access"})
    }
    req.decoded=decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zjtbp3d.mongodb.net/?retryWrites=true&w=majority`;

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

    
    const classCollection = client.db('chitroGolpoDB').collection('classes')
    const userCollection = client.db('chitroGolpoDB').collection('users')
    const cartCollection=client.db('chitroGolpoDB').collection('carts')
    const paymentCollection = client.db("chitroGolpoDB").collection("payments");

  

    // make jwt token
    app.post("/jwt",(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'2h',
      });
      res.send({token})
    })
                                  

    // classes post
    app.post("/classes",async(req,res)=>{
      const MyClass=req.body;
      const result=await classCollection.insertOne(MyClass);
      res.send(result)
    })

    // classes api
    app.get('/classes/:allClass', async (req, res) => {
      const allClass=req.params.allClass;
      if(allClass==='true')
      {
        const result = await classCollection.find().toArray();
        res.send(result);

      }
      else
      {
        const query={status:'approved'}
        const result = await classCollection.find(query).toArray();
        res.send(result);
      }
    })
    app.get("/classes",async(req,res)=>{
      const email=req.query.email;
      const query={email:email}
      const result=await classCollection.find(query).toArray();
      res.send(result)
    })

    app.patch("/classes/:id",async(req,res)=>{
      const id=req.params.id;
      const data=req.body;
      const query={_id:new ObjectId(id)}
      const updateDoc = {
        $set: {
          status:data.i===true?'approved':'denied'
        },
      };
      const result=await classCollection.updateOne(query,updateDoc);
      res.send(result)
    })

    // users api
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    
    app.get('/users', async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })


    app.patch('/users/admin/:id', async(req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // admin
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


    // instructor
    app.get('/users/instructor/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
      res.send(result);
    })

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


   
    // // cart
    app.post("/carts",async(req,res)=>{
      const data=req.body;
      const result=await cartCollection.insertOne(data);
      res.send(result);
    });

    // app.get("/carts/:id",async(req,res)=>{
    //   const id=req.params.id;
    //   const query ={_id:new ObjectId(id)};
    //   const result=await cartCollection.findOne(query);
    //   res.send(result)
    // })
    // app.get("/carts",async(req,res)=>{
    //   const email=req.query.email;
    //   const query={email:email};
    //   const result=await cartCollection.find(query).toArray();
    //   res.send(result);
    // })

    // //  intent api
    // app.post('/create-payment-intent', verifyJWT, async (req, res) => {
    //   const { price } = req.body;
    //   const amount = parseInt(price * 100);
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: 'usd',
    //     payment_method_types: ['card']

    //   });

    //   res.send({
    //     clientSecret: paymentIntent.client_secret
    //   })
    // })

    // // payment api
    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;
    //   const insertResult = await paymentCollection.insertOne(payment);

    //   // const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
    //   // const deleteResult = await cartCollection.deleteMany(query)
    //   const query={_id:new ObjectId(payment.cartId)}
    //   const deleted=await dataCollection.deleteOne(query);
    //   const AllSeat=payment.seats-1;
    //   const enrolled=payment.Students+1;
    //   const filter={_id:new ObjectId(payment.classId)}
    //   const doc={
    //     $set:{
    //       seats:AllSeat,
    //       allStudents:enrolled
    //     },
    //   };
    //   const update=await classes.updateOne(filter,doc)
    //   res.send({ insertResult, deleteResult,update });
    // })

    // app.get('/payments',async(req,res)=>{
    //   const result=await paymentCollection.find().toArray();
    //   res.send(result)
    // })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('ChitroGolpo is running')
})

app.listen(port, () => {
  console.log(`ChitroGolpo is running on port ${port}`);
})