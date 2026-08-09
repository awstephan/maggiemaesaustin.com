import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const environmentSchema = z.object({
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().trim().min(1),
  SMTP_PASS: z.string().min(1),
  EVENT_INQUIRY_TO: z.string().trim().min(1),
  EVENT_INQUIRY_FROM: z.string().trim().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
});

function getAustinDateTimeMinimum() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
}

function isValidLocalDateTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;

  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
    && parsed.getUTCHours() === hour
    && parsed.getUTCMinutes() === minute;
}

const inquirySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    organization: z.string().trim().max(160).default(''),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(1).max(40),
    occasion: z.string().trim().max(160).default(''),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
      .refine(isValidLocalDateTime)
      .refine((date) => date >= getAustinDateTimeMinimum()),
    guestCount: z.coerce.number().int().min(1).max(987),
    preferredSpace: z.string().trim().max(80).default(''),
    hostedBar: z.boolean().default(false),
    hostedBarAmount: z.string().trim().max(160).default(''),
    food: z.boolean().default(false),
    entertainment: z.boolean().default(false),
    band: z.boolean().default(false),
    dj: z.boolean().default(false),
    otherEntertainment: z.boolean().default(false),
    otherEntertainmentDetails: z.string().trim().max(300).default(''),
    details: z.string().trim().max(4000).default(''),
    bookingReference: z.string().max(200).default(''),
  })
  .strict()
  .superRefine((inquiry, context) => {
    if (inquiry.hostedBar && !inquiry.hostedBarAmount) {
      context.addIssue({
        code: 'custom',
        path: ['hostedBarAmount'],
        message: 'Hosted bar amount is required.',
      });
    }

    if (inquiry.entertainment && !inquiry.band && !inquiry.dj && !inquiry.otherEntertainment) {
      context.addIssue({
        code: 'custom',
        path: ['entertainment'],
        message: 'An entertainment option is required.',
      });
    }

    if (inquiry.entertainment && inquiry.otherEntertainment && !inquiry.otherEntertainmentDetails) {
      context.addIssue({
        code: 'custom',
        path: ['otherEntertainmentDetails'],
        message: 'Other entertainment details are required.',
      });
    }
  });

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatInquiry(inquiry) {
  const entertainment = [
    inquiry.band && 'Band',
    inquiry.dj && 'DJ',
    inquiry.otherEntertainment && `Other: ${inquiry.otherEntertainmentDetails}`,
  ].filter(Boolean);

  const services = [
    inquiry.hostedBar && `Hosted bar (${inquiry.hostedBarAmount})`,
    inquiry.food && 'Food',
    inquiry.entertainment && `Entertainment (${entertainment.join(', ')})`,
  ].filter(Boolean);

  const fields = [
    ['Name', inquiry.name],
    ...(inquiry.organization ? [['Organization', inquiry.organization]] : []),
    ['Email', inquiry.email],
    ['Phone', inquiry.phone],
    ...(inquiry.occasion ? [['Occasion', inquiry.occasion]] : []),
    ['Desired date and time', `${inquiry.date} America/Chicago`],
    ['Guest count', inquiry.guestCount],
    ['Preferred space', inquiry.preferredSpace || 'No preference'],
    ['Services', services.length > 0 ? services.join('; ') : 'None selected'],
  ];

  const text = [
    'Private Event Inquiry',
    '',
    ...fields.map(([label, value]) => `${label}: ${value}`),
    '',
    'Additional details:',
    inquiry.details || 'None provided',
  ].join('\n');

  const rows = fields
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:8px 16px 8px 0;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const html = `
    <h1 style="font-size:24px">Private Event Inquiry</h1>
    <table style="border-collapse:collapse">${rows}</table>
    <h2 style="font-size:18px;margin-top:24px">Additional details</h2>
    <p style="white-space:pre-wrap">${escapeHtml(inquiry.details || 'None provided')}</p>
  `;

  return { text, html };
}

async function start() {
  const parsedEnvironment = environmentSchema.safeParse(process.env);
  if (!parsedEnvironment.success) {
    console.error('Invalid SMTP environment configuration:', parsedEnvironment.error.issues.map((issue) => issue.path.join('.')).join(', '));
    process.exitCode = 1;
    return;
  }

  const environment = parsedEnvironment.data;
  const transporter = nodemailer.createTransport({
    host: environment.SMTP_HOST,
    port: environment.SMTP_PORT,
    secure: environment.SMTP_SECURE === 'true',
    requireTLS: environment.SMTP_SECURE !== 'true',
    auth: {
      user: environment.SMTP_USER,
      pass: environment.SMTP_PASS,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  await transporter.verify();

  const app = express();
  app.set('trust proxy', 'loopback');
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '16kb' }));

  app.post(
    '/api/private-event-inquiry',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
    async (request, response) => {
      const inquiryResult = inquirySchema.safeParse(request.body);
      if (!inquiryResult.success) {
        response.status(400).json({ error: 'Please check the form and try again.' });
        return;
      }

      const inquiry = inquiryResult.data;
      if (inquiry.bookingReference) {
        response.status(202).json({ ok: true });
        return;
      }

      const { text, html } = formatInquiry(inquiry);
      const safeSubjectDetail = (inquiry.occasion || `${inquiry.name} on ${inquiry.date}`).replace(/[\r\n]+/g, ' ');

      try {
        await transporter.sendMail({
          from: environment.EVENT_INQUIRY_FROM,
          to: environment.EVENT_INQUIRY_TO,
          replyTo: { name: inquiry.name, address: inquiry.email },
          subject: `Private Event Inquiry - ${safeSubjectDetail}`,
          text,
          html,
        });
        response.status(202).json({ ok: true });
      } catch (error) {
        console.error('Failed to send private event inquiry:', error instanceof Error ? error.message : 'Unknown SMTP error');
        response.status(502).json({ error: 'The inquiry could not be sent right now.' });
      }
    },
  );

  app.use((error, _request, response, _next) => {
    console.error('Private event API request failed:', error instanceof Error ? error.message : 'Unknown request error');
    response.status(400).json({ error: 'The request could not be processed.' });
  });

  app.listen(environment.PORT, '127.0.0.1', () => {
    console.log(`Private event API listening on 127.0.0.1:${environment.PORT}`);
  });
}

start().catch((error) => {
  console.error('Private event API failed to start:', error instanceof Error ? error.message : 'Unknown startup error');
  process.exitCode = 1;
});
