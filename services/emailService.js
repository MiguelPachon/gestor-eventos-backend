import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Configurar SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email de confirmación de inscripción
export const sendRegistrationConfirmation = async (userEmail, userName, eventDetails) => {
  const msg = {
    to: userEmail,
    from: process.env.EMAIL_USER, // Debe ser el email verificado en SendGrid
    subject: `✅ Confirmación de inscripción - ${eventDetails.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">¡Inscripción Confirmada! 🎉</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151;">
            Te has inscrito exitosamente al evento:
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea;">
            <h2 style="color: #9333ea; margin-top: 0;">${eventDetails.title}</h2>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📅 Fecha:</strong> ${new Date(eventDetails.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📍 Ubicación:</strong> ${eventDetails.location}
            </p>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📝 Categoría:</strong> ${eventDetails.category}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            Recibirás recordatorios automáticos 7 días antes y 1 día antes del evento.
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            ¡Nos vemos en el evento! 👋
          </p>
        </div>
        
        <div style="background-color: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            EventHub - Plataforma de Gestión de Eventos
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email de confirmación enviado a ${userEmail}`);
  } catch (error) {
    console.error('❌ Error enviando email:', error.response?.body || error.message);
    throw error;
  }
};

// Email de recordatorio (7 días antes)
export const sendWeekReminder = async (userEmail, userName, eventDetails) => {
  const msg = {
    to: userEmail,
    from: process.env.EMAIL_USER,
    subject: `⏰ Recordatorio: ${eventDetails.title} - Queda 1 semana`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ ¡Falta una semana!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
          
          <p style="font-size: 16px; color: #374151;">
            Te recordamos que falta <strong>1 semana</strong> para el evento:
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h2 style="color: #9333ea; margin-top: 0;">${eventDetails.title}</h2>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📅 Fecha:</strong> ${new Date(eventDetails.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📍 Ubicación:</strong> ${eventDetails.location}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            Asegúrate de estar preparado/a para este increíble evento. ¡Te esperamos!
          </p>
        </div>
        
        <div style="background-color: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            EventHub - Plataforma de Gestión de Eventos
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Recordatorio de 1 semana enviado a ${userEmail}`);
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error.response?.body || error.message);
  }
};

// Email de recordatorio (1 día antes)
export const sendDayReminder = async (userEmail, userName, eventDetails) => {
  const msg = {
    to: userEmail,
    from: process.env.EMAIL_USER,
    subject: `🔥 ¡Mañana es el evento! - ${eventDetails.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔥 ¡El evento es MAÑANA!</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Hola <strong>${userName}</strong>,</p>
          
          <p style="font-size: 18px; color: #dc2626; font-weight: bold;">
            ¡El evento es MAÑANA! 🎯
          </p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h2 style="color: #9333ea; margin-top: 0;">${eventDetails.title}</h2>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📅 Fecha:</strong> ${new Date(eventDetails.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📍 Ubicación:</strong> ${eventDetails.location}
            </p>
            <p style="color: #6b7280; margin: 10px 0;">
              <strong>📝 Categoría:</strong> ${eventDetails.category}
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              💡 <strong>Tip:</strong> Llega con 15 minutos de anticipación y no olvides tu entusiasmo!
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            ¡Nos vemos mañana! 🎉
          </p>
        </div>
        
        <div style="background-color: #374151; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            EventHub - Plataforma de Gestión de Eventos
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Recordatorio de 1 día enviado a ${userEmail}`);
  } catch (error) {
    console.error('❌ Error enviando recordatorio:', error.response?.body || error.message);
  }
};