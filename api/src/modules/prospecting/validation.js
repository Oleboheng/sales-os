// Input validation for Quick Capture

export function validateQuickCapture(input) {
    const errors = [];
    const approvedOpportunityTypes = ['SPORTS_MANAGEMENT', 'WEBSITE', 'BOOKING_SYSTEM'];

    // Name is required
    if (!input.name || input.name.trim().length < 2) {
        errors.push({
            field: 'name',
            message: 'Organisation name is required (minimum 2 characters)'
        });
    }

    if (input.name && input.name.length > 255) {
        errors.push({
            field: 'name',
            message: 'Organisation name must be 255 characters or fewer'
        });
    }

    // Website validation (if provided)
    if (input.website) {
        try {
            const url = new URL(input.website.startsWith('http') ? input.website : `http://${input.website}`);
            if (!url.hostname) {
                errors.push({ field: 'website', message: 'Enter a valid website address' });
            }
        } catch {
            errors.push({ field: 'website', message: 'Enter a valid website address' });
        }
    }

    // Email validation (if provided)
    if (input.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.email.trim())) {
            errors.push({ field: 'email', message: 'Enter a valid email address' });
        }
    }

    // Instagram validation (if provided) - basic check
    if (input.instagram && input.instagram.length > 100) {
        errors.push({
            field: 'instagram',
            message: 'Instagram handle must be 100 characters or fewer'
        });
    }

    // Source validation
    const validSources = ['manual', 'instagram', 'facebook', 'google', 'website', 'referral', 'linkedin', 'other'];
    if (input.source && !validSources.includes(input.source)) {
        errors.push({
            field: 'source',
            message: `Source must be one of: ${validSources.join(', ')}`
        });
    }

    if (input.opportunity_type !== undefined && !approvedOpportunityTypes.includes(input.opportunity_type)) {
        errors.push({
            field: 'opportunity_type',
            message: `Opportunity type must be one of: ${approvedOpportunityTypes.join(', ')}`
        });
    }

    // Province validation (if provided)
    const validProvinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'North West', 'Northern Cape', 'Limpopo'];
    if (input.province && !validProvinces.includes(input.province)) {
        errors.push({
            field: 'province',
            message: `Province must be one of: ${validProvinces.join(', ')}`
        });
    }

    return errors;
}
