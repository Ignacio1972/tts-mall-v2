<?php
/**
 * Announcement Generator - Orquestador principal
 * VERSIÓN CORREGIDA: Mantiene valores correctos de voice_settings
 */

require_once __DIR__ . '/speech-controls.php';
require_once __DIR__ . '/announcement-templates.php';
require_once __DIR__ . '/../tts-service-enhanced.php';

class AnnouncementGenerator {
    
    /**
     * Genera un anuncio completo con todas las características
     */
    public static function generate($options) {
        // Opciones por defecto
        $defaults = [
            'text' => null,
            'template' => null,
            'template_category' => null,
            'template_variables' => [],
            'voice' => 'fernanda',
            'language' => 'es',
            'speed' => 'normal',
            'emphasis' => true,
            'emphasis_words' => [],
            'pauses' => true,
            'model' => 'eleven_multilingual_v2',
            'seed' => null,
            'voice_settings' => [
                'stability' => 0.75,
                'similarity_boost' => 0.8,
                'style' => 0.5,
                'use_speaker_boost' => true
            ],
            'template_style_adjust' => null,
            // Settings avanzados
            'pause_settings' => null,
            'emphasis_settings' => null,
            'modulation_settings' => null
        ];
        
        $options = array_merge($defaults, $options);
        
        // PASO 1: Obtener el texto (directo o desde template)
        if ($options['template'] && $options['template_category']) {
            $result = AnnouncementTemplates::generateFromTemplate(
                $options['template_category'],
                $options['template'],
                $options['template_variables']
            );
            
            $text = $result['text'];
            $speechPreset = SpeechControls::getPreset($result['speech_preset']);
            
            // Aplicar preset si no se especificaron opciones custom
            if ($options['speed'] === 'normal') {
                $options['speed'] = $speechPreset['speed'];
            }
            if ($options['pauses'] === true) {
                $options['pause_length'] = $speechPreset['pause_length'];
            }
            
            logMessage("Usando template: {$result['template_name']}");
        } else {
            $text = $options['text'];
            if (empty($text)) {
                throw new Exception('Debe proporcionar texto o seleccionar un template');
            }
        }
        
        logMessage("Texto original: $text");
        
        // PASO 2: Preparar opciones para SpeechControls
        $speechOptions = [
            'speed' => $options['speed'],
            'language' => $options['language'],
            'emphasis' => $options['emphasis'],
            'emphasis_words' => $options['emphasis_words'],
            'pauses' => $options['pauses'],
            'pause_length' => $options['pause_length'] ?? 'medium'
        ];
        
        // Pasar settings avanzados si existen
        if ($options['pause_settings']) {
            $speechOptions['pause_settings'] = $options['pause_settings'];
            logMessage("Pasando pause_settings a speech-controls: " . json_encode($options['pause_settings']));
        }
        
        if ($options['emphasis_settings']) {
            $speechOptions['emphasis_settings'] = $options['emphasis_settings'];
            logMessage("Pasando emphasis_settings a speech-controls: " . json_encode($options['emphasis_settings']));
        }
        
        if ($options['modulation_settings']) {
            $speechOptions['modulation_settings'] = $options['modulation_settings'];
            logMessage("Pasando modulation_settings a speech-controls: " . json_encode($options['modulation_settings']));
        }
        
        logMessage("=== DEBUG VELOCIDAD ===");
logMessage("Speed recibido: " . ($options['speed'] ?? 'NO DEFINIDO'));
logMessage("Speech options antes de processText: " . json_encode($speechOptions));
        // Aplicar controles de voz
        $processedText = SpeechControls::processText($text, $speechOptions);
        logMessage("Texto después de processText: " . $processedText);
logMessage("=== FIN DEBUG VELOCIDAD ===");
        
        logMessage("Texto procesado con SSML: $processedText");
        
        // PASO 3: Ajustar voice_settings según el tipo de anuncio
        $voiceSettings = self::optimizeVoiceSettings(
            $options['voice_settings'],
            $options['speed'],
            $options['template'],
            $options['template_style_adjust']
        );
        
        // PASO 4: Generar el audio con ElevenLabs
        $ttsOptions = [
            'model_id' => $options['model'],
            'voice_settings' => $voiceSettings,
            'language' => $options['language'],
            'enable_ssml' => false, // SSML no está funcionando bien con ElevenLabs
            'seed' => $options['seed']
        ];
        
        // Generar audio
        $audioData = generateEnhancedTTS($processedText, $options['voice'], $ttsOptions);
        
        return [
            'audio' => $audioData,
            'processed_text' => $processedText,
            'original_text' => $text,
            'voice' => $options['voice'],
            'settings_used' => $voiceSettings
        ];
    }
    
