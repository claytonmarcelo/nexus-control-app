import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const hasSmtpConfiguration = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = hasSmtpConfiguration
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export const sendPasswordResetEmail = async ({ email, token }) => {
  if (!transporter) return false;

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recuperar-senha?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Nexus Control | Recuperação de senha',
    text: `Use este link para redefinir sua senha: ${resetUrl}\n\nO link expira em 30 minutos.`,
    html: `<p>Recebemos uma solicitação para redefinir sua senha do Nexus Control.</p><p><a href="${resetUrl}">Redefinir minha senha</a></p><p>Este link expira em 30 minutos.</p>`,
  });

  return true;
};
