// js/ui.js

export function applyHeroHeader(container) {
    if (!container) return;
    // Apply gradient style to headers dynamically for views not manually updated
    container.querySelectorAll('.bg-gray-50.border-b.border-gray-200').forEach(header => {
        if (header.querySelector('h1, h2, h3')) {
            header.classList.remove('bg-gray-50');
            header.classList.add('hero-header');
            const title = header.querySelector('h1, h2, h3');
            if (title) {
                title.classList.remove('text-gray-800');
            }
        }
    });
}

export function updateSidebarActiveState() {
    if (typeof document === 'undefined' || typeof location === 'undefined') return;
    
    const currentHash = location.hash;
    const navLinks = document.querySelectorAll('aside nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        let isActive = false;

        if (href === '#/dashboard') {
            // Active if hash is empty, just a '#', or exactly '#/dashboard'
            isActive = (currentHash === '' || currentHash === '#' || currentHash === '#/dashboard');
        } else {
            // Active if the hash starts with the link's href, for nested routes
            isActive = currentHash.startsWith(href);
        }

        if (isActive) {
            link.classList.remove('hover:bg-gray-700', 'hover:text-white');
            link.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-indigo-700', 'text-white', 'shadow-md');
        } else {
            link.classList.add('hover:bg-gray-700', 'hover:text-white');
            link.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-indigo-700', 'text-white', 'shadow-md');
        }
    });
}

