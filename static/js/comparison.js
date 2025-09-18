
class ComparisonManager {
    constructor() {
        this.comparisons = this.loadComparisons();
        this.complexes = this.loadComplexes();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateComparisonUI();
        this.updateComparisonCounter();
    }

    loadComparisons() {
        try {
            const saved = localStorage.getItem('comparisons');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading comparisons:', e);
            return [];
        }
    }

    loadComplexes() {
        try {
            // Try new key first, fallback to old key for compatibility
            const saved = localStorage.getItem('comparison_complexes') || localStorage.getItem('complexes');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading complexes:', e);
            return [];
        }
    }

    saveComparisons() {
        try {
            localStorage.setItem('comparisons', JSON.stringify(this.comparisons));
        } catch (e) {
            console.error('Error saving comparisons:', e);
        }
    }

    saveComplexes() {
        try {
            // Use unified key for both files
            localStorage.setItem('comparison_complexes', JSON.stringify(this.complexes));
            // Remove old key for cleanup
            localStorage.removeItem('complexes');
        } catch (e) {
            console.error('Error saving complexes:', e);
        }
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            let compareElement = null;
            
            if (e.target && e.target.classList && e.target.classList.contains('compare-btn')) {
                compareElement = e.target;
            } else if (e.target && e.target.closest) {
                compareElement = e.target.closest('.compare-btn');
            }
            
            if (compareElement) {
                // Handle property comparison
                if (compareElement.dataset.propertyId) {
                    const propertyId = compareElement.dataset.propertyId;
                    this.toggleComparison(propertyId, compareElement);
                    e.preventDefault();
                    e.stopPropagation();
                }
                // Handle complex comparison
                else if (compareElement.dataset.complexId) {
                    const complexId = compareElement.dataset.complexId;
                    this.toggleComplexComparison(complexId, compareElement);
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        });
    }

    toggleComparison(propertyId, element) {
        const index = this.comparisons.indexOf(propertyId);
        
        if (index > -1) {
            this.comparisons.splice(index, 1);
            this.updateCompareButton(element, false);
        } else {
            if (this.comparisons.length >= 4) {
                alert('Максимум 4 объекта для сравнения');
                return;
            }
            this.comparisons.push(propertyId);
            this.updateCompareButton(element, true);
        }
        
        this.saveComparisons();
        this.updateComparisonCounter();
    }

    toggleComplexComparison(complexId, element) {
        const index = this.complexes.indexOf(complexId);
        
        if (index > -1) {
            this.complexes.splice(index, 1);
            this.updateCompareButton(element, false);
            console.log('Complex removed from comparison:', complexId);
        } else {
            if (this.complexes.length >= 4) {
                alert('Максимум 4 ЖК для сравнения');
                return;
            }
            this.complexes.push(complexId);
            this.updateCompareButton(element, true);
            console.log('Complex added to comparison:', complexId);
        }
        
        this.saveComplexes();
        this.updateComparisonCounter();
    }

    updateCompareButton(element, isInComparison) {
        if (isInComparison) {
            element.classList.add('active');
            element.textContent = 'В сравнении';
        } else {
            element.classList.remove('active');
            element.textContent = 'Сравнить';
        }
    }

    updateComparisonUI() {
        // Update property comparison buttons
        document.querySelectorAll('.compare-btn[data-property-id]').forEach(btn => {
            const propertyId = btn.dataset.propertyId;
            const isInComparison = this.comparisons.includes(propertyId);
            this.updateCompareButton(btn, isInComparison);
        });
        
        // Update complex comparison buttons  
        document.querySelectorAll('.compare-btn[data-complex-id]').forEach(btn => {
            const complexId = btn.dataset.complexId;
            const isInComparison = this.complexes.includes(complexId);
            this.updateCompareButton(btn, isInComparison);
        });
    }

    updateComparisonCounter() {
        const totalItems = this.comparisons.length + this.complexes.length;
        const counter = document.querySelector('.comparison-counter');
        if (counter) {
            counter.textContent = totalItems;
            counter.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }

    getComparisons() {
        return this.comparisons;
    }

    getComplexes() {
        return this.complexes;
    }

    getTotalCount() {
        return this.comparisons.length + this.complexes.length;
    }
}

// Initialize comparison manager
let comparisonManager;
document.addEventListener('DOMContentLoaded', function() {
    comparisonManager = new ComparisonManager();
});
