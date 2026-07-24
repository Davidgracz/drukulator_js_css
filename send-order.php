<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function drukulator_response(bool $success, string $message, int $status = 200, array $extra = array()): void
{
    http_response_code($status);
    echo json_encode(
        array_merge(
            array(
                'success' => $success,
                'message' => $message,
            ),
            $extra
        ),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    drukulator_response(false, 'Dozwolona jest wyłącznie metoda POST.', 405);
}

$wp_load = dirname(__DIR__) . '/wp-load.php';
if (!is_file($wp_load)) {
    drukulator_response(false, 'Nie znaleziono środowiska WordPress.', 500);
}

require_once $wp_load;

$site_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
$origin = isset($_SERVER['HTTP_ORIGIN']) ? strtolower((string) wp_parse_url((string) $_SERVER['HTTP_ORIGIN'], PHP_URL_HOST)) : '';
$referer = isset($_SERVER['HTTP_REFERER']) ? strtolower((string) wp_parse_url((string) $_SERVER['HTTP_REFERER'], PHP_URL_HOST)) : '';

if (($origin !== '' && $origin !== $site_host) || ($referer !== '' && $referer !== $site_host)) {
    drukulator_response(false, 'Żądanie pochodzi z niedozwolonej strony.', 403);
}

$content_length = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
if ($content_length > 100000) {
    drukulator_response(false, 'Przesłane dane są zbyt duże.', 413);
}

$raw_body = file_get_contents('php://input');
$data = json_decode((string) $raw_body, true);
if (!is_array($data)) {
    drukulator_response(false, 'Nieprawidłowy format danych.', 400);
}

// Pole-pułapka dla prostych botów. Zwracamy sukces bez wysyłania wiadomości.
if (!empty($data['website'])) {
    drukulator_response(true, 'Wiadomość została przyjęta.', 200, array('orderId' => 'D24-OK'));
}

$privacy_accepted = !empty($data['privacyAccepted']);
if (!$privacy_accepted) {
    drukulator_response(false, 'Wymagane jest potwierdzenie polityki prywatności.', 422);
}

$customer = isset($data['customer']) && is_array($data['customer']) ? $data['customer'] : array();
$name = sanitize_text_field((string) ($customer['name'] ?? ''));
$email = sanitize_email((string) ($customer['email'] ?? ''));
$phone = sanitize_text_field((string) ($customer['phone'] ?? ''));
$pickup = sanitize_text_field((string) ($customer['pickup'] ?? 'Do ustalenia'));
$notes = sanitize_textarea_field((string) ($customer['notes'] ?? ''));

if ($name === '' || strlen($name) > 150) {
    drukulator_response(false, 'Podaj poprawne imię, nazwisko albo nazwę firmy.', 422);
}
if (!is_email($email)) {
    drukulator_response(false, 'Podaj poprawny adres e-mail.', 422);
}
if (strlen($phone) > 50) {
    drukulator_response(false, 'Numer telefonu jest zbyt długi.', 422);
}
if (strlen($notes) > 3000) {
    drukulator_response(false, 'Pole uwag jest zbyt długie.', 422);
}

$allowed_pickup = array('Odbiór osobisty', 'Wysyłka kurierska', 'Do ustalenia');
if (!in_array($pickup, $allowed_pickup, true)) {
    $pickup = 'Do ustalenia';
}

$cart = isset($data['cart']) && is_array($data['cart']) ? $data['cart'] : array();
if (count($cart) < 1 || count($cart) > 30) {
    drukulator_response(false, 'Koszyk jest pusty albo zawiera zbyt wiele pozycji.', 422);
}

$ip = isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field((string) $_SERVER['REMOTE_ADDR']) : 'unknown';
$ip_hash = md5($ip . wp_salt('nonce'));
$cooldown_key = 'drukulator_order_cooldown_' . $ip_hash;
$hour_key = 'drukulator_order_hour_' . $ip_hash;

if (get_transient($cooldown_key)) {
    drukulator_response(false, 'Odczekaj chwilę przed ponownym wysłaniem formularza.', 429);
}

$hour_count = (int) get_transient($hour_key);
if ($hour_count >= 10) {
    drukulator_response(false, 'Przekroczono limit wiadomości. Spróbuj ponownie później.', 429);
}

$order_id = 'D24-' . wp_date('Ymd-His') . '-' . strtoupper(wp_generate_password(4, false, false));
$total = 0.0;
$order_lines = array();

foreach ($cart as $index => $item) {
    if (!is_array($item)) {
        continue;
    }

    $title = sanitize_text_field((string) ($item['title'] ?? 'Produkt'));
    $description = sanitize_textarea_field((string) ($item['description'] ?? ''));
    $price = isset($item['price']) && is_numeric($item['price']) ? (float) $item['price'] : 0.0;

    if ($price < 0 || $price > 10000000) {
        drukulator_response(false, 'Jedna z pozycji ma nieprawidłową cenę.', 422);
    }

    $total += $price;
    $order_lines[] = sprintf('%d. %s', $index + 1, $title !== '' ? $title : 'Produkt');
    if ($description !== '') {
        $order_lines[] = '   ' . str_replace("\n", "\n   ", $description);
    }

    $details = isset($item['details']) && is_array($item['details']) ? array_slice($item['details'], 0, 30) : array();
    foreach ($details as $detail) {
        if (!is_array($detail) || count($detail) < 2) {
            continue;
        }
        $label = sanitize_text_field((string) $detail[0]);
        $value = sanitize_text_field((string) $detail[1]);
        if ($label !== '' || $value !== '') {
            $order_lines[] = sprintf('   %s: %s', $label, $value);
        }
    }

    $order_lines[] = '   Cena brutto: ' . number_format($price, 2, ',', ' ') . ' zł';
    $order_lines[] = '';
}

if (!$order_lines) {
    drukulator_response(false, 'Nie udało się odczytać pozycji z koszyka.', 422);
}

$message_lines = array(
    'Nowe zamówienie z Drukulatora',
    'Numer zgłoszenia: ' . $order_id,
    'Data: ' . wp_date('d.m.Y H:i:s'),
    '',
    'Zamawiane produkty:',
    '',
);
$message_lines = array_merge($message_lines, $order_lines);
$message_lines[] = 'RAZEM BRUTTO: ' . number_format($total, 2, ',', ' ') . ' zł';
$message_lines[] = '';
$message_lines[] = 'Dane zamawiającego:';
$message_lines[] = 'Imię i nazwisko / firma: ' . $name;
$message_lines[] = 'E-mail: ' . $email;
$message_lines[] = 'Telefon: ' . ($phone !== '' ? $phone : '—');
$message_lines[] = 'Sposób odbioru: ' . $pickup;

if ($notes !== '') {
    $message_lines[] = '';
    $message_lines[] = 'Uwagi:';
    $message_lines[] = $notes;
}

$message_lines[] = '';
$message_lines[] = 'Wycena została wygenerowana automatycznie i wymaga potwierdzenia przez Druk24.';

$recipient = 'biuro@druk24.szczecin.pl';
$subject = '[Drukulator] Nowe zamówienie ' . $order_id . ' – ' . $name;
$headers = array(
    'Content-Type: text/plain; charset=UTF-8',
    'From: Drukulator Druk24 <biuro@druk24.szczecin.pl>',
    'Reply-To: ' . $name . ' <' . $email . '>',
);

$sent = wp_mail($recipient, $subject, implode("\n", $message_lines), $headers);
if (!$sent) {
    drukulator_response(false, 'Serwer pocztowy nie przyjął wiadomości. Spróbuj ponownie lub skontaktuj się z nami telefonicznie.', 500);
}

set_transient($cooldown_key, 1, 45);
set_transient($hour_key, $hour_count + 1, 3600);

drukulator_response(
    true,
    'Wiadomość została wysłana.',
    200,
    array('orderId' => $order_id)
);
