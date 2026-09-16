export class ContactService {
    constructor(db) {
        this.db = db;
    }

    async listByOrganisation(orgId) {
        const res = await this.db.query(
            'SELECT * FROM people WHERE organisation_id = $1 ORDER BY created_at DESC',
            [orgId]
        );
        return res.rows;
    }

    async create(orgId, data) {
        // Map frontend-friendly names to database columns
        const {
            first_name,
            last_name,
            email,
            phone_primary,
            phone_whatsapp,
            role,
            title,
            is_decision_maker,
            linkedin,
            notes
        } = data;

        // Validate required fields
        if (!first_name || !last_name) {
            throw new Error('first_name and last_name are required');
        }

        const res = await this.db.query(
            `INSERT INTO people (
                organisation_id, first_name, last_name, email, phone_primary,
                phone_whatsapp, role, title, is_decision_maker, linkedin, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                orgId,
                first_name,
                last_name,
                email,
                phone_primary || data.phone, // fallback for backward compatibility
                phone_whatsapp,
                role,
                title,
                is_decision_maker || false,
                linkedin,
                notes
            ]
        );
        return res.rows[0];
    }

    async update(id, userId, data) {
        // Validate person exists and belongs to the user's accessible organisations
        const personRes = await this.db.query(
            `SELECT p.*, o.organisation_id 
             FROM people p 
             JOIN organisations o ON p.organisation_id = o.id 
             WHERE p.id = $1 AND o.deleted_at IS NULL`,
            [id]
        );
        if (personRes.rows.length === 0) {
            throw { status: 404, message: 'Person not found' };
        }

        // Allowed fields for update
        const allowed = [
            'first_name', 'last_name', 'role', 'title',
            'email', 'personal_email', 'phone_primary', 'phone_whatsapp',
            'linkedin', 'is_decision_maker', 'notes',
            'authority_level', 'confidence_level', 'preferred_channel', 'intelligence_evidence'
        ];

        const fields = [];
        const values = [];
        let i = 1;

        for (const key of allowed) {
            if (data[key] !== undefined && data[key] !== null) {
                fields.push(`${key} = $${i}`);
                values.push(data[key]);
                i++;
            }
        }

        if (fields.length === 0) {
            // Return existing person
            const res = await this.db.query('SELECT * FROM people WHERE id = $1', [id]);
            return res.rows[0];
        }

        values.push(id);
        const query = `UPDATE people SET ${fields.join(', ')}, updated_at = NOW() 
                       WHERE id = $${i} RETURNING *`;
        const res = await this.db.query(query, values);
        if (res.rows.length === 0) {
            throw { status: 404, message: 'Person not found' };
        }
        return res.rows[0];
    }

    async delete(id) {
        await this.db.query('DELETE FROM people WHERE id = $1', [id]);
    }
}