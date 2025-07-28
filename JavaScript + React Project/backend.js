var express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
var app = express();

const uri = "mongodb+srv://oliviacdixon2:GJpNhW6O4bxjSMhp@cluster0.iwe3v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(uri);

async function run() {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
}
run().catch(console.dir);

const collection = client.db("CapstoneProject").collection("Books");

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend.html'));
})

app.get('/books', async (req, res) => {
  const { avail } = req.query;

  try {
    if (avail === "true" || avail === "false") {
      const status = avail === "true";
      const queryList = await collection 
        .find({ avail: status }) 
        .project({ _id: 0, id: 1, title: 1, author: 1 }) 
        .toArray();
      res.json(queryList);
    } else {
      const generalList = await collection
        .find()
        .project({ _id: 0, id: 1, title: 1, author: 1 })
        .toArray();

      res.status(200).json(generalList);
    }
  } catch (error) {
    console.error("Error fetching books: ", error);
    res.status(500).send({ message: "Error fetching books" });
  }
});

app.get('/books/:id', async (req, res) => {
  const bookId = req.params.id;
  
  try {
    const match = await collection.findOne({ id: bookId }, { projection: { _id: 0 } });
    
    if (!match) {
      res.status(404).send({ message: "Book not found"})
    } else {
      res.status(200).json(match);
    }
  } catch (error) {
    console.error("Error fetching book: ", error);
    res.status(500).send({ message: "Error fetching book" });
  }
});

app.post('/books', async (req, res) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const newBook = JSON.parse(body);

      const idConflict = await collection.findOne({ id: newBook.id });

      if (idConflict) {
        return res.status(403).send({ message: "ID already exists" });
      } 

      const result = await collection.insertOne(newBook);

      if (result.acknowledged) {
        res.status(201).send({ message: "New book added" });
      } else {
        res.status(500).send({ message: "Error adding book" });
      }
    } catch (error) {
      console.error("Error parsing body: ", error);
      res.status(400).send({ message: "Invalid JSON" });
    }
  });
});

app.post('/check-out/:id', async (req, res) => { // handles check out request
  const bookId = req.params.id;
  const { name } = req.body;

  try {
    const book = await collection.findOne({ id: bookId });

    if (book && book.avail) {
      const updateResult = await collection.updateOne(
        { id: bookId },
        { $set: { avail: false, who: name } }
      );

      if (updateResult.modifiedCount > 0) {
        res.status(200).send({ message: 'Book checked out successfully' });
      } else {
        res.status(500).send('Failed to update book');
      }
    } else {
      res.status(400).send('Book is already checked out or not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.post('/check-in/:id', async (req, res) => { // handles check in request
  const bookId = req.params.id;

  try {
    const book = await collection.findOne({ id: bookId });

    if (book && !book.avail) {
      const updateResult = await collection.updateOne(
        { id: bookId },
        { $set: { avail: true, who: 'N/A' } }
      );

      if (updateResult.modifiedCount > 0) {
        res.status(200).send({ message: 'Book checked out successfully' });
      } else {
        res.status(500).send('Failed to update book');
      }
    } else {
      res.status(400).send('Book is already checked out or not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.put('/books/:id', async (req, res) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const updatedData = JSON.parse(body);
      const bookId = req.params.id;

      const update = await collection.findOneAndUpdate( 
        { id: bookId },
        { $set: updatedData },
        { returnDocument: "after" }
      );

      res.status(200).send({ message: "Book updated successfully" });
    } catch (error) {
      console.error("Error updating book: ", error);
      res.status(400).send({ message: "Error updating book" });
    }
  })
});

app.delete('/books/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    const result = await collection.deleteOne({ id: bookId });
    
    if (result.deletedCount === 0) { 
      return res.status(204).send({ message: "No content" });
    }

    res.status(200).send({ message: "Book deleted" });
  } catch (error) {
    console.error("Error deleting book: ", error);
    res.status(500).send({ message: "Error deleting book" })
  }
});

app.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods',
             'GET,PUT,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',
             'Content-Type, Authorization, Content-Length, X-Requested-With');
  if (req.method === "OPTIONS") res.sendStatus(200);
  else next();
});

app.listen(3000);