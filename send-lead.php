<?php
/**
 * Mainfold · lead endpoint
 *
 * Ontvangt formulier-/quiz-inzendingen vanuit de site (fetch POST, JSON)
 * en stuurt ze via de Resend API door naar info@mainfold.be.
 *
 * Vereist server-side (nooit in git, nooit in de browser):
 *   RESEND_API_KEY   de geheime API-key uit het Resend-dashboard
 *
 * Zet deze als environment variable in Plesk (Websites & Domains ->
 * mainfold.be -> PHP Settings -> Additional environment variables),
 * of maak op de server zelf (niet via git) een bestand secrets.php
 * met: <?php putenv('RESEND_API_KEY=re_xxx');
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Alleen POST toestaan.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
    exit;
}

// Optioneel: een lokaal, niet-versioned bestand met de API-key (zie
// docblock hierboven). Wordt alleen geladen als het bestaat.
$secretsFile = __DIR__ . '/secrets.php';
if (is_file($secretsFile)) {
    require $secretsFile;
}

$apiKey = getenv('RESEND_API_KEY');
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'server_not_configured']);
    exit;
}

$toAddress = 'info@mainfold.be';
$fromAddress = 'Mainfold website <noreply@mainfold.be>';

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

// Honeypot: een verborgen veld dat een mens nooit invult.
if (!empty($data['website'])) {
    echo json_encode(['success' => true]);
    exit;
}

$source = isset($data['source']) ? trim((string) $data['source']) : 'onbekend';
$name = isset($data['name']) ? trim((string) $data['name']) : '';
$email = isset($data['email']) ? trim((string) $data['email']) : '';
$company = isset($data['company']) ? trim((string) $data['company']) : '';
$phone = isset($data['phone']) ? trim((string) $data['phone']) : '';
$message = isset($data['message']) ? trim((string) $data['message']) : '';

// Extra, formulierspecifieke antwoorden (vrije lijst van label/waarde-paren).
$details = [];
if (isset($data['details']) && is_array($data['details'])) {
    foreach ($data['details'] as $row) {
        if (is_array($row) && isset($row['label'], $row['value'])) {
            $details[] = [(string) $row['label'], (string) $row['value']];
        }
    }
}

if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'invalid_input']);
    exit;
}

function mf_esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

// Formulierspecifieke velden van het consultant-aanmeldformulier (multi-step,
// contact.html en aanmelden-consultants.html). Dit formulier verstuurt als
// multipart/form-data (voor de optionele cv-bijlage), dus deze velden komen
// via $_POST binnen in plaats van via de generieke JSON 'details'-lijst.
$extraFieldLabels = [
    'linkedin' => 'LinkedIn',
    'ervaring' => 'Jaren ervaring',
    'statuut' => 'Statuut',
    'certificeringen' => 'Certificeringen',
    'regio' => 'Regio',
    'beschikbaar' => 'Beschikbaar vanaf',
    'looptijd' => 'Voorkeur looptijd',
    'werkwijze' => 'Werkwijze',
];
if (isset($data['profiel'])) {
    $profiel = is_array($data['profiel']) ? $data['profiel'] : [$data['profiel']];
    $profiel = array_filter(array_map('strval', $profiel));
    if ($profiel) {
        $details[] = ['Profiel', implode(', ', $profiel)];
    }
}
foreach ($extraFieldLabels as $key => $label) {
    if (isset($data[$key]) && trim((string) $data[$key]) !== '') {
        $details[] = [$label, trim((string) $data[$key])];
    }
}

// Optionele cv-bijlage (pdf/doc/docx, max. 10 MB), als base64-attachment
// meegestuurd met de Resend-mail.
$attachments = [];
if (!empty($_FILES['cv']['name']) && is_uploaded_file($_FILES['cv']['tmp_name'])) {
    $cv = $_FILES['cv'];
    $ext = strtolower((string) pathinfo((string) $cv['name'], PATHINFO_EXTENSION));
    if ($cv['error'] === UPLOAD_ERR_OK && $cv['size'] <= 10 * 1024 * 1024 && in_array($ext, ['pdf', 'doc', 'docx'], true)) {
        $cvContent = file_get_contents($cv['tmp_name']);
        if ($cvContent !== false) {
            $attachments[] = [
                'filename' => basename((string) $cv['name']),
                'content' => base64_encode($cvContent),
            ];
        }
    }
}

$subjectMap = [
    'contact-bedrijven' => 'Nieuwe aanvraag (bedrijf)',
    'contact-consultants' => 'Nieuwe consultant-aanmelding',
    'aanmelden-consultants' => 'Nieuwe consultant-aanmelding',
    'nis2-check' => 'Nieuwe NIS2-check inzending',
    'gratis-scan' => 'Nieuwe gratis expertise-scan inzending',
    'looptijd-slider' => 'Nieuwe looptijd-check inzending',
];
$subject = ($subjectMap[$source] ?? 'Nieuwe inzending') . ' · ' . $name;

$bodyRows = '';
$bodyRows .= '<tr><td style="padding:4px 12px 4px 0;color:#4A5260;">Naam</td><td>' . mf_esc($name) . '</td></tr>';
$bodyRows .= '<tr><td style="padding:4px 12px 4px 0;color:#4A5260;">E-mail</td><td>' . mf_esc($email) . '</td></tr>';
if ($company !== '') {
    $bodyRows .= '<tr><td style="padding:4px 12px 4px 0;color:#4A5260;">Organisatie</td><td>' . mf_esc($company) . '</td></tr>';
}
if ($phone !== '') {
    $bodyRows .= '<tr><td style="padding:4px 12px 4px 0;color:#4A5260;">Telefoon</td><td>' . mf_esc($phone) . '</td></tr>';
}
foreach ($details as [$label, $value]) {
    $bodyRows .= '<tr><td style="padding:4px 12px 4px 0;color:#4A5260;">' . mf_esc($label) . '</td><td>' . mf_esc($value) . '</td></tr>';
}
if ($message !== '') {
    $bodyRows .= '<tr><td style="padding:4px 12px 4px 0;color:#4A5260;vertical-align:top;">Bericht</td><td>' . nl2br(mf_esc($message)) . '</td></tr>';
}

$html = '<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#12161C;">'
    . '<p style="color:#4A5260;text-transform:uppercase;letter-spacing:0.08em;font-size:12px;">' . mf_esc($subjectMap[$source] ?? 'Website inzending') . '</p>'
    . '<table cellpadding="0" cellspacing="0">' . $bodyRows . '</table>'
    . '</div>';

$emailPayload = [
    'from' => $fromAddress,
    'to' => [$toAddress],
    'reply_to' => $email,
    'subject' => $subject,
    'html' => $html,
];
if ($attachments) {
    $emailPayload['attachments'] = $attachments;
}
$payload = json_encode($emailPayload);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT => 15,
]);
$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $status >= 300) {
    error_log('Mainfold send-lead.php: Resend-fout (' . $status . ') ' . $curlError . ' ' . (string) $response);
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'send_failed']);
    exit;
}

echo json_encode(['success' => true]);
