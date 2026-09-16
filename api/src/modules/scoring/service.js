import { ResearchService } from '../prospecting/researchService.js';

export class ScoringService {
    constructor(db, researchService = new ResearchService(db)) {
        this.db = db;
        this.researchService = researchService;
    }

    // Main entry: returns { totalScore, band, breakdown, qualification }
    async getFullScoring(opportunityId) {
        // Fetch all needed data
        const opp = await this.db.query(
            `SELECT o.*, org.industry, org.sub_industry, org.website,
                    p.authority_level, p.confidence_level, p.preferred_channel, p.intelligence_evidence,
                    p.is_decision_maker
               FROM opportunities o
               JOIN organisations org ON o.organisation_id = org.id
               LEFT JOIN people p ON o.decision_maker_person_id = p.id
               WHERE o.id = $1 AND o.deleted_at IS NULL`,
            [opportunityId]
        );
        if (opp.rows.length === 0) throw { status: 404, message: 'Opportunity not found' };
        const opportunity = opp.rows[0];
        const researchContext = await this.researchService.getResearchContext(opportunityId);
        const scoringInput = this.getScoringInput(researchContext);

        if (!scoringInput.supported) {
            return this.getUnsupportedScoring(researchContext.opportunityType);
        }

        const row = {
            ...opportunity,
            ...scoringInput.research
        };

        // Compute scoring
        const score = this.computeScore(row);
        const breakdown = this.getBreakdown(row);
        const band = this.getBand(score.total);
        const qualification = this.evaluateQualification(row);

        return {
            totalScore: score.total,
            band,
            breakdown,
            qualification
        };
    }

    getScoringInput(researchContext) {
        const adapters = {
            SPORTS_MANAGEMENT: ({ shared, typeSpecific }) => ({
                supported: true,
                research: { ...shared, ...typeSpecific }
            }),
            WEBSITE: ({ shared, typeSpecific }) => ({
                supported: true,
                research: { ...shared, ...typeSpecific }
            }),
            BOOKING_SYSTEM: () => ({ supported: false })
        };

        return adapters[researchContext.opportunityType]?.(researchContext) || { supported: false };
    }

    getUnsupportedScoring(opportunityType) {
        const reason = `Scoring is not supported for ${opportunityType || 'this'} opportunity type`;
        const breakdown = {
            organisationFit: { score: 0, max: 25, reason },
            operationalPain: { score: 0, max: 25, reason },
            digitalOpportunity: { score: 0, max: 20, reason },
            decisionMakerAccess: { score: 0, max: 20, reason },
            commercialPotential: { score: 0, max: 10, reason }
        };

        return {
            totalScore: 0,
            band: this.getBand(0),
            breakdown,
            qualification: {
                status: 'NOT_READY',
                gates: {
                    researchCompleted: false,
                    fitEstablished: false,
                    hasProblem: false,
                    hasHypothesis: false,
                    dmKnown: false
                },
                missing: [reason]
            }
        };
    }

    async updateFitScore(opportunityId) {
        const result = await this.getFullScoring(opportunityId);
        await this.db.query(
            'UPDATE opportunities SET fit_score = $1 WHERE id = $2',
            [result.totalScore, opportunityId]
        );
        return result.totalScore;
    }

    // Compute 0-100 score
    computeScore(row) {
        const website = row.opportunity_type === 'WEBSITE';

        const dims = {
            organisationFit: website
                ? this.computeWebsiteOrganisationFit(row)
                : this.computeOrganisationFit(row),
            operationalPain: website
                ? this.computeWebsiteOperationalPain(row)
                : this.computeOperationalPain(row),
            digitalOpportunity: website
                ? this.computeWebsiteDigitalOpportunity(row)
                : this.computeDigitalOpportunity(row),
            decisionMakerAccess: this.computeDecisionMakerAccess(row),
            commercialPotential: website
                ? this.computeWebsiteCommercialPotential(row)
                : this.computeCommercialPotential(row)
        };
        // Clamp each to max
        const max = {
            organisationFit: 25,
            operationalPain: 25,
            digitalOpportunity: 20,
            decisionMakerAccess: 20,
            commercialPotential: 10
        };
        let total = 0;
        for (const key of Object.keys(dims)) {
            dims[key] = Math.min(dims[key], max[key]);
            total += dims[key];
        }
        return { total, dims };
    }

