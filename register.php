<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

if (isset($_POST['nombre']) && isset($_POST['correo']) && isset($_POST['contraseña'])) {
    $nombre = htmlspecialchars($_POST['nombre']);
    $correo = htmlspecialchars($_POST['correo']);
    $contraseña = password_hash($_POST['contraseña'], PASSWORD_BCRYPT);

    $archivo = 'usuarios.csv';
    $fila = [$nombre, $correo, $contraseña];

    if (($handle = fopen($archivo, 'a')) !== false) {
        fputcsv($handle, $fila);
        fclose($handle);
        echo json_encode(['success' => true, 'message' => 'Usuario registrado exitosamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se pudo abrir el archivo CSV']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
}
?>
