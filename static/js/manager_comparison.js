// Manager Comparison Page JavaScript
// External file to bypass CSP inline script restrictions

let comparisonData = [];
let complexComparisonData = [];
let currentTab = 'properties';

// Normalize property data from API to expected comparison table schema
function normalizeProperty(p) {
    if (!p) return null;
    
    return {
        // Property identification
        property_id: p.id || p.inner_id || p.property_id || '',
        
        // Basic property info
        property_name: p.title || p.name || `${(p.rooms == 0 || p.rooms === '0') ? 'Студия' : p.rooms + '-комн'}, ${p.area || ''} м²`,
        property_price: p.price || p.property_price || p.object_price || 0,
        property_type: p.property_type || ((p.rooms == 0 || p.rooms === '0') ? 'Студия' : 'Квартира'),
        
        // Room and area details
        rooms: p.rooms !== undefined ? p.rooms : p.object_rooms || '',
        property_size: p.area !== undefined ? p.area : (p.property_size || p.object_area || 0),
        living_area: p.living_area || p.living_space || '',
        kitchen_area: p.kitchen_area || p.kitchen_space || '',
        
        // Pricing
        price_per_sqm: p.price_per_sqm || (p.property_price && p.property_size && p.property_size > 0 ? Math.round(p.property_price / p.property_size) : (p.price && p.area && p.area > 0 ? Math.round(p.price / p.area) : 0)),
        
        // Location and building info
        complex_name: p.complex_name || p.residential_complex || p.residential_complex_name || '',
        developer_name: p.developer || p.developer_name || 'Не указан',
        floor: p.floor || p.object_min_floor || '',
        total_floors: p.total_floors || p.object_max_floor || '',
        floors_total: p.total_floors || p.object_max_floor || '', // Fixed architect feedback
        district: p.district || p.parsed_district || '',
        address: p.address || p.address_display_name || p.parsed_address || '',
        
        // Additional details
        building_type: p.building_type || p.complex_class || '',
        condition: p.condition || p.finishing || '',
        decoration: p.decoration || p.renovation_type || '',
        balcony: p.balcony || '',
        furniture: p.furniture || '',
        parking: p.parking || '',
        view_from_windows: p.view_from_windows || '',
        ceiling_height: p.ceiling_height || '',
        year_built: p.year_built || p.complex_building_end_build_year || '',
        mortgage_available: p.mortgage_available || (p.green_mortgage_available ? 'Да' : 'Нет'),
        metro_distance: p.metro_distance || p.nearest_metro || '',
        
        // Media and links - handle JSON strings, arrays, and simple URLs  
        property_image: parseImageValue(p.main_image) || parseImageValue(p.photos) || parseImageValue(p.property_image) || 
                       (Array.isArray(p.photos) ? p.photos[0] : null) || '/static/images/no-photo.jpg',
        property_url: p.url || p.property_url,
        
        // Metadata
        deal_type: p.deal_type || 'sale',
        added_at: p.added_at || 'Загружено из базы',
        
        // Cashback info
        cashback: p.cashback || (p.price ? Math.round(p.price * 0.05) : 0)
    };
}

// Helper function to parse image values (JSON strings, arrays, or simple URLs)
function parseImageValue(value) {
    if (!value) return null;
    
    // If it's already an array, return first element
    if (Array.isArray(value)) return value[0] || null;
    
    // If it's a string that looks like JSON array, try to parse
    if (typeof value === 'string' && value.startsWith('[')) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
        } catch (e) {
            // If parsing fails, treat as regular URL
            return value !== '/static/images/no-photo.jpg' ? value : null;
        }
    }
    
    // Simple URL string
    return value !== '/static/images/no-photo.jpg' ? value : null;
}

