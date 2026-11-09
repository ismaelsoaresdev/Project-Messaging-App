const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const messagesRouter = require('./routes/messages');
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());
app.use(cors());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRouter);
app.use('/api/users', usersRouter);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Messaging App API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});