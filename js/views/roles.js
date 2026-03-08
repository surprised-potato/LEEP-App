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
            users:       { read: true,  write: false }, // Can see users in their LGU
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
