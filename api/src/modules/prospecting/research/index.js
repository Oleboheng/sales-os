import sportsResearch from './sports/index.js';
import websiteResearch from './website/index.js';
import bookingResearch from './booking/index.js';

export const researchRegistry = {
    SPORTS_MANAGEMENT: sportsResearch,
    WEBSITE: websiteResearch,
    BOOKING_SYSTEM: bookingResearch
};

export function getResearchModule(opportunityType) {
    if (!opportunityType) return null;
    return researchRegistry[opportunityType] || null;
}

export default researchRegistry;
