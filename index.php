<?php
require_once 'config.php';
require_once 'includes/auth.php';

$page = $_GET['page'] ?? 'dashboard';

$publicPages = ['login'];

$routes = [
    'login'         => 'pages/login.php',
    'dashboard'     => 'pages/dashboard.php',
    'members'       => 'pages/members.php',
    'members_add'   => 'pages/members_add.php',
    'members_edit'  => 'pages/members_edit.php',
    'finance'       => 'pages/finance.php',
    'communication' => 'pages/communication.php',
    'followup'      => 'pages/followup.php',
    'volunteers'    => 'pages/volunteers.php',
    'branches'      => 'pages/branches.php',
];

if (!isset($routes[$page])) {
    http_response_code(404);
    require_once 'pages/404.php';
    exit;
}

$pageFile = $routes[$page];

if (!in_array($page, $publicPages)) {
    requireLogin();
}

require_once 'includes/header.php';

if (in_array($page, $publicPages)) {
    require_once $pageFile;
} else {
    echo '<div class="d-flex">';
    require_once 'includes/sidebar.php';
    echo '<div class="flex-grow-1">';
    require_once $pageFile;
    echo '</div>';
    echo '</div>';
}

require_once 'includes/footer.php';
