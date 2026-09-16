import { SPORTS_RESEARCH_FIELDS } from './fields.js';
import { getSportsCompletionErrors } from './completion.js';

const sportsResearch = {
    type: 'SPORTS_MANAGEMENT',
    table: 'sports_management_research',
    joinField: 'research_id',
    fields: SPORTS_RESEARCH_FIELDS,
    defaultValues: {
        teams_count: null,
        players_estimate: null,
        admin_complexity: null,
        current_system: null,
        communication_method: null,
        registration_method: null,
        reporting_method: null
    },
    getCompletionErrors: getSportsCompletionErrors,
    getTypeSpecificResearch: async (db, researchId) => {
        const res = await db.query(
            `SELECT * FROM sports_management_research WHERE research_id = $1`,
            [researchId]
        );
        return res.rows[0] || null;
    },
    saveTypeSpecificResearch: async (db, researchId, data = {}) => {
        const allowedFields = SPORTS_RESEARCH_FIELDS.filter((field) => data[field] !== undefined);
        if (allowedFields.length === 0) {
            return null;
        }

        const existing = await db.query(
            'SELECT id FROM sports_management_research WHERE research_id = $1',
            [researchId]
        );

        const assignmentClauses = [];
        const values = [];
        let idx = 1;

        for (const field of allowedFields) {
            assignmentClauses.push(`${field} = $${idx}`);
            values.push(data[field]);
            idx += 1;
        }

        if (existing.rows.length > 0) {
            values.push(researchId);
            const query = `UPDATE sports_management_research
                SET ${assignmentClauses.join(', ')}, updated_at = NOW()
                WHERE research_id = $${idx}
                RETURNING *`;
            const result = await db.query(query, values);
            return result.rows[0];
        }

        const insertFields = ['research_id', ...allowedFields];
        const placeholders = insertFields.map((_, placeholderIndex) => `$${placeholderIndex + 1}`);
        const insertValues = [researchId, ...allowedFields.map((field) => data[field])];
        const query = `INSERT INTO sports_management_research (${insertFields.join(', ')})
            VALUES (${placeholders.join(', ')})
            RETURNING *`;
        const result = await db.query(query, insertValues);
        return result.rows[0];
    }
};

export default sportsResearch;
