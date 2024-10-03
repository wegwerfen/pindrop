import dotenv from 'dotenv';
import express from 'express';
import { middleware, errorHandler } from "supertokens-node/framework/express/index.js";
import { sequelize } from './models/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import configureSupertokens from './config/supertokens.js';
import configureCors from './config/cors.js';
import authRoutes from './routes/authRoutes.js';
import pinRoutes from './routes/pinRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirnamePath = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Supertokens and CORS
configureSupertokens();
configureCors(app);

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(middleware());

// Serve static files
app.use('/uploads', express.static(path.join(__dirnamePath, 'uploads')));

// Routes (Ensure routers are not invoked)
app.use('/api/auth', authRoutes);
app.use('/api/pins', pinRoutes);
app.use('/api/user', userRoutes);

// Error Handling
app.use(errorHandler());

// Generic error handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Database connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

sequelize.sync({ alter: false }).then(() => {
  console.log('Database & tables created!');
}).catch((error) => {
  console.error('Error syncing database:', error);
});