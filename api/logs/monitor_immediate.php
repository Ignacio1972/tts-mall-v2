<?php
// ================================================
// MONITOR DE CARPETA IMMEDIATE
// Script que revisa cada 2 segundos si hay archivos TTS
// para reproducir inmediatamente en AzuraCast
// ================================================

require_once 'config.php';

// Configuración del monitor
$maxExecutionTime = 300; // 5 minutos máximo de ejecución
$checkInterval = 2; // Revisar cada 2 segundos
$startTime = time();

error_log("TTS MONITOR: Starting immediate folder monitor...");

// Loop principal del monitor
while ((time() - $startTime) < $maxExecutionTime) {
    try {
        processImmediateFolder();
    } catch (Exception $e) {
        error_log("TTS MONITOR ERROR: " . $e->getMessage());
    }
    
    // Esperar antes del siguiente check
    sleep($checkInterval);
}

error_log("TTS MONITOR: Monitor finished after " . (time() - $startTime) . " seconds");

// ================================================
// FUNCIONES DEL MONITOR
// ================================================

function processImmediateFolder() {
    $immediateDir = IMMEDIATE_FOLDER;
    
    // Verificar que la carpeta existe
    if (!is_dir($immediateDir)) {
        return; // No hacer nada si no existe la carpeta
    }
    
    // Buscar archivos .mp3 en la carpeta
    $files = glob($immediateDir . '/*.mp3');
    
    if (empty($files)) {
        return; // No hay archivos para procesar
    }
    
    // Procesar cada archivo (por orden de creación)
    sort($files); // Ordenar por nombre (que incluye timestamp)
    
    foreach ($files as $filePath) {
        $filename = basename($filePath);
        error_log("TTS MONITOR: Found immediate file: $filename");
        
        // Procesar este archivo
        if (playFileImmediately($filePath)) {
            error_log("TTS MONITOR: Successfully played: $filename");
            
            // Borrar el archivo de la carpeta immediate (NO el original)
            if (unlink($filePath)) {
                error_log("TTS MONITOR: Deleted immediate file: $filename");
            } else {
                error_log("TTS MONITOR: Warning - Could not delete immediate file: $filename");
            }
        } else {
            error_log("TTS MONITOR: Failed to play: $filename");
            // No borrar el archivo si falló, para reintentarlo
        }
        
        // Procesar solo un archivo por ciclo para evitar spam
        break;
    }
}

function playFileImmediately($filePath) {
    // MÉTODO 1: Intentar skip + telnet push
    $skipResult = skipCurrentSong();
    
    if ($skipResult) {
        // Esperar un poco para que se procese el skip
        sleep(1);
        
        // Intentar push via telnet
        $pushResult = pushFileViaLiquidsoap($filePath);
        
        if ($pushResult) {
            return true;
        }
    }
    
    // MÉTODO 2: Fallback - Usar request si telnet falla
    return playFileViaRequest($filePath);
}

function skipCurrentSong() {
    $url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/backend/skip';
    
    $options = [
        'http' => [
            'header' => [
                'X-API-Key: ' . AZURACAST_API_KEY,
                'Content-Type: application/json'
            ],
            'method' => 'POST',
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result !== false) {
        error_log("TTS MONITOR: Song skipped successfully");
        return true;
    } else {
        error_log("TTS MONITOR: Failed to skip song");
        return false;
    }
}

function pushFileViaLiquidsoap($filePath) {
    // Construir comando liquidsoap para push inmediato
    $absolutePath = realpath($filePath);
    
    if (!$absolutePath) {
        error_log("TTS MONITOR: Could not get absolute path for: $filePath");
        return false;
    }
    
    // Comando para push inmediato en liquidsoap
    $liquidsoapCommand = sprintf('request.push(%s)', escapeshellarg($absolutePath));
    
    $url = AZURACAST_BASE_URL . '/api/admin/debug/station/' . AZURACAST_STATION_ID . '/telnet';
    
    $requestData = [
        'command' => $liquidsoapCommand
    ];
    
    $options = [
        'http' => [
            'header' => [
                'X-API-Key: ' . AZURACAST_API_KEY,
                'Content-Type: application/json'
            ],
            'method' => 'PUT',
            'content' => json_encode($requestData),
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result !== false) {
        $response = json_decode($result, true);
        error_log("TTS MONITOR: Liquidsoap push command sent: $liquidsoapCommand");
        error_log("TTS MONITOR: Liquidsoap response: " . json_encode($response));
        return true;
    } else {
        error_log("TTS MONITOR: Failed to send liquidsoap push command");
        return false;
    }
}

function playFileViaRequest($filePath) {
    // Como último recurso, intentar encontrar el archivo en requests
    // (esto es menos confiable pero puede funcionar como fallback)
    
    $filename = basename($filePath);
    
    // Extraer timestamp del nombre del archivo
    if (preg_match('/immediate-tts-(\d+)-/', $filename, $matches)) {
        $timestamp = $matches[1];
        $requestId = findRequestByTimestamp($timestamp);
        
        if ($requestId) {
            return submitRequest($requestId);
        }
    }
    
    error_log("TTS MONITOR: Could not play file via request fallback: $filename");
    return false;
}

function findRequestByTimestamp($timestamp) {
    $url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/requests';
    
    $options = [
        'http' => [
            'header' => [
                'X-API-Key: ' . AZURACAST_API_KEY
            ],
            'method' => 'GET',
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === false) {
        return null;
    }
    
    $requests = json_decode($result, true);
    if (!is_array($requests)) {
        return null;
    }
    
    // Buscar por timestamp aproximado (dentro de 5 minutos)
    $targetTime = date('Y-m-d-H-i', $timestamp);
    
    foreach ($requests as $request) {
        if (isset($request['song']['title']) && 
            strpos($request['song']['title'], $targetTime) !== false) {
            return $request['request_id'];
        }
    }
    
    return null;
}

function submitRequest($requestId) {
    $url = AZURACAST_BASE_URL . '/api/station/' . AZURACAST_STATION_ID . '/request/' . $requestId;
    
    $options = [
        'http' => [
            'header' => [
                'X-API-Key: ' . AZURACAST_API_KEY,
                'Content-Type: application/json'
            ],
            'method' => 'POST',
            'timeout' => 10
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result !== false) {
        error_log("TTS MONITOR: Request submitted successfully: $requestId");
        return true;
    } else {
        error_log("TTS MONITOR: Failed to submit request: $requestId");
        return false;
    }
}

?>
