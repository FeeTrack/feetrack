export const PLANS = {
    'FREE': {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        limits: {
            students: 10,
            staff: 5,
            reminders: 20,
        },
        features: {
            staffModule: true,
            expensesModule: false,
            transportModule: true,
            bulkInsert: false
        },
        hasExpiry: false
    },
    'STANDARD-499': {
        id: 'standard-499',
        name: 'Standard',
        price: 499,
        limits: {
            students: 200,
            staff: 0,
            reminders: 2400,
        },
        features: {
            staffModule: false,
            expensesModule: false,
            transportModule: false,
            bulkInsert: true
        },
        hasExpiry: true
    },
    'STANDARD-999': {
        id: 'standard-999',
        name: 'Standard',
        price: 999,
        limits: {
            students: 500,
            staff: 0,
            reminders: 6000,
        },
        features: {
            staffModule: false,
            expensesModule: false,
            transportModule: false,
            bulkInsert: true
        },
        hasExpiry: true
    },
    'PREMIUM-799': {
        id: 'premium-799',
        name: 'Premium',
        price: 699,
        limits: {
            students: 200,
            staff: -1,
            reminders: 2400,
        },
        features: {
            staffModule: true,
            expensesModule: true,
            transportModule: true,
            bulkInsert: true
        },
        hasExpiry: true
    },
    'PREMIUM-1499': {
        id: 'premium-1499',
        name: 'Premium',
        price: 1499,
        limits: {
            students: 500,
            staff: -1,
            reminders: 6000,
        },
        features: {
            staffModule: true,
            expensesModule: true,
            transportModule: true,
            bulkInsert: true
        },
        hasExpiry: true
    },
    'ENTERPRISE': {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'custom',
        limits: {
            students: -1,
            staff: -1,
            reminders: -1,
        },
        features: {
            staffModule: true,
            expensesModule: true,
            transportModule: true,
            bulkInsert: true
        },
        hasExpiry: true
    },
}

export const getPlanLimits = (planId) => {
    return PLANS[planId.toUpperCase()]
}

export const checkLimit = (planId, resource, currentCount) => {
    const plan = getPlanLimits(planId)
    const limit = plan.limits[resource]

    if (limit === -1) return { allowed: true }

    return {
        allowed: currentCount < limit,
        limit: limit
    }
}

export const checkAccess = (planId, featureName) => {
    const plan = getPlanLimits(planId)
    const hasAccess = plan.features[featureName] === true

    return {
        allowed: hasAccess
    }
}