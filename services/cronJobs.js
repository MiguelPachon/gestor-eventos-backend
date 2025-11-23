import cron from 'node-cron';
import pool from '../db.js';
import { sendWeekReminder, sendDayReminder } from './emailService.js';


export const startReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Ejecutando tarea de recordatorios...');
    
    try {
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // ==========================================
      // RECORDATORIOS DE 7 DÍAS
      // ==========================================
      const weekReminders = await pool.query(`
        SELECT 
          e.id, e.title, e.date, e.location, e.category,
          u.email, u.name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN users u ON r.user_id = u.id
        WHERE DATE(e.date) = DATE($1)
        AND r.week_reminder_sent = false
      `, [oneWeekFromNow.toISOString().split('T')[0]]);

      console.log(`Enviando ${weekReminders.rows.length} recordatorios de 1 semana...`);

      for (const row of weekReminders.rows) {
        await sendWeekReminder(row.email, row.name, {
          title: row.title,
          date: row.date,
          location: row.location,
          category: row.category
        });

      
        await pool.query(
          'UPDATE registrations SET week_reminder_sent = true WHERE user_id = (SELECT id FROM users WHERE email = $1) AND event_id = $2',
          [row.email, row.id]
        );
      }

      // ==========================================
      // RECORDATORIOS DE 1 DÍA
      // ==========================================
      const dayReminders = await pool.query(`
        SELECT 
          e.id, e.title, e.date, e.location, e.category,
          u.email, u.name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN users u ON r.user_id = u.id
        WHERE DATE(e.date) = DATE($1)
        AND r.day_reminder_sent = false
      `, [oneDayFromNow.toISOString().split('T')[0]]);

      console.log(`Enviando ${dayReminders.rows.length} recordatorios de 1 día...`);

      for (const row of dayReminders.rows) {
        await sendDayReminder(row.email, row.name, {
          title: row.title,
          date: row.date,
          location: row.location,
          category: row.category
        });

       
        await pool.query(
          'UPDATE registrations SET day_reminder_sent = true WHERE user_id = (SELECT id FROM users WHERE email = $1) AND event_id = $2',
          [row.email, row.id]
        );
      }

      console.log('Tarea de recordatorios completada');
    } catch (error) {
      console.error('Error en tarea de recordatorios:', error);
    }
  });

  console.log('Sistema de recordatorios automáticos iniciado (se ejecuta diariamente a las 9:00 AM)');
};