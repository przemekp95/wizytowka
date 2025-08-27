<?php
/**
 * contact.php — handler formularza kontaktowego (hCaptcha + mail)
 * Bezpieczeństwo:
 * - Sekrety pobierane z ENV lub z pliku konfiguracyjnego poza public_html
 * - Honeypot
 * - Walidacje
 */

header('Content-Type: application/json; charset=utf-8');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function json_response($ok, $error=null) {
  echo json_encode(['ok'=>$ok, 'error'=>$error], JSON_UNESCAPED_UNICODE);
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  json_response(false, 'Method not allowed');
}

/* ====== KONFIG: ENV -> plik poza webrootem -> wartości domyślne ====== */
$home = rtrim(getenv('HOME') ?: '', '/');
$cfg  = [];
if ($home && is_readable($home . '/config/contact.php')) {
  // UWAGA: ~/config/contact.php ma zwracać tablicę z kluczami jak poniżej
  $cfg = require $home . '/config/contact.php';
}

$HCAPTCHA_SECRET = getenv('HCAPTCHA_SECRET') ?: ($_SERVER['HCAPTCHA_SECRET'] ?? ($cfg['HCAPTCHA_SECRET'] ?? ''));
$MAIL_TO         = getenv('MAIL_TO')         ?: ($_SERVER['MAIL_TO']         ?? ($cfg['MAIL_TO']         ?? 'kontakt@twojadomena.pl'));
$MAIL_FROM       = getenv('MAIL_FROM')       ?: ($_SERVER['MAIL_FROM']       ?? ($cfg['MAIL_FROM']       ?? 'no-reply@twojadomena.pl'));
$MAIL_FROM_NAME  = getenv('MAIL_FROM_NAME')  ?: ($_SERVER['MAIL_FROM_NAME']  ?? ($cfg['MAIL_FROM_NAME']  ?? 'Formularz WWW'));

$SMTP_HOST = getenv('SMTP_HOST') ?: ($_SERVER['SMTP_HOST'] ?? ($cfg['SMTP_HOST'] ?? ''));
$SMTP_USER = getenv('SMTP_USER') ?: ($_SERVER['SMTP_USER'] ?? ($cfg['SMTP_USER'] ?? ''));
$SMTP_PASS = getenv('SMTP_PASS') ?: ($_SERVER['SMTP_PASS'] ?? ($cfg['SMTP_PASS'] ?? ''));
$SMTP_PORT = (int)(getenv('SMTP_PORT') ?: ($_SERVER['SMTP_PORT'] ?? ($cfg['SMTP_PORT'] ?? 587)));

if ($HCAPTCHA_SECRET === '') {
  json_response(false, 'Brak HCAPTCHA_SECRET w konfiguracji serwera.');
}

/* ====== Odbiór danych (JSON lub application/x-www-form-urlencoded) ====== */
$raw    = file_get_contents('php://input') ?: '';
$asJson = json_decode($raw, true);

$name    = trim($asJson['name']    ?? ($_POST['name']    ?? ''));
$email   = trim($asJson['email']   ?? ($_POST['email']   ?? ''));
$message = trim($asJson['message'] ?? ($_POST['message'] ?? ''));
$website = trim($asJson['website'] ?? ($_POST['website'] ?? '')); // honeypot
$captcha = trim($asJson['captchaToken'] ?? ($_POST['h-captcha-response'] ?? ''));

/* ====== Walidacje ====== */
if ($website !== '') {
  // Bot – udajemy sukces, żeby nie podpowiadać
  json_response(true);
}
if ($name === '' || $email === '' || $message === '') {
  json_response(false, 'Brak wymaganych pól.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_response(false, 'Nieprawidłowy e-mail.');
}
if ($captcha === '') {
  json_response(false, 'Brak tokenu hCaptcha.');
}

/* ====== Weryfikacja hCaptcha ====== */
$ch = curl_init('https://hcaptcha.com/siteverify');
curl_setopt_array($ch, [
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => http_build_query(['secret' => $HCAPTCHA_SECRET, 'response' => $captcha]),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_TIMEOUT        => 10,
]);
$resp    = curl_exec($ch);
$curlErr = curl_error($ch);
curl_close($ch);

if (!$resp) {
  json_response(false, 'Błąd połączenia z hCaptcha: ' . $curlErr);
}
$data = json_decode($resp, true);
if (empty($data['success'])) {
  json_response(false, 'Weryfikacja hCaptcha nie powiodła się.');
}

/* ====== Przygotowanie maila ====== */
$safe_name  = str_replace(["\r", "\n"], ' ', $name);
$safe_email = str_replace(["\r", "\n"], ' ', $email);
$subject    = 'Nowa wiadomość z formularza: ' . $safe_name;

$bodyTxt = "Imię i nazwisko: $safe_name\n"
         . "E-mail: $safe_email\n\n"
         . "Wiadomość:\n$message\n";

/* ====== PHPMailer (jeśli dostępny) ====== */
$phpmailerPath = __DIR__ . '/PHPMailer.php';
$smtpPath      = __DIR__ . '/SMTP.php';
$excPath       = __DIR__ . '/Exception.php';
$hasPHPMailer  = file_exists($phpmailerPath) && file_exists($smtpPath) && file_exists($excPath);

if ($hasPHPMailer && $SMTP_HOST && $SMTP_USER && $SMTP_PASS) {
  require_once $phpmailerPath;
  require_once $smtpPath;
  require_once $excPath;

  try {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = $SMTP_USER;
    $mail->Password   = $SMTP_PASS;
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = $SMTP_PORT;

    $mail->CharSet = 'UTF-8';
    $mail->setFrom($MAIL_FROM, $MAIL_FROM_NAME);
    $mail->addAddress($MAIL_TO);
    $mail->addReplyTo($safe_email, $safe_name);

    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body    = $bodyTxt;

    $mail->send();
    json_response(true);
  } catch (Throwable $e) {
    // Jeżeli SMTP zawiedzie — fallback na mail()
    // (przechodzimy dalej)
  }
}

/* ====== Fallback: wbudowane mail() ====== */
$encodedFromName = '=?UTF-8?B?' . base64_encode($MAIL_FROM_NAME) . '?=';
$encodedSubject  = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
  "From: $encodedFromName <{$MAIL_FROM}>",
  "Reply-To: $safe_name <{$safe_email}>",
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=UTF-8",
  "X-Mailer: PHP/" . phpversion(),
];

$ok = @mail($MAIL_TO, $encodedSubject, $bodyTxt, implode("\r\n", $headers));
if ($ok) {
  json_response(true);
} else {
  json_response(false, 'Nie udało się wysłać e-maila (mail()).');
}
