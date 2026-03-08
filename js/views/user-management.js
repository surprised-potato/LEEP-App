import { populateLguSelector } from './ui.js';
import { getRolePreset } from './roles.js';

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
    { id: 'users', name: 'Users' },
    { id: 'lgus', name: 'LGUs' },
    { id: 'admin', name: 'Admin Panel' }
];

export async function renderUserManagement() {
    const userListContainer = document.getElementById('user-list');
    const searchInput = document.getElementById('user-search');
    const lguFilter = document.getElementById('user-filter-lgu');
    const lguAssignSelect = document.getElementById('user-lgu-assign');
    const roleAssignSelect = document.getElementById('user-role-assign');
    
    // Fetch data and populate selectors
    const [users, lgus] = await Promise.all([
        window.getUserList(),
        populateLguSelector(lguAssignSelect, { 
            emptyText: 'No LGU Assigned (System Wide)',
            filterByUser: false 
        })
    ]);
    
    allUsers = users;
    allLgus = lgus;

    // Sort: Pending users at the top
    allUsers.sort((a, b) => {
        if (a.role === 'Pending' && b.role !== 'Pending') return -1;
        if (a.role !== 'Pending' && b.role === 'Pending') return 1;
        return (a.displayName || '').localeCompare(b.displayName || '');
    });

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
        
        userListContainer.innerHTML = filtered.map(u => {
            const isPending = u.role === 'Pending';
            const badgeClass = isPending ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-200 text-gray-700';
            
            return `
                <div class="user-item p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${selectedUser?.id === u.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''}" data-id="${u.id}">
                    <div class="flex justify-between items-start">
                        <div class="font-bold text-gray-800">${u.displayName || 'Unknown User'}</div>
                        ${isPending ? '<div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>' : ''}
                    </div>
                    <div class="text-xs text-gray-500">${u.email}</div>
                    <div class="mt-2"><span class="text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider ${badgeClass}">${u.role || 'Pending'}</span></div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => selectUser(item.dataset.id));
        });
    };

    searchInput.addEventListener('input', renderList);
    lguFilter?.addEventListener('change', renderList);
    roleAssignSelect?.addEventListener('change', (e) => onRoleChange(e.target.value));

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
    const roleAssignSelect = document.getElementById('user-role-assign');

    panel.classList.remove('hidden');
    empty.classList.add('hidden');
    
    nameEl.textContent = selectedUser.displayName || 'Unknown User';
    emailEl.textContent = selectedUser.email;

    if (roleAssignSelect) roleAssignSelect.value = selectedUser.role || 'Pending';
    if (lguAssignSelect) lguAssignSelect.value = selectedUser.assignedLguId || '';

    updatePermissionsGrid(selectedUser.permissions || {});
}

function updatePermissionsGrid(permissions) {
    const modulesList = document.getElementById('modules-list');
    modulesList.innerHTML = modules.map(m => {
        const read = permissions[m.id]?.read ?? false;
        const write = permissions[m.id]?.write ?? false;
        
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

function onRoleChange(roleName) {
    const preset = getRolePreset(roleName);
    if (!preset) {
        // Clear all if no preset (e.g., Pending)
        updatePermissionsGrid({});
        return;
    }
    updatePermissionsGrid(preset.permissions);
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

    const role = document.getElementById('user-role-assign').value;
    const assignedLguId = document.getElementById('user-lgu-assign').value || null;

    // Update role, permissions and LGU assignment
    try {
        await window.db.collection('users').doc(selectedUser.id).update({ 
            role,
            permissions, 
            assignedLguId 
        });

        selectedUser.role = role;
        selectedUser.permissions = permissions;
        selectedUser.assignedLguId = assignedLguId;
        
        btn.textContent = 'Saved!';
        
        // Refresh the list to show new role
        renderUserManagement(); 

        setTimeout(() => { 
            btn.disabled = false; 
            btn.textContent = 'Save Permissions'; 
        }, 2000);
    } catch (error) {
        console.error('Error saving permissions:', error);
        alert('Failed to save permissions: ' + error.message);
        btn.disabled = false; btn.textContent = 'Save Permissions';
    }
}