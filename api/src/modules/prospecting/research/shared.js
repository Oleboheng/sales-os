export const SHARED_RESEARCH_FIELDS = [
    'website_reviewed',
    'website_quality',
    'social_reviewed',
    'decision_maker_identified',
    'decision_maker_name',
    'sales_hypothesis',
    'notes'
];

export const SHARED_RESEARCH_DEFAULTS = {
    opportunity_id: null,
    website_reviewed: false,
    website_quality: null,
    social_reviewed: false,
    decision_maker_identified: null,
    decision_maker_name: null,
    sales_hypothesis: null,
    notes: null,
    completed_at: null
};

export function buildEmptySharedResearch(opportunityId = null, stage = null) {
    return {
        ...SHARED_RESEARCH_DEFAULTS,
        opportunity_id: opportunityId,
        stage
    };
}

export function mergeResearchPayloads(shared = {}, typeSpecific = {}) {
    return {
        ...buildEmptySharedResearch(),
        ...shared,
        ...typeSpecific
    };
}

export function extractAllowedFields(data = {}, allowedFields = []) {
    const result = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            result[field] = data[field];
        }
    }
    return result;
}
