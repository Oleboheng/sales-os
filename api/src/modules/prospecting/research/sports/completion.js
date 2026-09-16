export function getSportsCompletionErrors(research = {}) {
    const errors = [];
    const sharedResearch = research.sharedResearch || {};
    const typeResearch = research.typeResearch || {};

    if (sharedResearch.website_reviewed !== true) {
        errors.push('Website review required');
    }
    if (sharedResearch.social_reviewed !== true) {
        errors.push('Social review required');
    }

    const hasOperations = Boolean(
        typeResearch.teams_count ||
        typeResearch.admin_complexity ||
        typeResearch.current_system ||
        typeResearch.registration_method
    );

    if (!hasOperations) {
        errors.push('At least one operational field required (teams, admin complexity, current system, registration)');
    }

    if (!sharedResearch.sales_hypothesis || sharedResearch.sales_hypothesis.trim().length < 3) {
        errors.push('Sales hypothesis required (minimum 3 characters)');
    }

    return errors;
}