    getBreakdown(row) {
        const dims = this.computeScore(row);
        const website = row.opportunity_type === 'WEBSITE';

        return {
            organisationFit: {
                score: dims.dims.organisationFit,
                max: 25,
                reason: website ? this.getWebsiteFitReason(row) : this.getFitReason(row)
            },
            operationalPain: {
                score: dims.dims.operationalPain,
                max: 25,
                reason: website ? this.getWebsitePainReason(row) : this.getPainReason(row)
            },
            digitalOpportunity: {
                score: dims.dims.digitalOpportunity,
                max: 20,
                reason: website ? this.getWebsiteDigitalReason(row) : this.getDigitalReason(row)
            },
            decisionMakerAccess: {
                score: dims.dims.decisionMakerAccess,
                max: 20,
                reason: this.getDmReason(row)
            },
            commercialPotential: {
                score: dims.dims.commercialPotential,
                max: 10,
                reason: website ? this.getWebsiteCommercialReason(row) : this.getCommercialReason(row)
            }
        };
    }

    getBand(total) {
        if (total >= 90) return 'VERY_HIGH';
        if (total >= 75) return 'HIGH';
        if (total >= 60) return 'GOOD';
        if (total >= 40) return 'MODERATE';
        return 'LOW';
    }

    // ---------- Dimension calculations ----------

    computeOrganisationFit(row) {
        const industry = (row.industry || '').toLowerCase();
        const sub = (row.sub_industry || '').toLowerCase();
        // Primary targets
        if (industry.includes('football') || industry.includes('academy') || sub.includes('football')) return 25;
        if (industry.includes('sports') || sub.includes('sports')) return 20;
        if (industry.includes('school') || sub.includes('school')) return 15;
        if (industry) return 10; // known but not target
        return 5; // unknown
    }

    computeOperationalPain(row) {
        let points = 0;
        // admin complexity
        const admin = (row.admin_complexity || '').toUpperCase();
        if (admin === 'HIGH') points += 10;
        else if (admin === 'MEDIUM') points += 7;
        else if (admin === 'LOW') points += 3;
        // scale (teams or players)
        const teams = parseInt(row.teams_count) || 0;
        const players = parseInt(row.players_estimate) || 0;
        if (teams >= 8 || players >= 150) points += 5;
        else if (teams >= 4 || players >= 50) points += 3;
        else if (teams > 0 || players > 0) points += 1;
        // manual/fragmented ops
        let manual = 0;
        const sys = (row.current_system || '').toLowerCase();
        const reg = (row.registration_method || '').toLowerCase();
        const comm = (row.communication_method || '').toLowerCase();
        const rep = (row.reporting_method || '').toLowerCase();
        if (sys.includes('excel') || sys.includes('spreadsheet') || sys.includes('manual')) manual++;
        if (reg.includes('paper') || reg.includes('manual') || reg.includes('whatsapp')) manual++;
        if (comm.includes('whatsapp') || comm.includes('sms') || comm.includes('manual')) manual++;
        if (rep.includes('manual') || rep.includes('excel')) manual++;
        if (manual >= 3) points += 10;
        else if (manual >= 2) points += 7;
        else if (manual >= 1) points += 4;
        // if evidence missing, no points
        return Math.min(points, 25);
    }

    computeDigitalOpportunity(row) {
        let points = 0;
        const websiteReviewed = row.website_reviewed;
        const quality = (row.website_quality || '').toLowerCase();
        if (websiteReviewed) {
            if (quality === 'none' || quality === 'poor') points += 17;
            else if (quality === 'average') points += 12;
            else if (quality === 'good') points += 6;
            else if (quality === 'excellent') points += 0;
            else points += 0; // unknown quality but reviewed
        }
        // social presence (max +3)
        const socialReviewed = row.social_reviewed;
        if (socialReviewed) {
            // if we had social data we could add, but we don't store detailed social presence
            // we'll assume if reviewed, there is some presence; if not reviewed, unknown.
            // We'll give a small bonus if social reviewed and no strong digital presence already noted.
            if (points < 12) points += 3; // not already good/excellent
        }
        return Math.min(points, 20);
    }

    computeWebsiteOrganisationFit(row) {
        const industry = (row.industry || '').trim();
        const subIndustry = (row.sub_industry || '').trim();
        const websiteUrl = (row.website_url || '').trim();

        if (subIndustry && industry) return 15;
        if (industry) return 12;
        if (websiteUrl) return 8;
        return 5;
    }

