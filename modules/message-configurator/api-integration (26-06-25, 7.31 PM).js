// /var/www/tts-mall/v2/modules/message-configurator/api-integration.js
/**
 * API Integration - Conexión con backend para el configurador
 * VERSIÓN SIMPLIFICADA - Solo parámetros soportados por ElevenLabs
 * @module APIIntegration
 */

import { apiClient } from '../../shared/api-client.js';

export class APIIntegration {
    constructor() {
        this.templatesCache = null;
        this.lastTemplatesFetch = 0;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }
    
    /**
     * Carga las plantillas disponibles
     */
    async loadTemplates() {
        // Usar cache si es reciente
        if (this.templatesCache && 
            (Date.now() - this.lastTemplatesFetch) < this.cacheTimeout) {
            return this.templatesCache;
        }
        
        try {
            const response = await apiClient.getTemplates();
            
            if (response.success) {
                this.templatesCache = response.templates;
                this.lastTemplatesFetch = Date.now();
                return response.templates;
            } else {
                throw new Error(response.error || 'Error cargando plantillas');
            }
        } catch (error) {
            console.error('[APIIntegration] Error loading templates:', error);
            return {};
        }
    }
    
    /**
     * Prepara los parámetros para generar audio
     * SOLO PARÁMETROS SOPORTADOS POR ELEVENLABS
     */
    prepareGenerationParams(message) {
        const params = {
            text: message.text,
            voice: message.voice,
            voice_settings: {
                style: message.settings.style || 0.5,
                stability: message.settings.stability || 0.75,
                similarity_boost: message.settings.similarity_boost || 0.8,
                use_speaker_boost: message.settings.use_speaker_boost !== false // default true
            }
        };
        
        return params;
    }
    
    /**
     * Genera audio desde plantilla
     */
    async generateFromTemplate(category, templateId, variables, voice, settings) {
        const params = {
            template: templateId,
            template_category: category,
            template_variables: variables,
            voice: voice,
            voice_settings: {
                style: settings.style || 0.5,
                stability: settings.stability || 0.75,
                similarity_boost: settings.similarity_boost || 0.8,
                use_speaker_boost: settings.use_speaker_boost !== false
            }
        };
        
        return apiClient.post('/generate.php', {
            action: 'generate_audio',
            ...params
        });
    }
    
    /**
     * Valida disponibilidad del servicio
     */
    async checkServiceStatus() {
        try {
            // Hacer un ping simple al API
            const response = await fetch('/v2/api/generate.php', {
                method: 'OPTIONS'
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}