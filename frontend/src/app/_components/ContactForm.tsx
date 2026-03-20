'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Mail, User, MessageSquare } from 'lucide-react';

const CONTACT_API_ROUTE = '/api/contact';
const MAX_MESSAGE_LENGTH = 2000;

const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Imię musi mieć przynajmniej 2 znaki')
    .max(100, 'Imię nie może być dłuższe niż 100 znaków'),
  email: z.string().email('Nieprawidłowy adres email').min(1, 'Adres email jest wymagany'),
  message: z
    .string()
    .min(10, 'Wiadomość musi mieć przynajmniej 10 znaków')
    .max(MAX_MESSAGE_LENGTH, 'Wiadomość nie może być dłuższa niż 2000 znaków'),
  website: z.string().default(''),
});

type ContactFormData = z.input<typeof contactSchema>;

type ContactTranslations = Record<string, string>;

type ContactSectionProps = {
  locale: string;
  translations: ContactTranslations;
};

const polishDefaults: ContactTranslations = {
  name: 'Imię i nazwisko',
  email: 'E-mail',
  message: 'Wiadomość',
  maxChars: 'Maksymalnie 2000 znaków',
  send: 'Wyślij',
  sending: 'Wysyłanie...',
  success: 'Wiadomość wysłana',
  error: 'Uzupełnij wszystkie pola.',
  sendError: 'Błąd wysyłki',
  unknownError: 'Nieznany błąd',
  title: 'Kontakt',
  description: 'Napisz wiadomość - odpowiem możliwie szybko.',
  namePlaceholder: 'Imię i nazwisko',
  emailPlaceholder: 'E-mail',
  messagePlaceholder: 'Treść wiadomości...',
};

const englishDefaults: ContactTranslations = {
  name: 'Full name',
  email: 'E-mail',
  message: 'Message',
  maxChars: 'Maximum 2000 characters',
  send: 'Send',
  sending: 'Sending...',
  success: 'Message sent',
  error: 'Fill in all fields.',
  sendError: 'Send error',
  unknownError: 'Unknown error',
  title: 'Contact',
  description: "Send a message - I'll respond as soon as possible.",
  namePlaceholder: 'Enter your full name',
  emailPlaceholder: 'Enter your email address',
  messagePlaceholder: 'Write your message here...',
};

const nameInputId = 'contact-name';
const emailInputId = 'contact-email';
const messageInputId = 'contact-message';
const websiteInputId = 'contact-website';
const nameErrorId = 'contact-name-error';
const emailErrorId = 'contact-email-error';
const messageErrorId = 'contact-message-error';
const messageHelpId = 'contact-message-help';
const statusId = 'contact-status';

function joinIds(...ids: Array<string | undefined | false>): string | undefined {
  const filtered = ids.filter(Boolean);
  return filtered.length > 0 ? filtered.join(' ') : undefined;
}

export default function ContactSection({ locale, translations }: ContactSectionProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
    defaultValues: {
      website: '',
    },
  });

  const messageLength = watch('message')?.length || 0;
  const maxLength = MAX_MESSAGE_LENGTH;
  const messageProgress = (messageLength / maxLength) * 100;

  const defaults = locale === 'pl' ? polishDefaults : englishDefaults;

  const t = (key: string) => translations[key] ?? defaults[key] ?? key;

  const onSubmit = async (data: ContactFormData) => {
    if (data.website?.trim()) {
      return;
    }

    setStatus('sending');
    setErr('');
    setProgress(0);
    let progressInterval: ReturnType<typeof setInterval> | undefined;

    try {
      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      const input = {
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      };

      const query = `
        mutation SendContact($input: ContactMessageInput!) {
          sendContact(input: $input) {
            ok
            error
          }
        }
      `;

      const r = await fetch(CONTACT_API_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { input } }),
        cache: 'no-store',
      });

      setProgress(100);

      const j = await r.json().catch(() => ({}));
      const response = j?.data?.sendContact;

      if (!r.ok || j?.errors || response?.ok !== true) {
        throw new Error(response?.error || j?.errors?.[0]?.message || t('sendError'));
      }

      setStatus('sent');
      reset();

      // Auto-hide success after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : t('unknownError'));
      setProgress(0);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-xl mx-auto space-y-6 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {t('title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('description')}</p>
      </div>

      <input
        type="hidden"
        {...register('website')}
        id={websiteInputId}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Name Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        viewport={{ once: true }}
      >
        <label
          htmlFor={nameInputId}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <User className="w-4 h-4 mr-2 text-indigo-500" />
          {t('name')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            id={nameInputId}
            {...register('name')}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none"
            placeholder={
              translations.namePlaceholder ?? translations.placeholderName ?? t('namePlaceholder')
            }
            data-testid="contact-name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={joinIds(errors.name && nameErrorId)}
          />
          <AnimatePresence>
            {errors.name && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                id={nameErrorId}
                className="absolute -bottom-6 left-0 text-red-500 text-xs flex items-center"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.name.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Email Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        viewport={{ once: true }}
      >
        <label
          htmlFor={emailInputId}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <Mail className="w-4 h-4 mr-2 text-indigo-500" />
          {t('email')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            id={emailInputId}
            type="email"
            {...register('email')}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none"
            placeholder={
              translations.emailPlaceholder ??
              translations.placeholderEmail ??
              t('emailPlaceholder')
            }
            data-testid="contact-email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={joinIds(errors.email && emailErrorId)}
          />
          <AnimatePresence>
            {errors.email && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                id={emailErrorId}
                className="absolute -bottom-6 left-0 text-red-500 text-xs flex items-center"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.email.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Message Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        viewport={{ once: true }}
      >
        <label
          htmlFor={messageInputId}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
          {t('message')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <textarea
            id={messageInputId}
            {...register('message')}
            rows={5}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none resize-none"
            placeholder={
              translations.messagePlaceholder ??
              translations.placeholderMessage ??
              t('messagePlaceholder')
            }
            data-testid="contact-message"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={joinIds(messageHelpId, messageErrorId)}
          />

          {/* Progress bar for message length */}
          <div className="absolute bottom-2 left-4 right-4" id={messageHelpId}>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
              <motion.div
                className="bg-indigo-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(messageProgress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {t('maxChars')} · {messageLength}/{maxLength}
            </p>
          </div>

          <AnimatePresence>
            {errors.message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                id={messageErrorId}
                className="absolute -bottom-12 left-0 text-red-500 text-xs flex items-center"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.message.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Submit Button with Progress */}
      <motion.div
        className="flex justify-center pt-6"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        viewport={{ once: true }}
      >
        <button
          type="submit"
          disabled={status === 'sending' || !isValid}
          className="relative w-full py-4 px-8 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
          data-testid="contact-submit"
        >
          {status === 'sending' ? (
            <>
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="animate-pulse">{t('sending')}</span>
              </div>
              <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-full">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </>
          ) : (
            t('send')
          )}
        </button>
      </motion.div>

      {/* Status Messages */}
      <AnimatePresence>
        {status === 'sent' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            id={statusId}
            className="flex items-center justify-center text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg p-4"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <CheckCircle className="w-5 h-5 mr-2 animate-bounce" />
            <span className="font-medium">{t('success')}</span>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            id={statusId}
            className="flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-4"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">{err}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
