import {
    normalizeName,
    normalizeEmail,
    normalizePhone,
    normalizeInstagram,
    normalizeWebsite,
    normalizeFacebook
} from './normalization.js';
import { validateQuickCapture } from './validation.js';

export class ProspectingService {
    constructor(db) {
        this.db = db;
    }

    async quickCapture(userId, input) {
        // 1. Validate input
        const errors = validateQuickCapture(input);
        if (errors.length > 0) {
            throw { status: 400, errors };
        }

        const name = input.name.trim();

        // 2. Normalize fields for duplicate detection
        const normalized = {
            name: normalizeName(name),
            website: input.website ? normalizeWebsite(input.website) : null,
            instagram: input.instagram ? normalizeInstagram(input.instagram) : null,
            facebook: input.facebook ? normalizeFacebook(input.facebook) : null,
            email: input.email ? normalizeEmail(input.email) : null,
            phone: input.phone ? normalizePhone(input.phone) : null,
        };

        // 3. Duplicate detection - start transaction
        await this.db.query('BEGIN');

        try {
            let organisation = null;
            let matchType = null;
            let isDuplicate = false;

            // Check for exact matches by strong identifiers
            if (normalized.website) {
                const res = await this.db.query(
                    'SELECT * FROM organisations WHERE website ILIKE $1 AND deleted_at IS NULL',
                    [`%${normalized.website}%`]
                );
                if (res.rows.length > 0) {
                    organisation = res.rows[0];
                    matchType = 'website';
                    isDuplicate = true;
                }
            }

            if (!organisation && normalized.instagram) {
                const res = await this.db.query(
                    'SELECT * FROM organisations WHERE instagram ILIKE $1 AND deleted_at IS NULL',
                    [`%${normalized.instagram}%`]
                );
                if (res.rows.length > 0) {
                    organisation = res.rows[0];
                    matchType = 'instagram';
                    isDuplicate = true;
                }
            }

            if (!organisation && normalized.facebook) {
                const res = await this.db.query(
                    'SELECT * FROM organisations WHERE facebook ILIKE $1 AND deleted_at IS NULL',
                    [`%${normalized.facebook}%`]
                );
                if (res.rows.length > 0) {
                    organisation = res.rows[0];
                    matchType = 'facebook';
                    isDuplicate = true;
                }
            }

            if (!organisation && normalized.email) {
                const res = await this.db.query(
                    'SELECT * FROM organisations WHERE email ILIKE $1 AND deleted_at IS NULL',
                    [normalized.email]
                );
                if (res.rows.length > 0) {
                    organisation = res.rows[0];
                    matchType = 'email';
                    isDuplicate = true;
                }
            }

            if (!organisation && normalized.phone) {
                const res = await this.db.query(
                    'SELECT * FROM organisations WHERE phone ILIKE $1 AND deleted_at IS NULL',
                    [`%${normalized.phone}%`]
                );
                if (res.rows.length > 0) {
                    organisation = res.rows[0];
                    matchType = 'phone';
                    isDuplicate = true;
                }
            }

            // Name-based possible match (only if no strong match found)
            let possibleMatch = null;
            if (!organisation) {
                const res = await this.db.query(
                    'SELECT * FROM organisations WHERE LOWER(name) = LOWER($1) AND deleted_at IS NULL',
                    [name]
                );
                if (res.rows.length > 0) {
                    possibleMatch = res.rows[0];
                }
            }

            // 4. If duplicate found, return existing organisation without creating new opportunity
            if (organisation) {
                // Check if there's an active opportunity for this organisation
                const oppRes = await this.db.query(
                    `SELECT * FROM opportunities
                     WHERE organisation_id = $1
                       AND deleted_at IS NULL
                       AND stage NOT IN ('WON', 'LOST')
                     ORDER BY created_at DESC LIMIT 1`,
                    [organisation.id]
                );

                await this.db.query('COMMIT');

                return {
                    status: 'existing_organisation',
                    organisation,
                    opportunity: oppRes.rows[0] || null,
                    duplicate: {
                        matched: true,
                        match_type: matchType,
                        confidence: 'exact'
                    },
                    possible_duplicate: false
                };
            }

            // 5. If possible match found (name match only), return it but don't create
            if (possibleMatch) {
                await this.db.query('COMMIT');
                return {
                    status: 'possible_duplicate',
                    organisation: possibleMatch,
                    opportunity: null,
                    duplicate: {
                        matched: true,
                        match_type: 'name',
                        confidence: 'possible'
                    },
                    possible_duplicate: true
                };
            }

            // 6. Create new organisation
            const orgRes = await this.db.query(
                `INSERT INTO organisations (
                    name, website, instagram, facebook, phone, email,
                    city, province, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    name,
                    input.website || null,
                    input.instagram || null,
                    input.facebook || null,
                    input.phone || null,
                    input.email || null,
                    input.city || null,
                    input.province || null,
                    input.notes || null
                ]
            );
            organisation = orgRes.rows[0];

            // 7. Create opportunity
            const opportunityName = name;
            const oppRes = await this.db.query(
                `INSERT INTO opportunities (
                    organisation_id, name, stage, source, campaign, opportunity_type
                ) VALUES ($1, $2, 'TARGETING', $3, $4, $5)
                RETURNING *`,
                [
                    organisation.id,
                    opportunityName,
                    input.source || 'manual',
                    input.campaign || null,
                    input.opportunity_type ?? 'SPORTS_MANAGEMENT'
                ]
            );
            const opportunity = oppRes.rows[0];

            // 8. Create initial activity
            const sourceLabel = input.source || 'manual';
            const activityContent = `Prospect captured via ${sourceLabel}.`;

            const actRes = await this.db.query(
                `INSERT INTO activities (
                    opportunity_id, user_id, type, direction, subject, content, completed_at
                ) VALUES ($1, $2, 'prospect_capture', 'outbound', $3, $4, NOW())
                RETURNING *`,
                [
                    opportunity.id,
                    userId,
                    'Prospect captured',
                    activityContent
                ]
            );

            // 9. Audit log
            await this.db.query(
                `INSERT INTO audit_logs (
                    user_id, entity_type, entity_id, action, new_values
                ) VALUES ($1, 'opportunity', $2, 'created', $3)`,
                [
                    userId,
                    opportunity.id,
                    JSON.stringify({
                        name: opportunity.name,
                        stage: opportunity.stage,
                        source: opportunity.source,
                        campaign: opportunity.campaign
                    })
                ]
            );

            await this.db.query('COMMIT');

            return {
                status: 'created',
                organisation,
                opportunity,
                activity: actRes.rows[0],
                duplicate: {
                    matched: false
                },
                possible_duplicate: false
            };

        } catch (err) {
            await this.db.query('ROLLBACK');
            throw err;
        }
    }
}
