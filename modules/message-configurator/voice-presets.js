// /var/www/tts-mall/v2/modules/message-configurator/voice-presets.js
/**
 * Voice Presets - Configuraciones predefinidas por voz
 * @module VoicePresets
 */

export class VoicePresets {
    static presets = {
        // Voces femeninas
        fernanda: {
            name: 'Fernanda - Profesional',
            description: 'Voz femenina profesional para anuncios generales',
            settings: {
                style: 0.5,
                stability: 0.75,
                similarity_boost: 0.8,
                speed: 'normal'
            },
            recommendedFor: ['anuncios', 'ofertas', 'información']
        },
        
        valeria: {
            name: 'Valeria - Simpática y alegre',
            description: 'Voz juvenil y energética',
            settings: {
                style: 0.7,
                stability: 0.6,
                similarity_boost: 0.75,
                speed: 'normal'
            },
            recommendedFor: ['eventos', 'promociones', 'celebraciones']
        },
        
        rosa: {
            name: 'Rosa - Amigable',
            description: 'Voz cálida y acogedora',
            settings: {
                style: 0.6,
                stability: 0.8,
                similarity_boost: 0.85,
                speed: 'normal'
            },
            recommendedFor: ['bienvenidas', 'información', 'servicios']
        },
        
        azucena: {
            name: 'Azucena - Expresiva',
            description: 'Voz dinámica y expresiva',
            settings: {
                style: 0.8,
                stability: 0.5,
                similarity_boost: 0.7,
                speed: 'normal'
            },
            recommendedFor: ['shows', 'eventos especiales']
        },
        
        ninoska: {
            name: 'Ninoska - Enérgica',
            description: 'Voz con mucha energía',
            settings: {
                style: 0.85,
                stability: 0.4,
                similarity_boost: 0.75,
                speed: 'rapido'
            },
            recommendedFor: ['promociones urgentes', 'ofertas flash']
        },
        
        // Voces masculinas
        cristian: {
            name: 'Cristian - Juvenil',
            description: 'Voz masculina joven y simpática',
            settings: {
                style: 0.65,
                stability: 0.7,
                similarity_boost: 0.8,
                speed: 'normal'
            },
            recommendedFor: ['eventos juveniles', 'tecnología', 'deportes']
        },
        
        yorman: {
            name: 'Yorman - Cinematográfica',
            description: 'Voz profunda estilo película',
            settings: {
                style: 0.3,
                stability: 0.9,
                similarity_boost: 0.95,
                speed: 'lento'
            },
            recommendedFor: ['anuncios épicos', 'estrenos', 'eventos importantes']
        },
        
        alejandro: {
            name: 'Alejandro - Neutral',
            description: 'Voz masculina estándar',
            settings: {
                style: 0.4,
                stability: 0.85,
                similarity_boost: 0.8,
                speed: 'normal'
            },
            recommendedFor: ['información general', 'avisos']
        },
        
        vicente: {
            name: 'Vicente - Versátil',
            description: 'Voz adaptable para radio',
            settings: {
                style: 0.55,
                stability: 0.75,
                similarity_boost: 0.85,
                speed: 'normal'
            },
            recommendedFor: ['radio', 'programas', 'variedades']
        },
        
        ruben: {
            name: 'Rubén - Profesional',
            description: 'Voz corporativa y formal',
            settings: {
                style: 0.2,
                stability: 0.95,
                similarity_boost: 0.9,
                speed: 'normal'
            },
            recommendedFor: ['anuncios corporativos', 'emergencias']
        },
        
        santiago: {
            name: 'Santiago - Clara',
            description: 'Voz clara y directa',
            settings: {
                style: 0.45,
                stability: 0.8,
                similarity_boost: 0.85,
                speed: 'normal'
            },
            recommendedFor: ['instrucciones', 'tutoriales']
        },
        
        luis: {
            name: 'Luis - Profunda',
            description: 'Voz grave y autoritaria',
            settings: {
                style: 0.25,
                stability: 0.9,
                similarity_boost: 0.95,
                speed: 'lento'
            },
            recommendedFor: ['anuncios serios', 'avisos importantes']
        }
    };
    
    /**
     * Obtiene un preset por voz
     */
    static getPreset(voice) {
        return this.presets[voice] || this.getDefaults();
    }
    
    /**
     * Obtiene configuración por defecto
     */
    static getDefaults() {
        return {
            settings: {
                style: 0.5,
                stability: 0.75,
                similarity_boost: 0.8,
                speed: 'normal'
            }
        };
    }
    
    /**
     * Obtiene todas las voces disponibles
     */
    static getAllVoices() {
        return Object.keys(this.presets).map(key => ({
            id: key,
            ...this.presets[key]
        }));
    }
    
    /**
     * Obtiene voces recomendadas para un tipo
     */
    static getRecommendedVoices(type) {
        return Object.keys(this.presets).filter(voice => 
            this.presets[voice].recommendedFor.includes(type)
        );
    }
}