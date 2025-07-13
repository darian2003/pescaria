import { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});

export const getAllUmbrellas = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT u.id AS umbrella_id, u.umbrella_number,
             b.id AS bed_id, b.side, b.status
      FROM umbrellas u
      JOIN beds b ON b.umbrella_id = u.id
      ORDER BY u.umbrella_number, b.side
    `);

    // Grupăm paturile sub umbrele
    const umbrellaMap: Record<number, any> = {};

    result.rows.forEach(row => {
      const id = row.umbrella_id;

      if (!umbrellaMap[id]) {
        umbrellaMap[id] = {
          id,
          umbrella_number: row.umbrella_number,
          beds: [],
        };
      }

      umbrellaMap[id].beds.push({
        id: row.bed_id,
        side: row.side,
        status: row.status,
      });
    });

    const umbrellas = Object.values(umbrellaMap);
    res.json(umbrellas);
  } catch (err) {
    console.error('Error fetching umbrellas:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const occupyBed = async (req: Request, res: Response) => {
    const umbrellaId = parseInt(req.params.umbrellaId);
    const side = req.params.side;
  
    if (!['left', 'right'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side' });
    }
  
    try {
      const bedResult = await pool.query(
        `SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`,
        [umbrellaId, side]
      );
  
      const bed = bedResult.rows[0];
  
      if (!bed) {
        return res.status(404).json({ error: 'Bed not found' });
      }
  
      if (bed.status === 'rented') {
        return res.status(400).json({ error: 'Cannot occupy a rented bed' });
      }
  
      // Setăm statusul patului pe 'occupied'
      await pool.query(
        `UPDATE beds SET status = 'occupied' WHERE id = $1`,
        [bed.id]
      );
  
      // Inserăm acțiunea în rentals
      await pool.query(
        `INSERT INTO rentals (umbrella_id, side, started_by, action, price)
         VALUES ($1, $2, $3, 'occupy', 0)`,
        [umbrellaId, side, req.user!.id]
      );
  
      res.json({ message: 'Bed occupied' });
    } catch (err) {
      console.error('Error occupying bed:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  

  export const freeBed = async (req: Request, res: Response) => {
    const umbrellaId = parseInt(req.params.umbrellaId);
    const side = req.params.side;
  
    if (!['left', 'right'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side' });
    }
  
    try {
      const bedResult = await pool.query(
        `SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`,
        [umbrellaId, side]
      );
  
      const bed = bedResult.rows[0];
  
      if (!bed) {
        return res.status(404).json({ error: 'Bed not found' });
      }
  
      if (bed.status === 'rented') {
        return res.status(400).json({ error: 'Cannot free a rented bed' });
      }
  
      // Setăm patul ca "free"
      await pool.query(
        `UPDATE beds SET status = 'free' WHERE id = $1`,
        [bed.id]
      );
  
      // Închidem ultima acțiune de ocupare activă pentru acest pat
      await pool.query(
        `UPDATE rentals
         SET end_time = NOW(), ended_by = $1
         WHERE umbrella_id = $2 AND side = $3 AND action = 'occupy' AND end_time IS NULL`,
        [req.user!.id, umbrellaId, side]
      );
  
      res.json({ message: 'Bed freed' });
    } catch (err) {
      console.error('Error freeing bed:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  export const rentBed = async (req: Request, res: Response) => {
    const umbrellaId = parseInt(req.params.umbrellaId);
    const side = req.params.side;
    const { price } = req.body;
  
    if (!['left', 'right'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side' });
    }
  
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Invalid price' });
    }
  
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can rent beds' });
    }
  
    try {
      const bedResult = await pool.query(
        `SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`,
        [umbrellaId, side]
      );
  
      const bed = bedResult.rows[0];
  
      if (!bed) {
        return res.status(404).json({ error: 'Bed not found' });
      }
  
      if (bed.status === 'rented') {
        return res.status(400).json({ error: 'Bed already rented' });
      }
  
      // Setăm statusul pe 'rented'
      await pool.query(
        `UPDATE beds SET status = 'rented' WHERE id = $1`,
        [bed.id]
      );
  
      // Inserăm în rentals
      await pool.query(
        `INSERT INTO rentals (umbrella_id, side, started_by, action, price)
         VALUES ($1, $2, $3, 'rent', $4)`,
        [umbrellaId, side, req.user!.id, price]
      );
  
      res.json({ message: 'Bed rented successfully' });
    } catch (err) {
      console.error('Error renting bed:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  export const endRent = async (req: Request, res: Response) => {
    const umbrellaId = parseInt(req.params.umbrellaId);
    const side = req.params.side;
  
    if (!['left', 'right'].includes(side)) {
      return res.status(400).json({ error: 'Invalid side' });
    }
  
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can end rentals' });
    }
  
    try {
      const bedResult = await pool.query(
        `SELECT * FROM beds WHERE umbrella_id = $1 AND side = $2`,
        [umbrellaId, side]
      );
  
      const bed = bedResult.rows[0];
  
      if (!bed) {
        return res.status(404).json({ error: 'Bed not found' });
      }
  
      if (bed.status !== 'rented') {
        return res.status(400).json({ error: 'This bed is not currently rented' });
      }
  
      // Setăm statusul pe 'free'
      await pool.query(
        `UPDATE beds SET status = 'free' WHERE id = $1`,
        [bed.id]
      );
  
      // Completăm închirierea activă în rentals
      const updateResult = await pool.query(
        `UPDATE rentals
         SET end_time = NOW(), ended_by = $1
         WHERE umbrella_id = $2 AND side = $3 AND action = 'rent' AND end_time IS NULL`,
        [req.user!.id, umbrellaId, side]
      );
  
      if (updateResult.rowCount === 0) {
        return res.status(404).json({ error: 'No active rent found for this bed' });
      }
  
      res.json({ message: 'Rental ended and bed freed' });
    } catch (err) {
      console.error('Error ending rent:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  export const resetAllUmbrellas = async (req: Request, res: Response) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can reset the beach' });
    }
  
    try {
      // 1. Eliberăm toate paturile
      await pool.query(`UPDATE beds SET status = 'free'`);
  
      // 2. Închidem toate înregistrările deschise din rentals
      await pool.query(
        `UPDATE rentals
         SET end_time = NOW(), ended_by = $1
         WHERE end_time IS NULL`,
        [req.user!.id]
      );
  
      res.json({ message: 'All beds reset and active rentals closed' });
    } catch (err) {
      console.error('Error resetting umbrellas:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  export const generateReport = async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can view report' });
  }

  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE action = 'rent') AS rent_count,
        COUNT(*) FILTER (WHERE action = 'occupy') AS occupy_count,
        COALESCE(SUM(price) FILTER (WHERE action = 'rent'), 0) AS total_income
      FROM rentals
    `);

    const { rent_count, occupy_count, total_income } = result.rows[0];

    res.json({
      total_rents: parseInt(rent_count),
      total_occupies: parseInt(occupy_count),
      total_income: parseFloat(total_income)
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

  
  

  
  