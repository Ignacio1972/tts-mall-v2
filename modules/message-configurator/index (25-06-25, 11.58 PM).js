/**
 * Message Configurator Module - VERSIÓN SIMPLIFICADA
 * @module MessageConfiguratorModule
 */

import { eventBus } from '../../shared/event-bus.js';
import { storageManager } from '../../shared/storage-manager.js';

import { StateManager } from './state-manager.js';
import { APIIntegration } from './api-integration.js';
import { ComponentFactory } from './component-factory.js';
import { UIHandler } from './handlers/ui-handler.js';
import { AudioHandler } from './handlers/audio-handler.js';
import { TemplateHandler } from './handlers/template-handler.js';
import { ProfileHandler } from './handlers/profile-handler.js';

export default class MessageConfiguratorModule {
    constructor() {
        this.name = 'message-configurator';
        this.container = null;
        this.components = {};
        
        // Inicializar managers
        this.stateManager = new StateManager();
        this.apiIntegration = new APIIntegration();
        this.audioHandler = new AudioHandler(this.apiIntegration);
        this.templateHandler = new TemplateHandler();
        this.profileHandler = new ProfileHandler(this.stateManager);
    }
    
    getName() {
        return this.name;
    }
    
    async load(container) {
        console.log('[MessageConfigurator] Loading...');
        this.container = container;
        
        try {
            // Cargar recursos
            await this.loadResources();
            
            // Configurar UI
            this.uiHandler = new UIHandler(this.container, this.createActionHandlers());
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Cargar datos
            await this.loadInitialData();
            
            eventBus.emit('configurator:loaded');
            
        } catch (error) {
            console.error('[MessageConfigurator] Load failed:', error);
            this.uiHandler?.showStatus('Error al cargar', 'error');
        }
    }
    
    async unload() {
        if (this.stateManager?.hasChanges()) {
            const message = this.stateManager.getCurrentMessage();
            if (message?.name) {
                storageManager.save(`draft_${message.id}`, message);
            }
        }
        
        this.cleanup();
    }
    
    async loadResources() {
        // CSS
        if (!document.querySelector('#configurator-styles')) {
            const link = document.createElement('link');
            link.id = 'configurator-styles';
            link.rel = 'stylesheet';
    
        }
    }
    async initializeComponents() {
        const state = this.stateManager.getCurrentMessage();
        
        const callbacks = {
            tagInput: (tags) => this.stateManager.updateField('tags', tags),
            styleSlider: (value) => this.stateManager.updateSetting('style', value / 100),
            stabilitySlider: (value) => this.stateManager.updateSetting('stability', value / 100),
            similaritySlider: (value) => this.stateManager.updateSetting('similarity_boost', value / 100),
            speakerBoostToggle: (value) => this.stateManager.updateSetting('use_speaker_boost', value),
            profileSelector: (profile) => this.handleProfileChange(profile)
        };
        
        this.components = await ComponentFactory.initializeAll(this.container, state, callbacks);
    }
    
    async loadInitialData() {
        try {
            const templates = await this.apiIntegration.loadTemplates();
            this.templateHandler.setTemplates(templates);
        } catch (error) {
            console.warn('[MessageConfigurator] Templates unavailable');
        }
    }
    
    createActionHandlers() {
        return {
            'new-message': () => this.handleNewMessage(),
            'load-saved': () => this.uiHandler.showStatus('En desarrollo', 'info'),
            'use-template': () => this.handleUseTemplate(),
            'reset-controls': () => this.handleResetControls(),
            'generate-audio': () => this.handleGenerateAudio(),
            'save-message': () => this.handleSaveMessage(),
            'send-radio': () => this.handleSendRadio(),
            'download-audio': () => this.handleDownloadAudio(),
            'clear-result': () => this.handleClearResult(),
            updateField: (field, value) => {
                this.stateManager.updateField(field, value);
                if (field === 'voice') {
                    this.profileHandler.applyVoicePreset(value);
                    this.updateComponentsFromState();
                }
            },
            updateText: (text) => {
                this.stateManager.updateField('text', text);
                this.uiHandler.updateCharCounter(text.length);
            }
        };
    }
    
    async handleNewMessage() {
        if (this.stateManager.hasChanges() && !confirm('¿Crear nuevo mensaje sin guardar?')) {
            return;
        }
        
        await this.loadResources();
        await this.initializeComponents();
        this.uiHandler.showStatus('Nuevo mensaje', 'info');
    }
    
