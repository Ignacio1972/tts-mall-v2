/**
 * Calendar Module - Sistema de Programación de Anuncios
 * @module CalendarModule
 */

import { eventBus } from '../../shared/event-bus.js';
import { apiClient } from '../../shared/api-client.js';
import { CalendarView } from './components/calendar-view.js';
import { EventModal } from './components/event-modal.js';
import { CalendarAPI } from './services/calendar-api.js';

export default class CalendarModule {
    constructor() {
        this.name = 'calendar';
        this.container = null;
        this.calendarView = null;
        this.eventModal = null;
        this.api = new CalendarAPI();
        
        // Cache de archivos disponibles
        this.availableFiles = [];
        this.categories = [
            { id: 'ofertas', name: '🛒 Ofertas', color: '#FF6B6B' },
            { id: 'horarios', name: '🕐 Horarios', color: '#4DABF7' },
            { id: 'eventos', name: '🎉 Eventos', color: '#51CF66' },
            { id: 'seguridad', name: '⚠️ Seguridad', color: '#FFD43B' },
            { id: 'servicios', name: '🛎️ Servicios', color: '#845EF7' },
            { id: 'emergencias', name: '🚨 Emergencias', color: '#FF0000' }
        ];
    }
    
    getName() {
        return this.name;
    }
    
    async load(container) {
        console.log('[Calendar] Loading module...');
        this.container = container;
        
        try {
            // Cargar template HTML
            await this.loadTemplate();
            
            // Cargar archivos disponibles de la biblioteca
            await this.loadAvailableFiles();
            
            // Inicializar componentes
            await this.initializeComponents();
            
            // Cargar eventos del calendario
            await this.loadCalendarEvents();
            
            // Adjuntar event listeners
            this.attachEventListeners();
            
            eventBus.emit('calendar:loaded');
            console.log('[Calendar] Module loaded successfully');
            
        } catch (error) {
            console.error('[Calendar] Load failed:', error);
            this.showError('Error al cargar el calendario: ' + error.message);
        }
    }
    
    async unload() {
        console.log('[Calendar] Unloading module...');
        
        // Limpiar componentes
        if (this.calendarView) {
            this.calendarView.destroy();
        }
        
        // Limpiar event listeners
        eventBus.clear('calendar:*');
        
        this.container = null;
    }
    
    async loadTemplate() {
        const response = await fetch('/v2/modules/calendar/templates/calendar.html');
        const html = await response.text();
        this.container.innerHTML = html;
    }
    
    async loadAvailableFiles() {
        try {
            // Usar la API existente de biblioteca
            const response = await apiClient.post('/biblioteca.php', {
                action: 'list_library'
            });
            
            if (response.success) {
                this.availableFiles = response.files.map(file => ({
                    value: file.filename,
                    label: file.filename,
                    duration: file.duration || 0,
                    size: file.size,
                    date: file.date
                }));
                
                console.log(`[Calendar] Loaded ${this.availableFiles.length} audio files`);
            }
        } catch (error) {
            console.error('[Calendar] Error loading files:', error);
            this.availableFiles = [];
        }
    }
    
    async initializeComponents() {
        // Inicializar vista de calendario
        const calendarContainer = this.container.querySelector('#calendar-container');
        this.calendarView = new CalendarView(calendarContainer, {
            onEventClick: (event) => this.handleEventClick(event),
            onDateClick: (date) => this.handleDateClick(date),
            categories: this.categories
        });
        
        // Inicializar modal de eventos
        this.eventModal = new EventModal({
            availableFiles: this.availableFiles,
            categories: this.categories,
            onSave: (eventData) => this.saveEvent(eventData),
            onDelete: (eventId) => this.deleteEvent(eventId)
        });
    }
    
    async loadCalendarEvents() {
        try {
            this.showLoading(true);
            const events = await this.api.getEvents();
            
            // Transformar eventos para FullCalendar
            const calendarEvents = events.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start_datetime,
                end: event.end_datetime || event.start_datetime,
                backgroundColor: this.getCategoryColor(event.category),
                borderColor: this.getCategoryColor(event.category),
                extendedProps: {
                    category: event.category,
                    file_path: event.file_path,
                    priority: event.priority,
                    notes: event.notes
                }
            }));
            
            this.calendarView.setEvents(calendarEvents);
            
        } catch (error) {
            console.error('[Calendar] Error loading events:', error);
            this.showError('Error al cargar eventos');
        } finally {
            this.showLoading(false);
        }
    }
    
    attachEventListeners() {
        // Botón crear evento
        const createBtn = this.container.querySelector('#create-event-btn');
        createBtn?.addEventListener('click', () => {
            this.eventModal.open();
        });
        
        // Botón actualizar
        const refreshBtn = this.container.querySelector('#refresh-calendar-btn');
        refreshBtn?.addEventListener('click', () => {
            this.loadCalendarEvents();
        });
        
        // Filtros de categoría
        this.container.querySelectorAll('.category-filter').forEach(filter => {
            filter.addEventListener('change', () => {
                this.updateCategoryFilters();
            });
        });
        
        // Escuchar eventos del sistema
        eventBus.on('library:file:added', () => {
            this.loadAvailableFiles();
        });
    }
    
    handleEventClick(event) {
        console.log('[Calendar] Event clicked:', event);
        this.eventModal.open(event);
    }
    
    handleDateClick(date) {
        console.log('[Calendar] Date clicked:', date);
        this.eventModal.open({
            start: date
        });
    }
    
    async saveEvent(eventData) {
        try {
            this.showLoading(true);
            
            const response = await this.api.saveEvent(eventData);
            
            if (response.success) {
                this.showSuccess('Evento guardado correctamente');
                await this.loadCalendarEvents();
                this.eventModal.close();
            } else {
                throw new Error(response.error || 'Error al guardar');
            }
            
        } catch (error) {
            console.error('[Calendar] Error saving event:', error);
            this.showError('Error al guardar evento: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async deleteEvent(eventId) {
        if (!confirm('¿Eliminar este evento programado?')) {
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await this.api.deleteEvent(eventId);
            
            if (response.success) {
                this.showSuccess('Evento eliminado');
                await this.loadCalendarEvents();
                this.eventModal.close();
            } else {
                throw new Error(response.error || 'Error al eliminar');
            }
            
        } catch (error) {
            console.error('[Calendar] Error deleting event:', error);
            this.showError('Error al eliminar evento: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    updateCategoryFilters() {
        const activeCategories = [];
        
        this.container.querySelectorAll('.category-filter:checked').forEach(checkbox => {
            activeCategories.push(checkbox.value);
        });
        
        this.calendarView.filterByCategories(activeCategories);
    }
    
    getCategoryColor(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category?.color || '#666666';
    }
    
    // UI Helpers
    showLoading(show) {
        const loader = this.container.querySelector('.calendar-loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }
    
    showSuccess(message) {
        eventBus.emit('ui:notification', { 
            message, 
            type: 'success' 
        });
    }
    
    showError(message) {
        eventBus.emit('ui:notification', { 
            message, 
            type: 'error' 
        });
    }
}