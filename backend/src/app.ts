import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import umbrellaRoutes from './routes/umbrella.routes';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/login', authRoutes);
app.use('/umbrellas', umbrellaRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
