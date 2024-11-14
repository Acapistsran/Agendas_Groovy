<?php
header('Content-Type: application/json');

$usuario = $_POST['usuario'];
$contraseña = $_POST['contraseña'];

// Path to CSV file
$csvFile = 'usuarios.csv';

if (!file_exists($csvFile)) {
    echo json_encode(['success' => false, 'message' => 'Error en el sistema']);
    exit;
}

// Read CSV file
$usuarios = array_map('str_getcsv', file($csvFile));
$headers = array_shift($usuarios);

// Check credentials
$found = false;
foreach ($usuarios as $user) {
    // Check both username and email
    if ($user[0] === $usuario || $user[1] === $usuario) {
        if (password_verify($contraseña, $user[2])) {
            $found = true;
            echo json_encode(['success' => true]);
            exit;
        }
    }
}

if (!$found) {
    echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
}