// js/views/roles.js

export const ROLE_DEFINITIONS = {
    'System Admin': {
        description: 'Full system access across all LGUs',
        lguRestricted: false,
        permissions: {
            dashboard:   { read: true,  write: true },
            fsbds:       { read: true,  write: true },
            vehicles:    { read: true,  write: true },
            made:        { read: true,  write: true },
            consumption: { read: true,  write: true },
            seu:         { read: true,  write: true },
            rios:        { read: true,  write: true },
            ppas:        { read: true,  write: true },
            reporting:   { read: true,  write: true },
            users:       { read: true,  write: true },
            lgus:        { read: true,  write: true },
            admin:       { read: true,  write: true }
        }
    },
    'LGU Admin': {
        description: 'Full access scoped to assigned LGU',
        lguRestricted: true,
        permissions: {
            dashboard:   { read: true,  write: true },
            fsbds:       { read: true,  write: true },
            vehicles:    { read: true,  write: true },
            made:        { read: true,  write: true },
            consumption: { read: true,  write: true },
            seu:         { read: true,  write: true },
            rios:        { read: true,  write: true },
            ppas:        { read: true,  write: true },
            reporting:   { read: true,  write: true },
            users:       { read: true,  write: true }, // Can manage users in their LGU
            lgus:        { read: true,  write: false },
            admin:       { read: false, write: false }
        }
    },
    'LGU EEC Officer': {
        description: 'Data entry for assets and consumption',
        lguRestricted: true,
        permissions: {
            dashboard:   { read: true,  write: false },
            fsbds:       { read: true,  write: true },
            vehicles:    { read: true,  write: true },
            made:        { read: true,  write: true },
            consumption: { read: true,  write: true },
            seu:         { read: true,  write: false },
            rios:        { read: true,  write: false },
            ppas:        { read: true,  write: false },
            reporting:   { read: true,  write: false },
            users:       { read: false, write: false },
            lgus:        { read: false, write: false },
            admin:       { read: false, write: false }
        }
    },
    'Auditor': {
        description: 'Cross-LGU read access, can create RIOs',
        lguRestricted: false,
        permissions: {
            dashboard:   { read: true,  write: false },
            fsbds:       { read: true,  write: false },
            vehicles:    { read: true,  write: false },
            made:        { read: true,  write: false },
            consumption: { read: true,  write: false },
            seu:         { read: true,  write: true },
            rios:        { read: true,  write: true },
            ppas:        { read: true,  write: false },
            reporting:   { read: true,  write: false },
            users:       { read: false, write: false },
            lgus:        { read: false, write: false },
            admin:       { read: false, write: false }
        }
    },
    'LGU Planner': {
        description: 'Can view data and manage PPAs',
        lguRestricted: true,
        permissions: {
            dashboard:   { read: true,  write: false },
            fsbds:       { read: true,  write: false },
            vehicles:    { read: true,  write: false },
            made:        { read: true,  write: false },
            consumption: { read: true,  write: false },
            seu:         { read: true,  write: false },
            rios:        { read: true,  write: false },
            ppas:        { read: true,  write: true },
            reporting:   { read: true,  write: false },
            users:       { read: false, write: false },
            lgus:        { read: false, write: false },
            admin:       { read: false, write: false }
        }
    }
};

export function getRolePreset(roleName) {
    return ROLE_DEFINITIONS[roleName] || null;
}

export function getRoleNames() {
    return Object.keys(ROLE_DEFINITIONS);
}

// Numeric hierarchy — higher number = more privilege
export const ROLE_HIERARCHY = {
    'System Admin': 100,
    'LGU Admin': 50,
    'LGU EEC Officer': 20,
    'Auditor': 20,
    'LGU Planner': 20,
    'Pending': 0
};

/**
 * Returns the list of role names that a user with `currentRole` is allowed to assign.
 * A user can only assign roles strictly below their own level.
 */
export function getAssignableRoles(currentRole) {
    const myLevel = ROLE_HIERARCHY[currentRole] ?? 0;
    return Object.entries(ROLE_HIERARCHY)
        .filter(([, level]) => level < myLevel)
        .map(([name]) => name);
}
