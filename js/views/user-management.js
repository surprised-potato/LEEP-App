import { populateLguSelector } from './ui.js';

let allUsers = [];
let selectedUser = null;
let allLgus = [];

const modules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'fsbds', name: 'Buildings (FSBD)' },
    { id: 'vehicles', name: 'Vehicles' },
    { id: 'made', name: 'Equipment (MADE)' },
    { id: 'consumption', name: 'Consumption' },
    { id: 'seu', name: 'SEU Identification' },
    { id: 'rios', name: 'Recommendations (RIO)' },
    { id: 'ppas', name: 'Projects (PPA)' },
    { id: 'reporting', name: 'Compliance Report' },
    { id: 'lgus', name: 'LGUs' },
    { id: 'admin', name: 'Admin Panel' }
];

export async function renderUserManagement() {
    const userListContainer = document.getElementById('user-list');
    const searchInput = document.getElementById('user-search');
    const lguFilter = document.getElementById('user-filter-lgu');
    const lguAssignSelect = document.getElementById('user-lgu-assign');
    
    // Fetch data and populate selectors
    const [users, lgus] = await Promise.all([
        window.getUserList(),
        populateLguSelector(lguAssignSelect, { emptyText: 'No LGU Assigned (System Wide)' })
    ]);
    
    allUsers = users;
    allLgus = lgus;

    // Also populate the filter if it exists
    if (lguFilter) {
        const filterOptions = allLgus.map(lgu => `<option value="${lgu.id}">${lgu.name}</option>`).join('');
        lguFilter.innerHTML = '<option value="">All LGUs</option><option value="none">No LGU Assigned</option>' + filterOptions;
    }
    
    const renderList = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedLgu = lguFilter?.value;

        const filtered = allUsers.filter(u => {
            const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm) || 
                                 u.email?.toLowerCase().includes(searchTerm);
            const matchesLgu = !selectedLgu || (selectedLgu === 'none' ? !u.assignedLguId : u.assignedLguId === selectedLgu);
            return matchesSearch && matchesLgu;
        });
        
        if (filtered.length === 0) {
            userListContainer.innerHTML = '<div class="p-4 text-center text-gray-500">No users found.</div>';
            return;
        }
        
        userListContainer.innerHTML = filtered.map(u => `
            <div class="user-item p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedUser?.id === u.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}" data-id="${u.id}">
                <div class="font-bold text-gray-800">${u.displayName || 'Unknown User'}</div>
                <div class="text-xs text-gray-500">${u.email}</div>
                <div class="mt-1"><span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 uppercase font-bold">${u.role || 'Pending'}</span></div>
            </div>
        `).join('');
        
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => selectUser(item.dataset.id));
        });
    };

    searchInput.addEventListener('input', renderList);
    lguFilter?.addEventListener('change', renderList);
    renderList(); // Initial render

    document.getElementById('btn-save-permissions').addEventListener('click', savePermissions);
}

function selectUser(userId) {
    selectedUser = allUsers.find(u => u.id === userId);
    
    document.querySelectorAll('.user-item').forEach(item => {
        if (item.dataset.id === userId) {
            item.classList.add('bg-blue-100', 'border-l-4', 'border-l-blue-600');
        } else {
            item.classList.remove('bg-blue-100', 'border-l-4', 'border-l-blue-600');
        }
    });

    const panel = document.getElementById('permissions-panel');
    const empty = document.getElementById('permissions-empty');
    const nameEl = document.getElementById('selected-user-name');
    const emailEl = document.getElementById('selected-user-email');
    const modulesList = document.getElementById('modules-list');
    const lguAssignSelect = document.getElementById('user-lgu-assign');

    panel.classList.remove('hidden');
    empty.classList.add('hidden');
    
    nameEl.textContent = selectedUser.displayName || 'Unknown User';
    emailEl.textContent = selectedUser.email;

    lguAssignSelect.value = selectedUser.assignedLguId || '';
    const permissions = selectedUser.permissions || {};

    modulesList.innerHTML = modules.map(m => {
        const read = permissions[m.id]?.read ?? true;
        const write = permissions[m.id]?.write ?? true;
        
        return `
            <div class="flex items-center py-2 border-b border-gray-100 last:border-0">
                <div class="flex-1 text-sm font-medium text-gray-700">${m.name}</div>
                <div class="w-24 flex justify-center">
                    <input type="checkbox" class="perm-check w-5 h-5 text-blue-600 rounded focus:ring-blue-500" data-module="${m.id}" data-type="read" ${read ? 'checked' : ''}>
                </div>
                <div class="w-24 flex justify-center">
                    <input type="checkbox" class="perm-check w-5 h-5 text-blue-600 rounded focus:ring-blue-500" data-module="${m.id}" data-type="write" ${write ? 'checked' : ''}>
                </div>
            </div>
        `;
    }).join('');
}

async function savePermissions() {
    if (!selectedUser) return;
    const btn = document.getElementById('btn-save-permissions');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const permissions = {};
    document.querySelectorAll('.perm-check').forEach(cb => {
        const mod = cb.dataset.module;
        const type = cb.dataset.type;
        if (!permissions[mod]) permissions[mod] = {};
        permissions[mod][type] = cb.checked;
    });

    const assignedLguId = document.getElementById('user-lgu-assign').value || null;

    // Update both permissions and LGU assignment
    const success = await window.db.collection('users').doc(selectedUser.id).update({ 
        permissions, 
        assignedLguId 
    });

    if (success) {
        selectedUser.permissions = permissions;
        selectedUser.assignedLguId = assignedLguId;
        btn.textContent = 'Saved!';
        setTimeout(() => { btn.disabled = false; btn.textContent = 'Save Permissions'; }, 2000);
    } else {
        alert('Failed to save permissions.');
        btn.disabled = false; btn.textContent = 'Save Permissions';
    }
}