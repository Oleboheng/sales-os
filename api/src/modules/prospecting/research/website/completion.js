export function getWebsiteCompletionErrors(research = {}) {
    const errors = [];

    const sharedResearch = research.sharedResearch || {};
    const typeResearch = research.typeResearch || {};

    const websiteStatus = typeResearch.website_status;

    if (!websiteStatus) {
        errors.push('Website status required');
    }

    if (
        websiteStatus !== 'NONE' &&
        websiteStatus !== 'UNKNOWN' &&
        !typeResearch.website_url
    ) {
        errors.push('Website URL required when a website exists');
    }

    if (
        !typeResearch.digital_presence ||
        typeResearch.digital_presence.trim().length < 3
    ) {
        errors.push('Digital presence summary required (minimum 3 characters)');
    }

    if (
        !typeResearch.problem_opportunity ||
        typeResearch.problem_opportunity.trim().length < 3
    ) {
        errors.push('Commercial/problem opportunity required (minimum 3 characters)');
    }

    if (
        !typeResearch.potential_improvements ||
        typeResearch.potential_improvements.trim().length < 3
    ) {
        errors.push('Potential Soflas improvements required (minimum 3 characters)');
    }

    if (
        !sharedResearch.sales_hypothesis ||
        sharedResearch.sales_hypothesis.trim().length < 3
    ) {
        errors.push('Sales hypothesis required (minimum 3 characters)');
    }

    return errors;
}