    computeWebsiteOperationalPain(row) {
        let points = 0;

        const problem = (row.problem_opportunity || '').trim();
        const improvements = (row.potential_improvements || '').trim();

        if (problem.length >= 3) points += 15;
        if (improvements.length >= 3) points += 10;

        return Math.min(points, 25);
    }

    computeWebsiteDigitalOpportunity(row) {
        const status = (row.website_status || '').toUpperCase();

        if (status === 'NONE') return 20;
        if (status === 'POOR') return 18;
        if (status === 'AVERAGE') return 12;
        if (status === 'EXISTS') return 10;
        if (status === 'GOOD') return 6;
        if (status === 'EXCELLENT') return 0;

        const presence = (row.digital_presence || '').trim();
        return presence.length >= 3 ? 5 : 0;
    }

    computeWebsiteCommercialPotential(row) {
        const problem = (row.problem_opportunity || '').trim();
        const improvements = (row.potential_improvements || '').trim();
        const hypothesis = (row.sales_hypothesis || '').trim();

        let points = 0;
        if (problem.length >= 3) points += 4;
        if (improvements.length >= 3) points += 3;
        if (hypothesis.length >= 3) points += 3;

        return Math.min(points, 10);
    }

    getWebsiteFitReason(row) {
        const industry = (row.industry || '').trim();
        const subIndustry = (row.sub_industry || '').trim();

        if (industry && subIndustry) return 'Organisation industry and sub-industry are known';
        if (industry) return 'Organisation industry is known';
        if ((row.website_url || '').trim()) return 'Website opportunity has a researched website';
        return 'Limited organisation fit information available';
    }

    getWebsitePainReason(row) {
        const problem = (row.problem_opportunity || '').trim();
        const improvements = (row.potential_improvements || '').trim();

        if (problem && improvements) return 'Research identifies a website problem and concrete improvement opportunity';
        if (problem) return 'Research identifies a website problem or opportunity';
        if (improvements) return 'Research identifies concrete website improvements';
        return 'Website problem/opportunity has not been established';
    }

    getWebsiteDigitalReason(row) {
        const status = (row.website_status || '').toUpperCase();

        if (status === 'NONE') return 'Organisation has no website — strong digital opportunity';
        if (status === 'POOR') return 'Website is poor — strong improvement opportunity';
        if (status === 'AVERAGE') return 'Website is average — meaningful improvement opportunity';
        if (status === 'EXISTS') return 'Website exists — opportunity depends on researched weaknesses';
        if (status === 'GOOD') return 'Website is good — limited digital gap';
        if (status === 'EXCELLENT') return 'Website is excellent — limited website opportunity';

        return 'Website status is not established';
    }

    getWebsiteCommercialReason(row) {
        const problem = (row.problem_opportunity || '').trim();
        const improvements = (row.potential_improvements || '').trim();
        const hypothesis = (row.sales_hypothesis || '').trim();

        if (problem && improvements && hypothesis) return 'Website research contains a problem, improvement opportunity and sales hypothesis';
        if (problem && improvements) return 'Website research contains a problem and improvement opportunity';
        if (problem || improvements) return 'Website research contains some commercial opportunity evidence';
        return 'Limited commercial evidence from Website research';
    }

    computeDecisionMakerAccess(row) {
        const status = (row.decision_maker_status || '').toUpperCase();
        const authority = (row.authority_level || '').toUpperCase();
        const confidence = (row.confidence_level || '').toUpperCase();
        if (status === 'IDENTIFIED') {
            const map = {
                'HIGH': { 'HIGH': 20, 'MEDIUM': 18, 'LOW': 15, 'UNKNOWN': 10 },
                'MEDIUM': { 'HIGH': 16, 'MEDIUM': 14, 'LOW': 12, 'UNKNOWN': 8 },
                'LOW': { 'HIGH': 9, 'MEDIUM': 8, 'LOW': 7, 'UNKNOWN': 6 },
                'UNKNOWN': { 'HIGH': 10, 'MEDIUM': 8, 'LOW': 6, 'UNKNOWN': 5 }
            };
            const a = map[authority] || map['UNKNOWN'];
            return a[confidence] || 5;
        } else if (status === 'UNCERTAIN') {
            return 4;
        } else { // NOT_IDENTIFIED or null
            return 0;
        }
    }

