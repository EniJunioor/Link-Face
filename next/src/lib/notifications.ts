/**
 * Sistema de notificações básico
 */

import { logger } from './logger';

export interface NotificationOptions {
  email?: string;
  phone?: string;
  message: string;
  subject?: string;
}

/**
 * Envia notificação por email (implementação básica)
 */
async function sendEmail(options: NotificationOptions): Promise<boolean> {
  try {
    // Implementação básica - em produção use SendGrid, Resend, etc.
    const emailService = process.env.EMAIL_SERVICE;
    
    if (emailService === 'console') {
      logger.info('📧 Email enviado (console)', {
        to: options.email,
        subject: options.subject,
        message: options.message
      });
      return true;
    }

    // Aqui você pode integrar com SendGrid, Resend, AWS SES, etc.
    logger.warn('Serviço de email não configurado', { emailService });
    return false;
  } catch (error: any) {
    logger.error('Erro ao enviar email', error);
    return false;
  }
}

/**
 * Envia notificação por SMS (implementação básica)
 */
async function sendSMS(options: NotificationOptions): Promise<boolean> {
  try {
    // Implementação básica - em produção use Twilio, AWS SNS, etc.
    const smsService = process.env.SMS_SERVICE;
    
    if (smsService === 'console') {
      logger.info('📱 SMS enviado (console)', {
        to: options.phone,
        message: options.message
      });
      return true;
    }

    // Aqui você pode integrar com Twilio, AWS SNS, etc.
    logger.warn('Serviço de SMS não configurado', { smsService });
    return false;
  } catch (error: any) {
    logger.error('Erro ao enviar SMS', error);
    return false;
  }
}

/**
 * Envia notificação (email ou SMS)
 */
export async function sendNotification(options: NotificationOptions): Promise<{ email: boolean; sms: boolean }> {
  const results = {
    email: false,
    sms: false
  };

  if (options.email) {
    results.email = await sendEmail(options);
  }

  if (options.phone) {
    results.sms = await sendSMS(options);
  }

  return results;
}

/**
 * Notifica sobre nova submissão
 */
export async function notifyNewSubmission(data: {
  employeeName?: string;
  employeeEmail?: string;
  employeePhone?: string;
  clientName: string;
  clientCpf: string;
}): Promise<void> {
  const message = `Nova submissão recebida:\nCliente: ${data.clientName}\nCPF: ${data.clientCpf}`;
  const subject = 'Nova Submissão - Link-Face';

  await sendNotification({
    email: data.employeeEmail,
    phone: data.employeePhone,
    message,
    subject
  });
}

