import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export class AuthService {
    constructor(db) {
        this.db = db;
    }

    async register(email, name, password) {
        // Check if user exists
        const existing = await this.db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const res = await this.db.query(
            `INSERT INTO users (email, name, password_hash, role)
             VALUES ($1, $2, $3, 'owner') RETURNING id, email, name, role`,
            [email, name, passwordHash]
        );
        return res.rows[0];
    }

    async login(email, password) {
        const res = await this.db.query(
            'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
            [email]
        );
        if (res.rows.length === 0) {
            throw new Error('Invalid credentials');
        }
        const user = res.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }
        // Update last login safely
        try {
            await this.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
        } catch (err) {
            console.warn('Could not update last_login_at:', err.message);
        }
        return { id: user.id, email: user.email, name: user.name, role: user.role };
    }

    async getMe(userId) {
        const res = await this.db.query(
            'SELECT id, email, name, role FROM users WHERE id = $1',
            [userId]
        );
        return res.rows[0];
    }
}
