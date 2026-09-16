import { WEBSITE_RESEARCH_FIELDS } from './fields.js';
import { getWebsiteCompletionErrors } from './completion.js';

const websiteResearch = {
    type: 'WEBSITE',

    table: 'website_research',

    joinField: 'research_id',

    fields: WEBSITE_RESEARCH_FIELDS,

    defaultValues: {
        website_status: null,
        website_url: null,
        digital_presence: null,
        problem_opportunity: null,
        potential_improvements: null
    },

    getCompletionErrors: getWebsiteCompletionErrors,

    async getTypeSpecificResearch(db, researchId) {
        const result = await db.query(
            `
                SELECT *
                FROM website_research
                WHERE research_id = $1
            `,
            [researchId]
        );

        return result.rows[0] || {};
    },

    async saveTypeSpecificResearch(
        db,
        researchId,
        data = {}
    ) {
        const values = {};
        const allowedFields = WEBSITE_RESEARCH_FIELDS;

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(data, field)) {
                values[field] = data[field];
            }
        }

        const fields = Object.keys(values);

        if (fields.length === 0) {
            return null;
        }

        const existing = await db.query(
            `
                SELECT id
                FROM website_research
                WHERE research_id = $1
            `,
            [researchId]
        );

        if (existing.rows.length > 0) {
            const setClauses = [];
            const params = [researchId];

            fields.forEach((field) => {
                params.push(values[field]);
                setClauses.push(
                    `${field} = $${params.length}`
                );
            });

            await db.query(
                `
                    UPDATE website_research
                    SET
                        ${setClauses.join(', ')},
                        updated_at = NOW()
                    WHERE research_id = $1
                `,
                params
            );

            return;
        }

        const columnNames = ['research_id', ...fields];
        const params = [researchId];

        const placeholders = fields.map((field) => {
            params.push(values[field]);
            return `$${params.length}`;
        });

        await db.query(
            `
                INSERT INTO website_research (
                    ${columnNames.join(', ')}
                )
                VALUES (
                    $1,
                    ${placeholders.join(', ')}
                )
            `,
            params
        );
    }
};

export default websiteResearch;