export function openAssetDetailsModal(title, reports, valueKey, unit, madeItems = []) {
    // Sort reports descending for table, ascending for chart
    const sortedDesc = [...reports].sort((a, b) => (b.reporting_year - a.reporting_year) || (b.reporting_month - a.reporting_month));
    const sortedAsc = [...reports].sort((a, b) => (a.reporting_year - b.reporting_year) || (a.reporting_month - b.reporting_month));
    
    const values = sortedDesc.map(r => Number(r[valueKey]) || 0);
    
    // Stats
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length ? total / values.length : 0;
    const peak = Math.max(...values, 0);
    const min = values.length ? Math.min(...values) : 0;
    const count = values.length;

    // Chart Generation (SVG)
    const chartWidth = 500;
    const chartHeight = 200;
    const padding = 20;
    const chartValues = sortedAsc.map(r => Number(r[valueKey]) || 0);
    const maxVal = Math.max(...chartValues, 1);
    
    const points = chartValues.map((v, i) => {
        const x = padding + (i / (chartValues.length - 1 || 1)) * (chartWidth - 2 * padding);
        const y = chartHeight - padding - ((v / maxVal) * (chartHeight - 2 * padding));
        return `${x},${y}`;
    }).join(' ');

    const chartSvg = chartValues.length > 0 ? `
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-full h-48 border rounded bg-gray-50">
            <polyline fill="none" stroke="#3B82F6" stroke-width="2" points="${points}" />
            ${chartValues.map((v, i) => {
                const x = padding + (i / (chartValues.length - 1 || 1)) * (chartWidth - 2 * padding);
                const y = chartHeight - padding - ((v / maxVal) * (chartHeight - 2 * padding));
                return `<circle cx="${x}" cy="${y}" r="3" fill="#2563EB"><title>${sortedAsc[i].reporting_year}-${sortedAsc[i].reporting_month}: ${v} ${unit}</title></circle>`;
            }).join('')}
        </svg>
    ` : '<div class="h-48 flex items-center justify-center bg-gray-50 border rounded text-gray-500">No data available for chart</div>';

    const madeTable = (madeItems && madeItems.length > 0) ? `
        <div class="mt-6 pt-4 border-t border-gray-200">
            <h4 class="font-semibold text-gray-700 mb-2">Equipment Details (MADE)</h4>
            <div class="overflow-x-auto border rounded-lg">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rating (kW)</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hrs/Day</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${madeItems.map(m => `
                            <tr>
                                <td class="px-4 py-2 whitespace-nowrap text-gray-700">${m.description_of_equipment || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-gray-600">${m.energy_use_category || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-gray-600">${m.location || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right text-gray-600 font-mono">${m.power_rating_kw || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right text-gray-600 font-mono">${m.time_of_use_hours_per_day || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    ` : '';

    // Modal HTML
    const modal = document.createElement('div');
    modal.id = 'asset-detail-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="relative border w-full max-w-4xl shadow-lg rounded-lg bg-white m-4 overflow-hidden">
            <div class="flex justify-between items-center px-6 py-4 border-b hero-header">
                <h3 class="text-xl font-bold">Details: ${title}</h3>
                <button class="text-white hover:text-gray-200 text-2xl font-bold leading-none" onclick="document.getElementById('asset-detail-modal').remove()">&times;</button>
            </div>
            
            <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Total Consumption</p>
                            <p class="text-lg font-bold text-blue-700">${total.toLocaleString()} ${unit}</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Average Monthly</p>
                            <p class="text-lg font-bold text-green-700">${avg.toLocaleString(undefined, {maximumFractionDigits: 1})} ${unit}</p>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Peak Monthly</p>
                            <p class="text-lg font-bold text-yellow-700">${peak.toLocaleString()} ${unit}</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Records Count</p>
                            <p class="text-lg font-bold text-purple-700">${count}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Consumption Trend</h4>
                        ${chartSvg}
                        <p class="text-xs text-gray-500 mt-1 text-center">Hover over points for details</p>
                    </div>
                </div>

                <div class="flex flex-col h-96">
                    <h4 class="font-semibold text-gray-700 mb-2">History</h4>
                    <div class="overflow-y-auto flex-1 border rounded-lg">
                        <table class="min-w-full text-sm leading-normal">
                            <thead>
                                <tr class="bg-gray-100 sticky top-0">
                                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Consumption (${unit})</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${sortedDesc.map(r => `
                                    <tr>
                                        <td class="px-4 py-2 whitespace-no-wrap text-gray-700">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</td>
                                        <td class="px-4 py-2 whitespace-no-wrap text-right font-mono text-gray-800">${(Number(r[valueKey])||0).toLocaleString()}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="2" class="px-4 py-2 text-center text-gray-500">No records found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ${madeTable}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

export function openFormModal({ title, fields, submitText = 'Submit' }) {
    return new Promise((resolve) => {
        // Prevent multiple modals
        if (document.getElementById('form-modal')) {
            document.getElementById('form-modal').remove();
        }

        const modal = document.createElement('div');
        modal.id = 'form-modal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';

        const formFieldsHTML = fields.map(field => {
            const { name, label, type, options, defaultValue = '', required = false, placeholder = '' } = field;
            let inputHTML = '';
            const commonClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50";

            switch (type) {
                case 'select':
                    inputHTML = `<select id="modal-field-${name}" name="${name}" class="${commonClasses}" ${required ? 'required' : ''}>
                        ${options.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}
                    </select>`;
                    break;
                case 'textarea':
                     inputHTML = `<textarea id="modal-field-${name}" name="${name}" rows="3" class="${commonClasses}" placeholder="${placeholder}" ${required ? 'required' : ''}>${defaultValue}</textarea>`;
                    break;
                case 'text':
                default:
                    inputHTML = `<input type="text" id="modal-field-${name}" name="${name}" value="${defaultValue}" placeholder="${placeholder}" class="${commonClasses}" ${required ? 'required' : ''}>`;
                    break;
            }
            return `<div class="mb-4">
                <label for="modal-field-${name}" class="block text-sm font-medium text-gray-700">${label}</label>
                ${inputHTML}
            </div>`;
        }).join('');

        modal.innerHTML = `
            <div class="relative border w-full max-w-lg shadow-lg rounded-lg bg-white m-4">
                <form id="modal-actual-form">
                    <div class="flex justify-between items-center px-6 py-4 border-b hero-header">
                        <h3 class="text-xl font-bold">${title}</h3>
                        <button type="button" class="text-white hover:text-gray-200 text-2xl font-bold leading-none" id="modal-btn-close">&times;</button>
                    </div>
                    <div class="p-6">
                        ${formFieldsHTML}
                    </div>
                    <div class="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" id="modal-btn-cancel" class="bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg border border-gray-300 transition-colors">Cancel</button>
                        <button type="submit" id="modal-btn-submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">${submitText}</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = document.getElementById('modal-actual-form');
        const closeModal = () => modal.remove();

        const handleCancel = () => {
            closeModal();
            resolve(null);
        };

        document.getElementById('modal-btn-close').addEventListener('click', handleCancel);
        document.getElementById('modal-btn-cancel').addEventListener('click', handleCancel);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleCancel();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const result = Object.fromEntries(formData.entries());
            closeModal();
            resolve(result);
        });
    });
}

export function openInfoModal({ title, contentHTML }) {
    // Prevent multiple modals
    if (document.getElementById('info-modal')) {
        document.getElementById('info-modal').remove();
    }

    const modal = document.createElement('div');
    modal.id = 'info-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';

    modal.innerHTML = `
        <div class="relative border w-full max-w-3xl shadow-lg rounded-lg bg-white m-4">
            <div class="flex justify-between items-center px-6 py-4 border-b hero-header">
                <h3 class="text-xl font-bold">${title}</h3>
                <button type="button" class="text-white hover:text-gray-200 text-2xl font-bold leading-none" id="info-modal-btn-close">&times;</button>
            </div>
            <div class="p-6 prose max-w-none">
                ${contentHTML}
            </div>
            <div class="px-6 py-4 bg-gray-50 border-t flex justify-end">
                <button type="button" id="info-modal-btn-ok" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    document.getElementById('info-modal-btn-close').addEventListener('click', closeModal);
    document.getElementById('info-modal-btn-ok').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

export function initManualAccordion() {
    const manualCards = document.querySelectorAll('.manual-card');

    manualCards.forEach(card => {
        // The listener is attached to the card itself, so any click within it will trigger the expansion.
        if (card.dataset.listenerAttached) return;
        card.dataset.listenerAttached = 'true';

        // Accessibility
        card.setAttribute('role', 'button');
        if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');

        const toggle = () => {
            const targetId = card.dataset.toggleTarget;
            const targetContent = document.getElementById(targetId);
            const chevron = card.querySelector('.manual-card-chevron');

            if (targetContent) {
                const isOpen = targetContent.classList.contains('max-h-[2000px]');

                if (!isOpen) {
                    // Close other open cards to create an accordion effect
                    document.querySelectorAll('.manual-content').forEach(openContent => {
                        openContent.classList.remove('max-h-[2000px]', 'opacity-100', 'translate-y-0');
                        openContent.classList.add('max-h-0', 'opacity-0', '-translate-y-2');
                        
                        const openCard = document.querySelector(`[data-toggle-target="${openContent.id}"]`);
                        if (openCard) {
                            openCard.classList.add('rounded-lg');
                            openCard.classList.remove('rounded-t-lg', 'shadow-xl');
                            openCard.querySelector('.manual-card-chevron')?.classList.remove('rotate-180');
                        }
                    });

                    // Open the clicked card
                    targetContent.classList.remove('max-h-0', 'opacity-0', '-translate-y-2');
                    targetContent.classList.add('max-h-[2000px]', 'opacity-100', 'translate-y-0');
                    card.classList.remove('rounded-lg');
                    card.classList.add('rounded-t-lg', 'shadow-xl');
                    chevron?.classList.add('rotate-180');
                } else {
                    // Close the clicked card
                    targetContent.classList.add('max-h-0', 'opacity-0', '-translate-y-2');
                    targetContent.classList.remove('max-h-[2000px]', 'opacity-100', 'translate-y-0');
                    card.classList.add('rounded-lg');
                    card.classList.remove('rounded-t-lg', 'shadow-xl');
                    chevron?.classList.remove('rotate-180');
                }
            }
        };

        card.addEventListener('click', toggle);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });
}

/**
 * Populates a select element with LGUs from the database.
 * @param {HTMLSelectElement} selector 
 * @param {Object} options 
 * @returns {Promise<Array>} The list of LGUs
 */
export async function populateLguSelector(selector, options = {}) {
    const lgus = await window.getLguList();
    if (!selector) return lgus;
    
    const { 
        includeEmpty = true, 
        emptyText = 'Select LGU', 
        emptyValue = '',
        additionalOptions = [] 
    } = options;
    
    let html = includeEmpty ? `<option value="${emptyValue}">${emptyText}</option>` : '';
    
    if (additionalOptions.length > 0) {
        html += additionalOptions.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
    }
    
    html += lgus.map(lgu => `<option value="${lgu.id}">${lgu.name}</option>`).join('');
    selector.innerHTML = html;
    return lgus;
}