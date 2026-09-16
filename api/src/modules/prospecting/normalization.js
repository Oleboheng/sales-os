// Normalization utilities for duplicate detection

export function normalizeName(name) {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeEmail(email) {
    if (!email) return '';
    return email.trim().toLowerCase();
}

export function normalizePhone(phone) {
    if (!phone) return '';
    // Remove all non-alphanumeric characters except '+'
    return phone.replace(/[^0-9+]/g, '');
}

export function normalizeInstagram(instagram) {
    if (!instagram) return '';
    let cleaned = instagram.trim();
    // Remove @ prefix
    if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);
    // Remove URL prefixes
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//, '');
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//, '');
    // Remove trailing slash
    if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
    return cleaned.toLowerCase();
}

export function normalizeWebsite(website) {
    if (!website) return '';
    let cleaned = website.trim().toLowerCase();
    // Remove protocol
    cleaned = cleaned.replace(/^https?:\/\//, '');
    // Remove www prefix
    cleaned = cleaned.replace(/^www\./, '');
    // Remove trailing slash
    if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
    return cleaned;
}

export function normalizeFacebook(facebook) {
    if (!facebook) return '';
    let cleaned = facebook.trim().toLowerCase();
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?facebook\.com\//, '');
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?fb\.com\//, '');
    if (cleaned.endsWith('/')) cleaned = cleaned.slice(0, -1);
    return cleaned;
}
