/**
 * Calendar View Component - Wrapper de FullCalendar
 * @module CalendarView
 */

export class CalendarView {
    constructor(container, options = {}) {
        this.container = container;
        this.options = options;
        this.calendar = null;
        this.currentView = 'dayGridMonth';
        this.activeCategories = ['ofertas', 'horarios', 'eventos', 'emergencias', 'servicios', 'seguridad'];
        
        // Verificar que FullCalendar esté disponible
        if (typeof FullCalendar === 'undefined') {
            this.loadFullCalendar().then(() => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    async loadFullCalendar() {
        // Cargar CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css';
        document.head.appendChild(cssLink);
        
        // Cargar JS
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    initialize() {
        // Configuración de FullCalendar en español
        this.calendar = new FullCalendar.Calendar(this.container, {
            initialView: this.currentView,
            locale: 'es',
            timeZone: 'America/Santiago',
            height: 'auto',
            
            // Header toolbar
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            
            // Configuración de vistas
            views: {
                dayGridMonth: {
                    buttonText: 'Mes'
                },
                timeGridWeek: {
                    buttonText: 'Semana'
                },
                timeGridDay: {
                    buttonText: 'Día'
                },
                listWeek: {
                    buttonText: 'Lista'
                }
            },
            
            // Formato de hora 24h
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            
            // Configuración de slots de tiempo
            slotMinTime: '00:00:00',
            slotMaxTime: '24:00:00',
            slotDuration: '00:15:00',
            slotLabelInterval: '01:00',
            
            // Eventos del calendario
            events: [],
            
            // Callbacks
            eventClick: (info) => this.handleEventClick(info),
            dateClick: (info) => this.handleDateClick(info),
            eventDidMount: (info) => this.customizeEvent(info),
            
            // Configuración adicional
            editable: false,
            dayMaxEvents: true,
            nowIndicator: true,
            businessHours: {
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: '10:00',
                endTime: '22:00'
            }
        });
        
        this.calendar.render();
        
        // Actualizar vista según botones externos
        this.attachViewButtons();
    }
    
    attachViewButtons() {
        // Conectar botones de vista personalizados
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.changeView(view);
                
                // Actualizar estado activo
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    changeView(viewName) {
        const viewMap = {
            'month': 'dayGridMonth',
            'week': 'timeGridWeek',
            'day': 'timeGridDay',
            'list': 'listWeek'
        };
        
        const fcView = viewMap[viewName] || viewName;
        this.calendar.changeView(fcView);
        this.currentView = fcView;
    }
    
    handleEventClick(info) {
        info.jsEvent.preventDefault();
        
        // Extraer datos del evento
        const eventData = {
            id: info.event.id,
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            ...info.event.extendedProps
        };
        
        // Callback al módulo principal
        if (this.options.onEventClick) {
            this.options.onEventClick(eventData);
        }
    }
    
    handleDateClick(info) {
        // Solo permitir click en vista de día o semana
        if (this.currentView === 'dayGridMonth') {
            this.calendar.changeView('timeGridDay', info.dateStr);
            return;
        }
        
        // Callback para crear nuevo evento
        if (this.options.onDateClick) {
            this.options.onDateClick(info.date);
        }
    }
    
    customizeEvent(info) {
        const event = info.event;
        const element = info.el;
        
        // Agregar icono según categoría
        const categoryIcons = {
            'ofertas': '🛒',
            'horarios': '🕐',
            'eventos': '🎉',
            'seguridad': '⚠️',
            'servicios': '🛎️',
            'emergencias': '🚨'
        };
        
        const icon = categoryIcons[event.extendedProps.category] || '📢';
        
        // Personalizar el contenido del evento
        const titleEl = element.querySelector('.fc-event-title');
        if (titleEl) {
            titleEl.innerHTML = `${icon} ${event.title}`;
        }
        
        // Agregar tooltip con información adicional
        this.addEventTooltip(element, event);
        
        // Agregar clase para prioridad alta
        if (event.extendedProps.priority >= 8) {
            element.classList.add('high-priority');
        }
    }
    
    addEventTooltip(element, event) {
        const tooltip = document.createElement('div');
        tooltip.className = 'event-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-header">${event.title}</div>
            <div class="tooltip-body">
                <p><strong>Archivo:</strong> ${event.extendedProps.file_path || 'Sin archivo'}</p>
                <p><strong>Hora:</strong> ${this.formatTime(event.start)}</p>
                <p><strong>Prioridad:</strong> ${event.extendedProps.priority}/10</p>
                ${event.extendedProps.notes ? `<p><strong>Notas:</strong> ${event.extendedProps.notes}</p>` : ''}
            </div>
        `;
        
        // Mostrar tooltip en hover
        element.addEventListener('mouseenter', (e) => {
            document.body.appendChild(tooltip);
            
            const rect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
            tooltip.style.zIndex = '9999';
            
            // Ajustar si se sale de la pantalla
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
            }
        });
        
        element.addEventListener('mouseleave', () => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        });
    }
    
    setEvents(events) {
        // Limpiar eventos anteriores
        this.calendar.removeAllEvents();
        
        // Agregar nuevos eventos
        events.forEach(event => {
            this.calendar.addEvent(event);
        });
        
        // Actualizar lista de próximos eventos
        this.updateUpcomingEvents(events);
    }
    
    updateUpcomingEvents(events) {
        const container = document.getElementById('upcoming-events');
        if (!container) return;
        
        // Filtrar eventos de las próximas 24 horas
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcomingEvents = events
            .filter(event => {
                const eventDate = new Date(event.start);
                return eventDate >= now && eventDate <= tomorrow;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));
        
        if (upcomingEvents.length === 0) {
            container.innerHTML = '<div class="no-events">No hay anuncios programados para las próximas 24 horas</div>';
            return;
        }
        
        container.innerHTML = upcomingEvents.map(event => `
            <div class="upcoming-event-item" data-event-id="${event.id}">
                <div class="event-time">${this.formatTime(event.start)}</div>
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-category" style="color: ${event.backgroundColor}">
                        ${this.getCategoryName(event.extendedProps.category)}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    filterByCategories(categories) {
        this.activeCategories = categories;
        
        // Obtener todos los eventos
        const allEvents = this.calendar.getEvents();
        
        // Mostrar/ocultar según categorías activas
        allEvents.forEach(event => {
            if (this.activeCategories.includes(event.extendedProps.category)) {
                event.setProp('display', 'auto');
            } else {
                event.setProp('display', 'none');
            }
        });
    }
    
    formatTime(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    getCategoryName(categoryId) {
        const names = {
            'ofertas': 'Ofertas',
            'horarios': 'Horarios',
            'eventos': 'Eventos',
            'seguridad': 'Seguridad',
            'servicios': 'Servicios',
            'emergencias': 'Emergencias'
        };
        return names[categoryId] || 'General';
    }
    
    destroy() {
        if (this.calendar) {
            this.calendar.destroy();
        }
    }
}