'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, Mail, User, MessageSquare } from 'lucide-react';

const GQL_API = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

// Validation schema
const contactSchema = z.object({
  name: z.string()
    .min(2, 'Imię musi mieć przynajmniej 2 znaki')
    .max(50, 'Imię nie może być dłuższe niż 50 znaków'),
  email: z.string()
    .email('Nieprawidłowy adres email')
    .min(1, 'Adres email jest wymagany'),
  message: z.string()
    .min(10, 'Wiadomość musi mieć przynajmniej 10 znaków')
    .max(5000, 'Wiadomość nie może być dłuższa niż 5000 znaków'),
});

type ContactFormData = z.infer<typeof contactSchema>;

// Internal function for loading translations
async function loadTranslations(locale: string, section: string) {
  try {
    const messages = (await import(`../../i18n/messages/${locale}.json`)).default;
    const sectionData = messages[section] || {};
    return sectionData;
  } catch {
    return {};
  }
}

export default function ContactSection() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: 'onChange',
  });

  const messageLength = watch('message')?.length || 0;
  const maxLength = 5000;
  const messageProgress = (messageLength / maxLength) * 100;

  useEffect(() => {
    const loadContactTranslations = async () => {
      const locale = document.querySelector('#i18n-provider')?.getAttribute('data-locale') || 'pl';
      const contactTranslations = await loadTranslations(locale, 'contact');
      setTranslations(contactTranslations);
    };

    loadContactTranslations();
  }, []);

  const t = (key: string) =>
    translations[key] ??
    {
      name: 'Imię i nazwisko',
      email: 'E-mail',
      message: 'Wiadomość',
      maxChars: 'Maksymalnie 5000 znaków',
      send: 'Wyślij',
      sending: 'Wysyłanie...',
      success: 'Wiadomość wysłana ✅',
      error: 'Uzupełnij wszystkie pola.',
      sendError: 'Błąd wysyłki',
      unknownError: 'Nieznany błąd',
      title: 'Kontakt',
      description: 'Napisz wiadomość – odpowiem możliwie szybko.',
      namePlaceholder: 'Imię i nazwisko',
      emailPlaceholder: 'E-mail',
      messagePlaceholder: 'Treść wiadomości...',
    }[key] ??
    key;

  const onSubmit = async (data: ContactFormData) => {
    setStatus('sending');
    setErr('');
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 30, 90));
      }, 200);

      // Honeypot check
      const website = data.name.toLowerCase();
      if (website.includes('website') || website.includes('http')) {
        clearInterval(progressInterval);
        setStatus('sent');
        setProgress(100);
        reset();
        return;
      }

      const input = {
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
        hcaptchaToken: '',
      };

      const query = `
        mutation SendContact($input: ContactMessageInput!) {
          sendContact(input: $input) {
            ok
            error
          }
        }
      `;

      const r = await fetch(GQL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { input } }),
        cache: 'no-store',
      });

      clearInterval(progressInterval);
      setProgress(100);

      const j = await r.json().catch(() => ({}));

      if (!r.ok || j?.errors || j?.data?.sendContact?.ok === false) {
        throw new Error(j?.data?.sendContact?.error || j?.errors?.[0]?.message || t('sendError'));
      }

      setStatus('sent');
      reset();

      // Auto-hide success after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);

    } catch (e) {
      setStatus('error');
      setErr(e instanceof Error ? e.message : t('unknownError'));
      setProgress(0);
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
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h3
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          viewport={{ once: true }}
        >
          {t('title') || 'Contact Me'}
        </motion.h3>

      </div>

      {/* Name Field */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        viewport={{ once: true }}
      >
        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          <User className="w-4 h-4 mr-2 text-indigo-500" />
          {t('name')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            {...register('name')}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none"
            placeholder={t('namePlaceholder') || 'John Doe'}
            data-testid="contact-name"
          />
          <AnimatePresence>
            {errors.name && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-6 left-0 text-red-500 text-xs flex items-center"
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
        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          <Mail className="w-4 h-4 mr-2 text-indigo-500" />
          {t('email')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            {...register('email')}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none"
            placeholder={t('emailPlaceholder') || 'john@example.com'}
            data-testid="contact-email"
          />
          <AnimatePresence>
            {errors.email && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-6 left-0 text-red-500 text-xs flex items-center"
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
        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
          {t('message')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <textarea
            {...register('message')}
            rows={5}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 outline-none resize-none"
            placeholder={t('messagePlaceholder') || 'Your message here...'}
            data-testid="contact-message"
          />

          {/* Progress bar for message length */}
          <div className="absolute bottom-2 left-4 right-4">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
              <motion.div
                className="bg-indigo-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(messageProgress, 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {messageLength}/{maxLength}
            </p>
          </div>

          <AnimatePresence>
            {errors.message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-12 left-0 text-red-500 text-xs flex items-center"
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
          className="relative w-full py-4 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
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
            className="flex items-center justify-center text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg p-4"
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
            className="flex items-center justify-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-4"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">{err}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
}
