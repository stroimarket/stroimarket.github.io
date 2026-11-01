<?php
/**
 * ТСК «Сибстроймаркет» — приём заявок с форм сайта.
 * Разместите файл в /api/send.php на хостинге с PHP 7.4+.
 *
 * НАСТРОЙКА ПЕРЕД ЗАПУСКОМ:
 * 1. Укажите почтовый ящик в $to (рекомендуется ящик на домене, чтобы письма не попадали в спам).
 * 2. На хостинге включите функцию mail() или настройте SMTP через PHPMailer (см. README.md).
 * 3. В /js/main.js выставите TEST_MODE = false.
 */

header('Content-Type: application/json; charset=utf-8');

$to = 'mail@tsksibstroymarket.ru'; // <-- ЗАМЕНИТЕ на рабочий ящик для заявок
$from = 'noreply@tsksibstroymarket.ru';

// Только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method not allowed']);
    exit;
}

// Honeypot: боты заполняют скрытое поле
if (!empty($_POST['company_site'])) {
    echo json_encode(['ok' => true]); // молча «принимаем», не отправляя
    exit;
}

$name    = trim(strip_tags($_POST['name'] ?? ''));
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));
$form    = trim(strip_tags($_POST['form_type'] ?? 'form'));
$page    = trim(strip_tags($_POST['page'] ?? ''));
$project = trim(strip_tags($_POST['project'] ?? ''));

// Проверка телефона: ровно 11 цифр (с учётом маски +7)
$digits = preg_replace('/\D/', '', $phone);
if ($name === '' || strlen($digits) !== 11) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation']);
    exit;
}

$formNames = [
    'callback' => 'Обратный звонок',
    'calc'     => 'Расчёт стоимости',
    'contact'  => 'Сообщение с сайта',
    'project'  => 'Заявка по проекту'
];
$formName = $formNames[$form] ?? 'Заявка с сайта';

$subject = '=?UTF-8?B?' . base64_encode("Заявка: $formName — tsksibstroymarket.ru") . '?=';

$lines = [
    "Тип заявки: $formName",
    "Имя: $name",
    "Телефон: $phone",
];
if ($project !== '') $lines[] = "Проект: $project";
foreach (['area' => 'Площадь', 'floors' => 'Этажность', 'material' => 'Материал стен', 'package' => 'Комплектация', 'wishes' => 'Пожелания'] as $k => $label) {
    $v = trim(strip_tags($_POST[$k] ?? ''));
    if ($v !== '') $lines[] = "$label: $v";
}
if ($message !== '') $lines[] = "Сообщение: $message";
$lines[] = "Страница: $page";
$lines[] = "Дата: " . date('d.m.Y H:i');

$body = implode("\n", $lines);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    "From: Сайт Сибстроймаркет <$from>",
    "Reply-To: $from"
];

$sent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail failed']);
}
