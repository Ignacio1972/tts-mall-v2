<?php
/**
 * Announcement Generator - Orquestador principal
 * Combina templates, control de voz y generación TTS
 */

 // Al inicio del archivo, cambiar:
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
                'use_speaker_boost' => true
            ]
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
        
        // PASO 2: Aplicar controles de voz (velocidad, énfasis, pausas)
        $processedText = SpeechControls::processText($text, [
            'speed' => $options['speed'],
            'language' => $options['language'],
            'emphasis' => $options['emphasis'],
            'emphasis_words' => $options['emphasis_words'],
            'pauses' => $options['pauses'],
            'pause_length' => $options['pause_length'] ?? 'medium'
        ]);
        
        logMessage("Texto procesado con SSML: $processedText");
        
        // PASO 3: Ajustar voice_settings según el tipo de anuncio
        $voiceSettings = self::optimizeVoiceSettings(
            $options['voice_settings'],
            $options['speed'],
            $options['template']
        );
        
        // PASO 4: Generar el audio con ElevenLabs
        $ttsOptions = [
            'model_id' => $options['model'],
            'voice_settings' => $voiceSettings,
            'language' => $options['language'],
            'enable_ssml' => false, // Ya procesamos SSML
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
     */
    private static function optimizeVoiceSettings($baseSettings, $speed, $template) {
        $settings = $baseSettings;
        
        // Ajustar stability según velocidad
        if ($speed === 'rapido' || $speed === 'muy_rapido' || $speed === 'emergencia') {
            $settings['stability'] = min(0.9, $settings['stability'] + 0.1);
            $settings['similarity_boost'] = min(0.95, $settings['similarity_boost'] + 0.1);
        } elseif ($speed === 'lento' || $speed === 'muy_lento') {
            $settings['stability'] = max(0.6, $settings['stability'] - 0.1);
        }
        
        return $settings;
    }
    
    /**
     * Genera anuncio simple (texto directo)
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