    /**
     * Optimiza voice_settings según el tipo de anuncio
     * CORREGIDO: Mantiene valores base correctos
     */
    private static function optimizeVoiceSettings($baseSettings, $speed, $template, $styleAdjust = null) {
        // IMPORTANTE: Crear copia para no modificar el original
        $settings = [
            'stability' => $baseSettings['stability'] ?? 0.75,
            'similarity_boost' => $baseSettings['similarity_boost'] ?? 0.8,
            'style' => $baseSettings['style'] ?? 0.5,
            'use_speaker_boost' => $baseSettings['use_speaker_boost'] ?? true
        ];
        
        // Solo ajustar si viene un template específico
        if (!empty($template)) {
            logMessage("Optimizando style para template: $template");
            
            // Celebraciones - Muy expresivo (0.8)
            if (strpos($template, 'dia_madre') !== false || 
                strpos($template, 'dia_padre') !== false || 
                strpos($template, 'dia_nino') !== false ||
                strpos($template, 'celebracion') !== false ||
                strpos($template, 'evento_general') !== false ||
                strpos($template, 'evento_infantil') !== false ||
                strpos($template, 'show_infantil') !== false ||
                strpos($template, 'taller_infantil') !== false) {
                $settings['style'] = 0.8;
                logMessage("Aplicando style celebración: 0.8");
                
            // Ofertas y Cine - Energético (0.6)
            } elseif (strpos($template, 'oferta') !== false || 
                      strpos($template, 'descuento') !== false || 
                      strpos($template, 'liquidacion') !== false ||
                      strpos($template, 'dos_por_uno') !== false ||
                      strpos($template, 'estreno') !== false ||
                      strpos($template, 'promocion_cine') !== false) {
                $settings['style'] = 0.6;
                logMessage("Aplicando style oferta: 0.6");
                
            // Recordatorios - Formal (0.2)
            } elseif (strpos($template, 'recordatorio') !== false || 
                      strpos($template, 'seguridad') !== false ||
                      strpos($template, 'estacionamiento') !== false) {
                $settings['style'] = 0.2;
                logMessage("Aplicando style recordatorio: 0.2");
                
            // Emergencias - Urgente (0.7)
            } elseif (strpos($template, 'emergencia') !== false || 
                      strpos($template, 'evacuacion') !== false) {
                $settings['style'] = 0.7;
                logMessage("Aplicando style emergencia: 0.7");
                
            // Servicios - Claro (0.3)
            } elseif (strpos($template, 'llamado_caja') !== false || 
                      strpos($template, 'vehiculo') !== false ||
                      strpos($template, 'niño_perdido') !== false) {
                $settings['style'] = 0.3;
                logMessage("Aplicando style servicios: 0.3");
                
            // Horarios - Neutral (0.4)
            } elseif (strpos($template, 'apertura') !== false || 
                      strpos($template, 'cierre') !== false) {
                $settings['style'] = 0.4;
                logMessage("Aplicando style horarios: 0.4");
            }
            // Si no coincide con ningún template, mantener el style original
        }
        
        // Aplicar ajuste de style si existe
        if ($styleAdjust !== null && is_numeric($styleAdjust)) {
            $originalStyle = $settings['style'];
            $adjustedStyle = $originalStyle + floatval($styleAdjust);
            
            // Mantener dentro de límites 0.0 - 1.0
            $settings['style'] = max(0.0, min(1.0, $adjustedStyle));
            
            logMessage("Ajuste de style aplicado: Original={$originalStyle}, Ajuste={$styleAdjust}, Final={$settings['style']}");
        }
        
        // Asegurar que todos los valores estén en rango correcto
        $settings['stability'] = max(0.0, min(1.0, floatval($settings['stability'])));
        $settings['similarity_boost'] = max(0.0, min(1.0, floatval($settings['similarity_boost'])));
        $settings['style'] = max(0.0, min(1.0, floatval($settings['style'])));
        
        // Log final para debugging
        logMessage("Voice settings finales: " . json_encode($settings));
        
        return $settings;
    }
    
    /**
     * Genera anuncio simple (texto directo)
     * ACTUALIZADO: Pasa todos los settings
     */
    public static function generateSimple($text, $voice = 'fernanda', $options = []) {
        $fullOptions = array_merge([
            'text' => $text,
            'voice' => $voice
        ], $options);
        
        return self::generate($fullOptions);
    }
    
    /**
     * Genera anuncio desde template
     * ACTUALIZADO: Pasa todos los settings
     */
    public static function generateFromTemplate($category, $templateId, $variables, $voice = 'fernanda', $options = []) {
        $fullOptions = array_merge([
            'template_category' => $category,
            'template' => $templateId,
            'template_variables' => $variables,
            'voice' => $voice
        ], $options);
        
        return self::generate($fullOptions);
    }
    
    /**
     * Genera anuncio de emergencia (preset optimizado)
     */
    public static function generateEmergency($text, $voice = 'alejandro') {
        return self::generate([
            'text' => $text,
            'voice' => $voice,
            'speed' => 'emergencia',
            'emphasis' => true,
            'pauses' => false,
            'voice_settings' => [
                'stability' => 0.95,
                'similarity_boost' => 0.95,
                'style' => 0.7,
                'use_speaker_boost' => true
            ]
        ]);
    }
    
    /**
     * Genera anuncio de oferta (preset optimizado)
     */
    public static function generateOffer($text, $voice = 'fernanda') {
        return self::generate([
            'text' => $text,
            'voice' => $voice,
            'speed' => 'normal',
            'emphasis' => true,
            'emphasis_words' => ['gratis', 'descuento', 'oferta', 'ahorro', 'promoción'],
            'pauses' => true,
            'voice_settings' => [
                'stability' => 0.7,
                'similarity_boost' => 0.75,
                'style' => 0.6,
                'use_speaker_boost' => true
            ]
        ]);
    }
}

/**
 * Función helper para uso rápido
 */
function generateAnnouncement($options) {
    try {
        $result = AnnouncementGenerator::generate($options);
        return [
            'success' => true,
            'audio' => $result['audio'],
            'text' => $result['original_text'],
            'processed_text' => $result['processed_text']
        ];
    } catch (Exception $e) {
        logMessage("Error en generateAnnouncement: " . $e->getMessage());
        return [
            'success' => false,
            'error' => $e->getMessage()
        ];
    }
}
?>