    async handleUseTemplate() {
        try {
            const result = await this.templateHandler.showSelector();
            
            // Actualizar texto
            this.container.querySelector('#message-text').value = result.text;
            this.stateManager.updateField('text', result.text);
            this.uiHandler.updateCharCounter(result.text.length);
            
            // Actualizar categoría
            if (result.category) {
                this.container.querySelector('#message-category').value = result.category;
                this.stateManager.updateField('category', result.category);
            }
            
            // Actualizar voz si tiene recomendación
            if (result.metadata.recommendedVoice) {
                this.container.querySelector('#message-voice').value = result.metadata.recommendedVoice;
                this.stateManager.updateField('voice', result.metadata.recommendedVoice);
                this.profileHandler.applyVoicePreset(result.metadata.recommendedVoice);
                this.updateComponentsFromState();
            }
            
            this.uiHandler.showStatus('Plantilla aplicada', 'success');
            
        } catch (error) {
            if (error.message !== 'Cancelado por usuario') {
                this.uiHandler.showStatus(error.message, 'error');
            }
        }
    }
    
    handleResetControls() {
        if (!confirm('¿Restaurar controles a valores por defecto?')) return;
        
        this.profileHandler.resetToDefaults();
        this.updateComponentsFromState();
        this.uiHandler.showStatus('Controles restaurados', 'info');
    }
    
    async handleGenerateAudio() {
        try {
            const message = this.stateManager.getCurrentMessage();
            const result = await this.audioHandler.generate(message);
            
            this.stateManager.updateField('audioFilename', result.filename);
            this.stateManager.updateField('azuracastFilename', result.azuracastFilename);
            
            this.uiHandler.showAudioPlayer(result.filename);
            this.uiHandler.showStatus('¡Audio generado!', 'success');
            
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    handleSaveMessage() {
        const message = this.stateManager.getCurrentMessage();
        if (!message.name) {
            this.uiHandler.showStatus('Dale un nombre al mensaje', 'error');
            return;
        }
        
        storageManager.save(`message_${message.id}`, message);
        this.uiHandler.showStatus('Mensaje guardado', 'success');
        eventBus.emit('message:saved', message);
    }
    
    async handleSendRadio() {
        try {
            const filename = this.stateManager.getCurrentMessage().azuracastFilename;
            await this.audioHandler.sendToRadio(filename);
            this.uiHandler.showStatus('¡Enviado a la radio!', 'success');
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    handleDownloadAudio() {
        try {
            const filename = this.stateManager.getCurrentMessage().audioFilename;
            this.audioHandler.downloadAudio(filename);
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    handleClearResult() {
        // Ocultar el player de audio
        const playerContainer = this.container.querySelector('#audio-player-container');
        if (playerContainer) {
            playerContainer.style.display = 'none';
        }
        
        // Limpiar el audio actual
        this.audioHandler.clear();
        
        // Limpiar campos relacionados en el estado
        this.stateManager.updateField('audioFilename', null);
        this.stateManager.updateField('azuracastFilename', null);
        
        this.uiHandler.showStatus('Audio limpiado', 'info');
    }
    
    handleProfileChange(profile) {
        try {
            const result = this.profileHandler.loadProfile(profile);
            
            if (result.voice) {
                this.container.querySelector('#message-voice').value = result.voice;
            }
            
            this.updateComponentsFromState();
            this.uiHandler.showStatus(`Perfil "${profile.name}" cargado`, 'success');
            
        } catch (error) {
            this.uiHandler.showStatus(error.message, 'error');
        }
    }
    
    updateComponentsFromState() {
        const state = this.stateManager.getCurrentMessage();
        
        // Actualizar solo los componentes válidos
        const updates = {
            styleSlider: (state.settings.style || 0.5) * 100,
            stabilitySlider: (state.settings.stability || 0.75) * 100,
            similaritySlider: (state.settings.similarity_boost || 0.8) * 100,
            speakerBoostToggle: state.settings.use_speaker_boost !== false // default true
        };
        
        Object.entries(updates).forEach(([name, value]) => {
            if (this.components[name]?.setValue && value !== undefined) {
                this.components[name].setValue(value);
            }
        });
    }
    
    cleanup() {
        this.stateManager?.reset();
        this.audioHandler?.clear();
        this.components = {};
        this.container = null;
    }
}