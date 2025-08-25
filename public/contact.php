<?php
// public/contact.php
// API kompatybilne z Twoim route.ts: honeypot, hCaptcha, walidacja, e-mail.

header('Content-Type: application/json; charset=UTF-8');

// TYLKO POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Pobierz body - JSON lub multipart
$raw = file_get_contents('php://input');
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
$body = [
  'name' => null,
  'email' => null,
  'message' => null,
  'captchaToken' => null,
  'website' => null,
];

if (stripos($ctype, 'application/json') !== false) {
  $j = json_decode($raw, true);
  if (is_array($j)) {
    $body['name'] = $j['name'] ?? null;
    $body['email'] = $j['email'] ?? null;
    $body['message'] = $j['message'] ?? null;
    $body['captchaToken'] = $j['captchaToken'] ?? null;
    $body['website'] = $j['website'] ?? null; // honeypot
  }
} else {
  // multipart/form-data lub x-www-form-urlencoded
  $body['name'] = $_POST['name'] ?? null;
  $body['email'] = $_POST['email'] ?? null;
  $body['message'] = $_POST['message'] ?? null;
  $body['captchaToken'] = $_POST['captchaToken'] ?? null;
  $body['website'] = $_POST['website'] ?? null; // honeypot
}

// 1) Honeypot
if (!empty($body['website'])) {
  echo json_encode(['ok' => true]); // udaj sukces dla botów
  exit;
}

// 2) Walidacje podstawowe
if (empty($body['name']) || empty($body['email']) || empty($body['message'])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Missing fields']);
  exit;
}

// 3) hCaptcha (opcjonalnie, gdy masz sekret)
$CAPTCHA_ENABLED = getenv('CAPTCHA_ENABLED') ?: '0';

if ($CAPTCHA_ENABLED === '1') {

$HCAPTCHA_SECRET = getenv('HCAPTCHA_SECRET');
if (!empty($HCAPTCHA_SECRET)) {
  if (empty($body['captchaToken'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing captcha token']);
    exit;
  }

  $postData = http_build_query([
    'secret'   => $HCAPTCHA_SECRET,
    'response' => $body['captchaToken'],
  ]);

  $opts = [
    'http' => [
      'method'  => 'POST',
      'header'  => "Content-Type: application/x-www-form-urlencoded\r\n".
                   "Content-Length: ".strlen($postData)."\r\n",
      'content' => $postData,
      'timeout' => 10,
    ],
  ];
  $ctx = stream_context_create($opts);
  $resp = @file_get_contents('https://hcaptcha.com/siteverify', false, $ctx);
  if ($resp === false) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'Captcha verify failed']);
    exit;
  }
  $verify = json_decode($resp, true);
  if (empty($verify['success'])) {
    $codes = isset($verify['error-codes']) && is_array($verify['error-codes'])
      ? ': '.implode(', ', $verify['error-codes'])
      : '';
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Captcha failed'.$codes]);
    exit;
  }
}
}

// 4) Wysyłka e-mail (prosty mail(); można podmienić na PHPMailer+SMTP)
$TO = getenv('CONTACT_TO') ?: 'twoj-mail@twojadomena.pl'; // ustaw CONTACT_TO w środowisku
$subject = 'Nowa wiadomość z formularza (wizytówka)';
$fromName = preg_replace('/\r|\n/', ' ', $body['name']);
$fromEmail = filter_var($body['email'], FILTER_SANITIZE_EMAIL);
$msg = (string)$body['message'];

$headers = "From: ".$fromName." <".$fromEmail.">\r\n".
           "Reply-To: ".$fromEmail."\r\n".
           "Content-Type: text/plain; charset=UTF-8\r\n";





$bodyTxt = "Imię i nazwisko: ".$fromName."\n".
           "Email: ".$fromEmail."\n\n".
           "Wiadomość:\n".$msg."\n\n".
           "IP: ".($_SERVER['REMOTE_ADDR'] ?? 'unknown')."\n";

// --- MOCK MAIL (DEV) ---
$MAIL_DISABLE = getenv('MAIL_DISABLE') ?: '';
if ($MAIL_DISABLE === '1') {
  echo json_encode(['ok' => true, 'mock' => true]);
  exit;
}
// --- /MOCK MAIL ---

$ok = @mail($TO, $subject, $bodyTxt, $headers);

if ($ok) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Mail send failed']);
}
