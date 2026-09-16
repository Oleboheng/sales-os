export class OrganisationService {
    constructor(db) {
        this.db = db;
    }

    async list(userId) {
        const res = await this.db.query(
            `SELECT * FROM organisations WHERE deleted_at IS NULL
             ORDER BY created_at DESC`
        );
        return res.rows;
    }

    async create(userId, data) {
        const { name, province, website, instagram, phone, notes } = data;
        const res = await this.db.query(
            `INSERT INTO organisations (name, province, website, instagram, phone, notes)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, province, website, instagram, phone, notes]
        );
        return res.rows[0];
    }

    async getById(id, userId) {
        const res = await this.db.query(
            'SELECT * FROM organisations WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        return res.rows[0];
    }

    async update(id, userId, data) {
        // Only these fields can be updated
        const allowedFields = [
            'name', 'province', 'city', 'website', 'email', 'phone',
            'industry', 'sub_industry', 'description', 'notes',
            'instagram', 'facebook'
        ];
        const fields = [];
        const values = [];
        let i = 1;
        
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                fields.push(`${key} = $${i}`);
                values.push(data[key]);
                i++;
            }
        }
        
        if (fields.length === 0) return this.getById(id, userId);
        
        values.push(id);
        const query = `UPDATE organisations SET ${fields.join(', ')} WHERE id = $${i} AND deleted_at IS NULL RETURNING *`;
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    async delete(id, userId) {
        await this.db.query('UPDATE organisations SET deleted_at = NOW() WHERE id = $1', [id]);
    }
}
