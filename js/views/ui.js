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