    computeCommercialPotential(row) {
        const teams = parseInt(row.teams_count) || 0;
        const players = parseInt(row.players_estimate) || 0;
        if (teams >= 10 || players >= 200) return 10;
        if (teams >= 6 || players >= 100) return 7;
        if (teams >= 3 || players >= 30) return 4;
        if (teams > 0 || players > 0) return 2;
        return 0;
    }

    // ---------- Reason strings ----------
    getFitReason(row) {
        const industry = (row.industry || '').toLowerCase();
        if (industry.includes('football') || industry.includes('academy')) return 'Strong target-market fit';
        if (industry.includes('sports')) return 'Relevant sports organisation';
        if (industry) return 'Known industry, not primary target';
        return 'Industry unknown';
    }

    getPainReason(row) {
        const admin = (row.admin_complexity || '').toUpperCase();
        const sys = (row.current_system || '').toLowerCase();
        if (admin === 'HIGH') return 'High operational complexity with manual processes';
        if (admin === 'MEDIUM') return 'Moderate complexity, some manual dependencies';
        if (admin === 'LOW') return 'Low complexity, processes seem structured';
        return 'Insufficient evidence of operational pain';
    }

    getDigitalReason(row) {
        const reviewed = row.website_reviewed;
        const quality = (row.website_quality || '').toLowerCase();
        if (!reviewed) return 'Website not yet researched';
        if (quality === 'none' || quality === 'poor') return 'Significant digital gap – no/very poor website';
        if (quality === 'average') return 'Average website, some digital opportunity';
        if (quality === 'good') return 'Good website, limited digital gap';
        if (quality === 'excellent') return 'Excellent digital presence, little opportunity';
        return 'Digital presence unknown';
    }

    getDmReason(row) {
        const status = (row.decision_maker_status || '').toUpperCase();
        if (status === 'IDENTIFIED') {
            const auth = (row.authority_level || '').toUpperCase();
            const conf = (row.confidence_level || '').toUpperCase();
            return `Decision-maker identified with ${auth.toLowerCase()} authority, ${conf.toLowerCase()} confidence`;
        }
        if (status === 'UNCERTAIN') return 'Decision-maker situation uncertain';
        return 'Decision-maker not identified yet';
    }

    getCommercialReason(row) {
        const teams = parseInt(row.teams_count) || 0;
        const players = parseInt(row.players_estimate) || 0;
        if (teams >= 8 || players >= 150) return 'Large organisational scale';
        if (teams >= 4 || players >= 50) return 'Medium organisational scale';
        if (teams > 0 || players > 0) return 'Small but commercially viable scale';
        return 'Scale unknown';
    }

    // ---------- Qualification ----------
    evaluateQualification(row) {
        // Gate 1: Research completed
        const researchCompleted = row.completed_at !== null;
        // Gate 2: Organisation fit established (score > 0)
        const website = row.opportunity_type === 'WEBSITE';
        const fit = website
            ? this.computeWebsiteOrganisationFit(row)
            : this.computeOrganisationFit(row);
        const fitEstablished = fit > 0;
        // Gate 3: Operational problem/opportunity identified
        const pain = website
            ? this.computeWebsiteOperationalPain(row)
            : this.computeOperationalPain(row);
        const hasProblem = website
            ? (row.problem_opportunity || '').trim().length >= 3
            : pain >= 10; // at least some evidence
        // Gate 4: Sales hypothesis exists
        const hasHypothesis = row.sales_hypothesis && row.sales_hypothesis.trim().length >= 3;
        // Gate 5: Decision-maker situation is known (not UNCERTAIN)
        const dmStatus = (row.decision_maker_status || '').toUpperCase();
        const dmKnown = dmStatus === 'IDENTIFIED' || dmStatus === 'NOT_IDENTIFIED';

        const gates = {
            researchCompleted,
            fitEstablished,
            hasProblem,
            hasHypothesis,
            dmKnown
        };
        const allPassed = Object.values(gates).every(v => v === true);
        const missing = [];
        if (!researchCompleted) missing.push('Research not completed');
        if (!fitEstablished) missing.push('Organisation fit not established');
        if (!hasProblem) missing.push('Operational problem not identified');
        if (!hasHypothesis) missing.push('Sales hypothesis missing');
        if (!dmKnown) missing.push('Decision-maker situation uncertain (must be IDENTIFIED or NOT_IDENTIFIED)');

        return {
            status: allPassed ? 'QUALIFIED' : 'NOT_READY',
            gates,
            missing
        };
    }
}