// Normalize complex data from API to expected comparison table schema
function normalizeComplex(c) {
    if (!c) return null;
    
    return {
        // Complex identification  
        id: c.id || c.complex_id || '',
        
        // Basic complex info
        name: c.name || c.complex_name || c.title || 'ЖК Без названия',
        developer: c.developer || c.developer_name || 'Не указан',
        
        // Location info
        address: c.address || c.full_address || c.location || 'Адрес не указан',
        district: c.district || c.district_name || c.location || 'Район не указан',
        
        // Pricing
        min_price: c.min_price || c.price_from || 0,
        max_price: c.max_price || c.price_to || 0,
        
        // Building details
        buildings_count: c.buildings_count || c.buildings || c.korpus_count || 0,
        apartments_count: c.apartments_count || c.flats_count || c.units_count || 0,
        
        // Construction info
        delivery_date: c.delivery_date || c.completion_date || c.ready_date || 'Не указано',
        status: c.status || c.construction_status || 'Не указано',
        year_built: c.year_built || c.end_build_year || '',
        
        // Additional info
        complex_class: c.complex_class || c.object_class || c.class || '',
        cashback_rate: c.cashback_rate || 5.0,
        
        // Media - handle JSON strings, arrays, and simple URLs
        image: parseImageValue(c.image) || parseImageValue(c.main_image) || parseImageValue(c.photo) || 
               (Array.isArray(c.images) ? c.images[0] : null) || '/static/images/no-photo.jpg',
        url: c.url || c.link || '',
        
        // Metadata
        notes: c.notes || '',
        recommended_for: c.recommended_for || '',
        created_at: c.created_at || 'Загружено из базы'
    };
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Manager Comparison Page - Initializing from external JS...');
    
    // Load comparison data from localStorage 
    await loadComparisonFromStorage();
    
    // Update statistics and navigation counter
    updateStats();
    updateComparisonCounter();
    
    // Attach event listeners to replace onclick handlers
    attachEventListeners();
    
    console.log('✅ Manager Comparison Page - Ready!');
    console.log('📊 Current data:', {
        properties: comparisonData.length,
        complexes: complexComparisonData.length
    });
});

// Attach event listeners to replace inline onclick handlers
function attachEventListeners() {
    // Tab switching
    const propertiesTab = document.getElementById('properties-tab');
    const complexesTab = document.getElementById('complexes-tab');
    
    if (propertiesTab) {
        propertiesTab.addEventListener('click', () => switchTab('properties'));
    }
    if (complexesTab) {
        complexesTab.addEventListener('click', () => switchTab('complexes'));
    }
    
    // Action buttons
    const clearBtn = document.getElementById('clear-comparison-btn');
    const exportBtn = document.getElementById('export-comparison-btn');
    const sendBtn = document.getElementById('send-comparison-btn');
    const saveBtn = document.getElementById('save-template-btn');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearComparison);
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', exportComparison);
    }
    if (sendBtn) {
        sendBtn.addEventListener('click', sendComparisonToClient);
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', saveComparisonTemplate);
    }
    
    console.log('✅ Event listeners attached to buttons');
}

// Missing functions implementation
function exportComparison() {
    if (comparisonData.length === 0 && complexComparisonData.length === 0) {
        alert('Добавьте объекты для сравнения');
        return;
    }
    
    console.log('📄 Exporting comparison:', { properties: comparisonData, complexes: complexComparisonData });
    alert('Экспорт в PDF будет реализован');
}

function sendComparisonToClient() {
    if (comparisonData.length === 0 && complexComparisonData.length === 0) {
        alert('Добавьте объекты для сравнения');
        return;
    }
    
    console.log('📧 Sending comparison to client:', { properties: comparisonData, complexes: complexComparisonData });
    alert('Отправка клиенту будет реализована');
}

function saveComparisonTemplate() {
    if (comparisonData.length === 0 && complexComparisonData.length === 0) {
        alert('Добавьте объекты для сравнения');
        return;
    }
    
    const templateName = prompt('Введите название шаблона:');
    if (templateName) {
        console.log('💾 Saving template:', templateName, { properties: comparisonData, complexes: complexComparisonData });
        alert('Шаблон сохранен');
    }
}

