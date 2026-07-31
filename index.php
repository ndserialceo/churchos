<?php
require_once 'config.php';
require_once 'includes/auth.php';

$page = $_GET['page'] ?? 'dashboard';

$publicPages = ['login'];

$routes = [
    'login'         => 'php-pages/login.php',
    'dashboard'     => 'php-pages/dashboard.php',
    'members'       => 'php-pages/members.php',
    'members_add'   => 'php-pages/members_add.php',
    'members_edit'  => 'php-pages/members_edit.php',
    'finance'       => 'php-pages/finance.php',
    'communication' => 'php-pages/communication.php',
    'followup'      => 'php-pages/followup.php',
    'volunteers'    => 'php-pages/volunteers.php',
    'branches'      => 'php-pages/branches.php',
];

if (!isset($routes[$page])) {
    http_response_code(404);
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 - Page Not Found</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet"></head><body><div class="container text-center py-5"><h1 class="display-1 text-muted">404</h1><h2>Page Not Found</h2><p class="text-muted">The page you\'re looking for doesn\'t exist.</p><a href="index.php?page=dashboard" class="btn btn-primary">Go to Dashboard</a></div></body></html>';
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