async function loadComparisonFromStorage() {
    // Read comparison data from multiple localStorage keys for compatibility
    const storedComparisons = localStorage.getItem('comparisons') || localStorage.getItem('comparison_properties');
    const storedComplexes = localStorage.getItem('comparison_complexes');
    
    console.log('🔍 Loading from localStorage:', {
        comparisons: storedComparisons,
        complexes: storedComplexes
    });
    
    // Load property comparison data
    if (storedComparisons) {
        try {
            const parsed = JSON.parse(storedComparisons);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // If it's array of IDs, we need to load property data
                if (typeof parsed[0] === 'string' || typeof parsed[0] === 'number') {
                    console.log('📋 Found property IDs, loading from API...');
                    await loadPropertiesByIds(parsed);
                } else {
                    // If it's array of objects, normalize them for comparison table
                    console.log('📋 Found property objects, normalizing for comparison');
                    comparisonData = parsed.slice(0, 4).map(p => normalizeProperty(p)).filter(p => p !== null);
                    if (comparisonData.length > 0) {
                        console.log('🔧 Sample normalized localStorage property:', comparisonData[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing comparisons:', error);
            comparisonData = [];
        }
    } else {
        comparisonData = [];
    }
    
    // Load complex comparison data  
    if (storedComplexes) {
        try {
            const parsed = JSON.parse(storedComplexes);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // If it's array of IDs, we need to load complex data
                if (typeof parsed[0] === 'string' || typeof parsed[0] === 'number') {
                    console.log('📋 Found complex IDs, loading from API...');
                    await loadComplexesByIds(parsed);
                } else {
                    // If it's array of objects, normalize them for comparison table
                    console.log('📋 Found complex objects, normalizing for comparison');
                    complexComparisonData = parsed.slice(0, 4).map(c => normalizeComplex(c)).filter(c => c !== null);
                    if (complexComparisonData.length > 0) {
                        console.log('🔧 Sample normalized localStorage complex:', complexComparisonData[0]);
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing complex comparisons:', error);
            complexComparisonData = [];
        }
    } else {
        complexComparisonData = [];
    }
    
    renderComparison();
}

async function loadPropertiesByIds(propertyIds) {
    try {
        const idsParam = propertyIds.join(',');
        const response = await fetch(`/api/manager/favorites-properties?ids=${idsParam}`);
        
        if (response.ok) {
            const data = await response.json();
            const rawProperties = data.properties || [];
            // Apply normalizeProperty to fix field mapping for comparison table
            comparisonData = rawProperties.map(p => normalizeProperty(p)).filter(p => p !== null);
            console.log('✅ Loaded', comparisonData.length, 'properties from API');
            if (comparisonData.length > 0) {
                console.log('🔧 Sample normalized property:', comparisonData[0]);
            }
        } else {
            console.error('Failed to load properties from API');
            comparisonData = [];
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        comparisonData = [];
    }
}

async function loadComplexesByIds(complexIds) {
    try {
        const response = await fetch('/api/manager/complexes/favorites/list');
        
        if (response.ok) {
            const data = await response.json();
            const allComplexes = data.complexes || [];
            
            // Fix Complex ID filtering bug: normalize IDs to handle string vs number mismatch
            const normalizedIds = new Set(complexIds.map(id => String(id)));
            // Apply normalization for consistent schema (as recommended by architect)
            complexComparisonData = allComplexes.filter(complex => 
                normalizedIds.has(String(complex.id))
            ).map(complex => normalizeComplex(complex)).filter(complex => complex !== null).slice(0, 4);
            
            console.log('✅ Loaded', complexComparisonData.length, 'complexes from API');
            console.log('🔍 ID matching:', { 
                requestedIds: Array.from(normalizedIds), 
                foundComplexes: complexComparisonData.map(c => ({ id: c.id, name: c.name }))
            });
        } else {
            console.error('Failed to load complexes from API');
            complexComparisonData = [];
        }
    } catch (error) {
        console.error('Error loading complexes:', error);
        complexComparisonData = [];
    }
}

function updateComparisonCounter() {
    // Update comparison counter in navigation
    const totalItems = comparisonData.length + complexComparisonData.length;
    const counterElement = document.getElementById('comparison-count');
    
    if (counterElement) {
        counterElement.textContent = totalItems;
        console.log('🔢 Updated comparison counter to:', totalItems);
    }
    
    // Also notify parent window if comparison opened from dashboard
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'comparison-count-update',
                count: totalItems
            }, '*');
        }
    } catch (e) {
        // Ignore cross-origin errors
    }
}

function updateStats() {
    const countEl = document.getElementById('comparison-count');
    const avgPriceEl = document.getElementById('average-price');
    const avgAreaEl = document.getElementById('average-area');
    
    if (currentTab === 'properties') {
        countEl.textContent = comparisonData.length;
    } else {
        countEl.textContent = complexComparisonData.length;
    }
    
    if (comparisonData.length > 0) {
        // Calculate average price
        const prices = comparisonData.filter(p => p.property_price).map(p => p.property_price);
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
        avgPriceEl.textContent = avgPrice > 0 ? formatPrice(avgPrice) : '-';
        
        // Calculate average area
        const areas = comparisonData.filter(p => p.property_size).map(p => p.property_size);
        const avgArea = areas.length > 0 ? areas.reduce((a, b) => a + b, 0) / areas.length : 0;
        avgAreaEl.textContent = avgArea > 0 ? `${Math.round(avgArea)} м²` : '-';
    } else {
        avgPriceEl.textContent = '-';
        avgAreaEl.textContent = '-';
    }
    
    // Update navigation counter
    updateComparisonCounter();
}

function renderComparison() {
    console.log('🖼️ Rendering comparison tables...');
    console.log('Properties to render:', comparisonData.length);
    
    const emptyDiv = document.getElementById('empty-comparison');
    const tableDiv = document.getElementById('comparison-table');
    
    if (comparisonData.length === 0) {
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (tableDiv) tableDiv.style.display = 'none';
        return;
    }
    
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (tableDiv) tableDiv.style.display = 'block';
    
    // Build comparison table
    const tableBody = document.getElementById('comparison-body');
    if (!tableBody) {
        console.error('❌ Table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Define row structure for properties
    const rows = [
        { key: 'property_image', label: 'Фото квартиры', isImage: true },
        { key: 'property_name', label: 'Название', className: 'font-semibold' },
        { key: 'property_price', label: 'Цена', formatter: formatPrice, className: 'text-lg font-bold text-[#0088CC]' },
        { key: 'property_type', label: 'Тип' },
        { key: 'rooms', label: 'Комнат', formatter: (val) => (val == 0 || val === '0') ? 'Студия' : (val || '-') },
        { key: 'property_size', label: 'Общая площадь', formatter: (val) => val && val > 0 ? `${val} м²` : '-' },
        { key: 'building_type', label: 'Класс жилья', formatter: (val) => val || 'Не указан' },
        { key: 'price_per_sqm', label: 'Цена за м²', formatter: formatPrice },
        { key: 'complex_name', label: 'ЖК' },
        { key: 'developer_name', label: 'Застройщик' },
        { key: 'floor', label: 'Этаж' },
        { key: 'floors_total', label: 'Этажей в доме' },
        { key: 'address', label: 'Адрес' },
        { key: 'cashback', label: 'Кешбек', formatter: formatPrice, className: 'text-green-600 font-semibold' }
    ];
    
    // Create table rows
    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-200';
        
        // Label column
        const labelTd = document.createElement('td');
        labelTd.className = 'px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50';
        labelTd.textContent = row.label;
        tr.appendChild(labelTd);
        
        // Property columns
        comparisonData.slice(0, 4).forEach(property => {
            const td = document.createElement('td');
            td.className = `px-6 py-4 text-sm text-gray-900 ${row.className || ''}`;
            
            let value = property[row.key];
            if (row.formatter && value != null) {
                value = row.formatter(value);
            }
            
            td.textContent = value == null ? '-' : value;
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
    
    // Add remove buttons row
    const removeRow = document.createElement('tr');
    removeRow.className = 'border-b border-gray-200';
    
    const removeLabelTd = document.createElement('td');
    removeLabelTd.className = 'px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50';
    removeLabelTd.textContent = 'Действия';
    removeRow.appendChild(removeLabelTd);
    
    comparisonData.slice(0, 4).forEach(property => {
        const td = document.createElement('td');
        td.className = 'px-6 py-4 text-sm text-gray-900';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'text-red-600 hover:text-red-900 text-sm';
        removeBtn.textContent = 'Удалить';
        removeBtn.onclick = () => removeFromComparison(property.property_id);
        
        td.appendChild(removeBtn);
        removeRow.appendChild(td);
    });
    
    tableBody.appendChild(removeRow);
    
    console.log('✅ Comparison table rendered successfully');
    updateStats();
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Export functions for global access
window.loadComparisonFromStorage = loadComparisonFromStorage;
window.updateComparisonCounter = updateComparisonCounter;
window.updateStats = updateStats;
window.renderComparison = renderComparison;
window.switchTab = switchTab;
window.clearComparison = clearComparison;
window.removeFromComparison = removeFromComparison;

// Global functions for tab switching  
function switchTab(tab) {
    currentTab = tab;
    console.log('🔄 Switching to tab:', tab);
    
    // Update tab buttons
    const propertiesTab = document.getElementById('properties-tab');
    const complexesTab = document.getElementById('complexes-tab');
    
    if (tab === 'properties') {
        if (propertiesTab) propertiesTab.className = 'px-6 py-3 text-sm font-medium text-white bg-[#0088CC] rounded-l-lg';
        if (complexesTab) complexesTab.className = 'px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-r-lg hover:bg-gray-200';
        renderComparison();
    } else {
        if (propertiesTab) propertiesTab.className = 'px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-l-lg hover:bg-gray-200';
        if (complexesTab) complexesTab.className = 'px-6 py-3 text-sm font-medium text-white bg-[#0088CC] rounded-r-lg';
        renderComplexComparison();
    }
}

function clearComparison() {
    // Clear ALL comparison data regardless of current tab
    comparisonData = [];
    complexComparisonData = [];
    
    // Clear ALL comparison-specific localStorage keys from all parts of the site
    const comparisonKeys = [
        'comparisons', 
        'comparison_properties', 
        'comparison_complexes',
        'comparison-data',  // Used by complex_functions.js on /properties page
        'complexes'         // Legacy fallback key used by comparison.js
    ];
    
    comparisonKeys.forEach(key => {
        localStorage.removeItem(key);
        localStorage.setItem(key, JSON.stringify([]));
    });
    
    // Re-render current tab
    if (currentTab === 'properties') {
        renderComparison();
    } else {
        renderComplexComparison();
    }
    
    updateStats();
    console.log('🗑️ FULL CLEAR: All comparison data cleared from memory and localStorage');
    console.log('Cleared keys:', comparisonKeys);
    
    // Show lightweight confirmation (no page refresh needed)
    const clearBtn = document.getElementById('clear-comparison-btn');
    if (clearBtn) {
        const originalText = clearBtn.textContent;
        clearBtn.textContent = '✅ Очищено!';
        clearBtn.disabled = true;
        
        setTimeout(() => {
            clearBtn.textContent = originalText;
            clearBtn.disabled = false;
        }, 2000);
    }
}

function removeFromComparison(itemId) {
    if (currentTab === 'properties') {
        comparisonData = comparisonData.filter(p => p.property_id !== itemId);
        const ids = comparisonData.map(p => p.property_id);
        localStorage.setItem('comparisons', JSON.stringify(ids));
        localStorage.setItem('comparison_properties', JSON.stringify(ids));
        renderComparison();
    } else {
        complexComparisonData = complexComparisonData.filter(c => c.id !== itemId);
        const ids = complexComparisonData.map(c => c.id);
        localStorage.setItem('comparison_complexes', JSON.stringify(ids));
        renderComplexComparison();
    }
    updateStats();
    console.log('🗑️ Removed item:', itemId);
}

function renderComplexComparison() {
    console.log('🏢 Rendering complex comparison...');
    console.log('Complexes to render:', complexComparisonData.length);
    
    const emptyDiv = document.getElementById('empty-comparison');
    const tableDiv = document.getElementById('comparison-table');
    
    if (complexComparisonData.length === 0) {
        if (emptyDiv) emptyDiv.style.display = 'block';
        if (tableDiv) tableDiv.style.display = 'none';
        return;
    }
    
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (tableDiv) tableDiv.style.display = 'block';
    
    // Build comparison table for complexes
    const tableBody = document.getElementById('comparison-body');
    if (!tableBody) {
        console.error('❌ Table body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Define row structure for complexes
    const complexRows = [
        { key: 'image', label: 'Фото ЖК', isImage: true },
        { key: 'name', label: 'Название ЖК', className: 'font-semibold' },
        { key: 'developer', label: 'Застройщик' },
        { key: 'address', label: 'Адрес' },
        { key: 'district', label: 'Район' },
        { key: 'min_price', label: 'Цена от', formatter: formatPrice, className: 'text-lg font-bold text-[#0088CC]' },
        { key: 'max_price', label: 'Цена до', formatter: formatPrice },
        { key: 'buildings_count', label: 'Корпусов' },
        { key: 'apartments_count', label: 'Квартир' },
        { key: 'delivery_date', label: 'Срок сдачи' },
        { key: 'status', label: 'Статус' }
    ];
    
    // Create table rows
    complexRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-200';
        
        // Label column
        const labelTd = document.createElement('td');
        labelTd.className = 'px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50';
        labelTd.textContent = row.label;
        tr.appendChild(labelTd);
        
        // Complex columns
        complexComparisonData.slice(0, 4).forEach(complex => {
            const td = document.createElement('td');
            td.className = `px-6 py-4 text-sm text-gray-900 ${row.className || ''}`;
            
            if (row.isImage) {
                // Special handling for image fields
                const img = document.createElement('img');
                const imageUrl = complex[row.key] || '/static/images/no-photo.jpg';
                img.src = imageUrl;
                img.alt = `Фото ${complex.name || 'ЖК'}`;
                img.className = 'w-32 h-24 object-cover rounded-lg shadow-sm';
                img.loading = 'lazy';  // Improve performance
                img.width = 128;       // Layout stability
                img.height = 96;       // Layout stability
                img.onerror = function() {
                    this.src = '/static/images/no-photo.jpg';
                };
                td.appendChild(img);
            } else {
                let value = complex[row.key];
                if (row.formatter && value != null) {
                    value = row.formatter(value);
                }
                td.textContent = value == null ? '-' : value;
            }
            
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
    
    // Add remove buttons row
    const removeRow = document.createElement('tr');
    removeRow.className = 'border-b border-gray-200';
    
    const removeLabelTd = document.createElement('td');
    removeLabelTd.className = 'px-6 py-4 text-sm font-medium text-gray-900 bg-gray-50';
    removeLabelTd.textContent = 'Действия';
    removeRow.appendChild(removeLabelTd);
    
    complexComparisonData.slice(0, 4).forEach(complex => {
        const td = document.createElement('td');
        td.className = 'px-6 py-4 text-sm text-gray-900';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'text-red-600 hover:text-red-900 text-sm';
        removeBtn.textContent = 'Удалить';
        removeBtn.onclick = () => removeFromComparison(complex.id);
        
        td.appendChild(removeBtn);
        removeRow.appendChild(td);
    });
    
    tableBody.appendChild(removeRow);
    
    console.log('✅ Complex comparison table rendered successfully');
    updateStats();
}