/**
 * Deterministic Action Intelligence ranking (RULE_ENGINE / action-intelligence-v1)
 * Pure functions — no DB access.
 */

const POSITIVE_OUTCOMES = new Set(['Interested', 'Replied', 'Connected']);
const NO_RESPONSE_OUTCOMES = new Set(['Sent', 'No response', 'No answer', 'Busy']);
const NEGATIVE_OUTCOMES = new Set(['Not interested']);

export function researchState(research) {
    if (!research || !research.id) return 'NOT_STARTED';
    if (research.completed_at) return 'COMPLETED';
    return 'IN_PROGRESS';
}

export function dmState(opp) {
    const status = (opp.decision_maker_status || 'NOT_IDENTIFIED').toUpperCase();
    if (status === 'IDENTIFIED' && opp.decision_maker_person_id) return 'IDENTIFIED';
    if (status === 'IDENTIFIED' && !opp.decision_maker_person_id) return 'CONFLICT';
    if (status === 'UNCERTAIN') return 'UNCERTAIN';
    return 'NOT_IDENTIFIED';
}

/** Channel policy: WA never uses phone_primary; CALL never uses whatsapp-only as primary policy */
export function resolveChannels({ dmPerson, organisation, dm }) {
    const channels = {
        person: { CALL: null, WHATSAPP: null, EMAIL: null, LINKEDIN: null },
        organisation: { CALL: null, EMAIL: null }
    };
    if (organisation) {
        if (organisation.phone) channels.organisation.CALL = organisation.phone;
        if (organisation.email) channels.organisation.EMAIL = organisation.email;
    }
    if (dm === 'IDENTIFIED' && dmPerson) {
        if (dmPerson.phone_primary) channels.person.CALL = dmPerson.phone_primary;
        if (dmPerson.phone_whatsapp) channels.person.WHATSAPP = dmPerson.phone_whatsapp;
        if (dmPerson.email) channels.person.EMAIL = dmPerson.email;
        if (dmPerson.linkedin) channels.person.LINKEDIN = dmPerson.linkedin;
    }
    return channels;
}

export function interpretLastActivity(activity) {
    if (!activity) return { codes: [], wrongNumberDest: null };
    const type = (activity.type || '').toUpperCase();
    const outcome = activity.outcome || '';
    const codes = [];
    let wrongNumberDest = null;

    if (NEGATIVE_OUTCOMES.has(outcome) || outcome === 'Not interested') {
        codes.push('NOT_INTERESTED');
    }
    if (outcome === 'Wrong number' && type === 'CALL') {
        codes.push('WRONG_NUMBER');
        const m = String(activity.subject || activity.content || '').match(/(\d{6,})/);
        wrongNumberDest = m ? m[1].slice(-6) : null;
        if (activity.metadata && activity.metadata.destination_digits) {
            wrongNumberDest = String(activity.metadata.destination_digits).slice(-6);
        }
    }
    if (POSITIVE_OUTCOMES.has(outcome)) {
        codes.push('POSITIVE_RESPONSE');
        if (outcome === 'Replied' || outcome === 'Connected') codes.push('RESPONSE_RECEIVED');
    }
    if (NO_RESPONSE_OUTCOMES.has(outcome)) {
        codes.push('NO_RESPONSE');
    }
    return { codes, wrongNumberDest, type, outcome, completed_at: activity.completed_at };
}

function personLabel(p) {
    if (!p) return null;
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Decision maker';
    return p.role || p.title ? `${name} — ${p.role || p.title}` : name;
}

function daysPast(dateVal) {
    if (!dateVal) return null;
    const t = new Date(dateVal).getTime();
    if (Number.isNaN(t)) return null;
    return (Date.now() - t) / (86400000);
}

/**
 * Build ranked recommendations + suppressed candidates.
 * Does NOT mutate CRM / next_action.
 */
export function rankRecommendations(ctx) {
    const {
        opportunity,
        organisation,
        research,
        dmPerson,
        people,
        lastActivity,
        pendingTask,
        channels
    } = ctx;

    const rs = researchState(research);
    const dm = dmState(opportunity);
    const hist = interpretLastActivity(lastActivity);
    const opportunityType = opportunity.opportunity_type;
    const isWebsite = opportunityType === 'WEBSITE';
    const orgId = organisation?.id || opportunity.organisation_id;
    const orgName = organisation?.name || 'Organisation';
    const recs = [];
    const suppressed = [];
    let rank = 1;

    const add = (item) => {
        recs.push({ ...item, rank: rank++ });
    };

    const callDest = dm === 'IDENTIFIED'
        ? channels.person.CALL
        : channels.organisation.CALL;
    const callTargetType = dm === 'IDENTIFIED' ? 'PERSON' : 'ORGANISATION';
    const callTargetId = dm === 'IDENTIFIED' ? dmPerson?.id : orgId;
    const callLabel = dm === 'IDENTIFIED' ? personLabel(dmPerson) : orgName;

    const digits = (v) => (v ? String(v).replace(/\D/g, '').slice(-6) : null);
    const wrongSuppressCall =
        hist.codes.includes('WRONG_NUMBER') &&
        callDest &&
        hist.wrongNumberDest &&
        digits(callDest) === hist.wrongNumberDest;

    // --- 1 Destination integrity ---
    if (wrongSuppressCall) {
        suppressed.push({
            action_type: 'CALL',
            target_type: callTargetType,
            target_id: callTargetId,
            target_label: callLabel,
            channel: 'PHONE',
            reason: 'Previous CALL to this destination was marked Wrong number',
            evidence_codes: ['WRONG_NUMBER']
        });
    }

    // --- 2 Disposition ---
    if (hist.codes.includes('NOT_INTERESTED')) {
        add({
            action_type: 'CLOSE_LOST',
            priority: 'NONE',
            priority_score: 90,
            target_type: 'OPPORTUNITY',
            target_id: opportunity.id,
            target_label: opportunity.name || 'Opportunity',
            channel: null,
            reason: 'Last outcome was Not interested — consider closing as lost',
            confidence: 0.95,
            evidence_codes: ['NOT_INTERESTED']
        });
        // Still allow limited groundwork below, but no aggressive outreach primary
    }

    const skipAggressive = hist.codes.includes('NOT_INTERESTED');

    // --- 3 Overdue user intent / task ---
    const nextDue = opportunity.next_action_due_at
        ? daysPast(opportunity.next_action_due_at)
        : null;
    const nextOverdue = opportunity.next_action && nextDue !== null && nextDue > 0;
    const taskOverdue =
        pendingTask &&
        pendingTask.due_at &&
        daysPast(pendingTask.due_at) > 0;

    if (!skipAggressive && nextOverdue && opportunity.next_action) {
        const actionGuess = String(opportunity.next_action).toUpperCase();
        let useCall = actionGuess.includes('CALL') && callDest && !wrongSuppressCall;
        let useWa =
            (actionGuess.includes('WHATSAPP') || actionGuess.includes('WA')) &&
            channels.person.WHATSAPP &&
            dm === 'IDENTIFIED';
        if (useCall) {
            add({
                action_type: 'CALL',
                priority: 'HIGH',
                priority_score: 85,
                target_type: callTargetType,
                target_id: callTargetId,
                target_label: callLabel,
                channel: 'PHONE',
                reason: `Stored next action overdue: ${opportunity.next_action}`,
                confidence: 0.9,
                evidence_codes: ['NEXT_ACTION_OVERDUE'],
                is_user_intent_aligned: true
            });
        } else if (useWa) {
            add({
                action_type: 'WHATSAPP',
                priority: 'HIGH',
                priority_score: 84,
                target_type: 'PERSON',
                target_id: dmPerson.id,
                target_label: personLabel(dmPerson),
                channel: 'WHATSAPP',
                reason: `Stored next action overdue: ${opportunity.next_action}`,
                confidence: 0.9,
                evidence_codes: ['NEXT_ACTION_OVERDUE'],
                is_user_intent_aligned: true
            });
        } else {
            add({
                action_type: 'FOLLOW_UP',
                priority: 'HIGH',
                priority_score: 83,
                target_type: dm === 'IDENTIFIED' ? 'PERSON' : 'ORGANISATION',
                target_id: dm === 'IDENTIFIED' ? dmPerson.id : orgId,
                target_label: dm === 'IDENTIFIED' ? personLabel(dmPerson) : orgName,
                channel: null,
                reason: `Stored next action overdue: ${opportunity.next_action}`,
                confidence: 0.85,
                evidence_codes: ['NEXT_ACTION_OVERDUE'],
                is_user_intent_aligned: true
            });
        }
    }

    if (!skipAggressive && taskOverdue) {
        add({
            action_type: 'COMPLETE_TASK',
            priority: 'HIGH',
            priority_score: 82,
            target_type: 'OPPORTUNITY',
            target_id: opportunity.id,
            target_label: pendingTask.title || 'Pending task',
            channel: null,
            reason: `Task overdue: ${pendingTask.title}`,
            confidence: 0.88,
            evidence_codes: ['TASK_OVERDUE']
        });
    }

    // --- 4 Positive engagement ---
    if (!skipAggressive && hist.codes.includes('POSITIVE_RESPONSE')) {
        add({
            action_type: 'SCHEDULE_MEETING',
            priority: 'HIGH',
            priority_score: 80,
            target_type: dm === 'IDENTIFIED' ? 'PERSON' : 'ORGANISATION',
            target_id: dm === 'IDENTIFIED' ? dmPerson.id : orgId,
            target_label: dm === 'IDENTIFIED' ? personLabel(dmPerson) : orgName,
            channel: null,
            reason: `Positive engagement (${hist.outcome}) — schedule a meeting`,
            confidence: 0.92,
            evidence_codes: ['POSITIVE_RESPONSE']
        });
    }

    // --- 5 Silence / no response ---
    if (
        !skipAggressive &&
        hist.codes.includes('NO_RESPONSE') &&
        !hist.codes.includes('POSITIVE_RESPONSE')
    ) {
        const age = daysPast(hist.completed_at);
        if (age === null || age >= 1) {
            if (dm === 'IDENTIFIED' && channels.person.WHATSAPP) {
                add({
                    action_type: 'WHATSAPP',
                    priority: 'MEDIUM',
                    priority_score: 70,
                    target_type: 'PERSON',
                    target_id: dmPerson.id,
                    target_label: personLabel(dmPerson),
                    channel: 'WHATSAPP',
                    reason: 'No response to previous outreach — follow up via WhatsApp',
                    confidence: 0.75,
                    evidence_codes: ['NO_RESPONSE', 'WHATSAPP_AVAILABLE']
                });
            } else if (callDest && !wrongSuppressCall) {
                add({
                    action_type: 'CALL',
                    priority: 'MEDIUM',
                    priority_score: 68,
                    target_type: callTargetType,
                    target_id: callTargetId,
                    target_label: callLabel,
                    channel: 'PHONE',
                    reason: 'No response to previous outreach — follow up by phone',
                    confidence: 0.7,
                    evidence_codes: ['NO_RESPONSE', 'PHONE_AVAILABLE']
                });
            }
        }
    }

    // --- 6 Groundwork ---
    if (rs === 'NOT_STARTED') {
        add({
            action_type: 'RESEARCH',
            priority: hist.codes.includes('POSITIVE_RESPONSE') ? 'MEDIUM' : 'HIGH',
            priority_score: hist.codes.includes('POSITIVE_RESPONSE') ? 55 : 75,
            target_type: 'OPPORTUNITY',
            target_id: opportunity.id,
            target_label: opportunity.name || 'Opportunity',
            channel: null,
            reason: 'Research has not been started',
            confidence: 1.0,
            evidence_codes: ['RESEARCH_NOT_STARTED']
        });
    } else if (rs === 'IN_PROGRESS') {
        add({
            action_type: 'RESEARCH',
            priority: hist.codes.includes('POSITIVE_RESPONSE') ? 'MEDIUM' : 'HIGH',
            priority_score: hist.codes.includes('POSITIVE_RESPONSE') ? 50 : 72,
            target_type: 'OPPORTUNITY',
            target_id: opportunity.id,
            target_label: opportunity.name || 'Opportunity',
            channel: null,
            reason: 'Research is in progress — continue',
            confidence: 0.95,
            evidence_codes: ['RESEARCH_IN_PROGRESS']
        });
    }

    if (dm === 'NOT_IDENTIFIED' || dm === 'UNCERTAIN' || dm === 'CONFLICT') {
        add({
            action_type: 'IDENTIFY_DECISION_MAKER',
            priority: rs === 'COMPLETED' ? 'HIGH' : 'MEDIUM',
            priority_score: isWebsite && rs === 'COMPLETED'
                ? 78
                : rs === 'COMPLETED'
                  ? 74
                  : 45,
            target_type: 'OPPORTUNITY',
            target_id: opportunity.id,
            target_label: opportunity.name || 'Opportunity',
            channel: null,
            reason:
                dm === 'CONFLICT'
                    ? 'Decision maker marked IDENTIFIED but person is missing'
                    : isWebsite && rs === 'COMPLETED'
                      ? 'Website research is complete; identify the decision maker before website outreach'
                      : 'Decision maker is not identified',
            confidence: dm === 'CONFLICT' ? 0.7 : 0.9,
            evidence_codes:
                dm === 'CONFLICT'
                    ? ['CONTACT_INFORMATION_CONFLICT']
                    : dm === 'UNCERTAIN'
                      ? ['DECISION_MAKER_UNCERTAIN']
                      : ['DECISION_MAKER_NOT_IDENTIFIED']
        });
    }

    if (wrongSuppressCall) {
        add({
            action_type: 'UPDATE_CONTACT',
            priority: 'MEDIUM',
            priority_score: 60,
            target_type: callTargetType,
            target_id: callTargetId,
            target_label: callLabel,
            channel: null,
            reason: 'Update contact — previous call destination was a wrong number',
            confidence: 0.9,
            evidence_codes: ['WRONG_NUMBER']
        });
    }

    // --- 7 Steady-state channels ---
    if (!skipAggressive && dm === 'IDENTIFIED' && dmPerson) {
        if (channels.person.WHATSAPP && !recs.some((r) => r.action_type === 'WHATSAPP')) {
            add({
                action_type: 'WHATSAPP',
                priority: 'MEDIUM',
                priority_score: 40 + (Number(opportunity.fit_score) || 0) / 100,
                target_type: 'PERSON',
                target_id: dmPerson.id,
                target_label: personLabel(dmPerson),
                channel: 'WHATSAPP',
                reason: isWebsite
                    ? 'Contact the decision maker about the website opportunity via WhatsApp'
                    : 'Decision maker has an explicit WhatsApp number',
                confidence: 0.95,
                evidence_codes: ['WHATSAPP_AVAILABLE', 'DECISION_MAKER_IDENTIFIED'],
                destination: channels.person.WHATSAPP
            });
        }
        if (
            channels.person.CALL &&
            !wrongSuppressCall &&
            !recs.some((r) => r.action_type === 'CALL' && r.target_type === 'PERSON')
        ) {
            add({
                action_type: 'CALL',
                priority: 'MEDIUM',
                priority_score: 38 + (Number(opportunity.fit_score) || 0) / 100,
                target_type: 'PERSON',
                target_id: dmPerson.id,
                target_label: personLabel(dmPerson),
                channel: 'PHONE',
                reason: isWebsite
                    ? 'Contact the decision maker about the website opportunity by phone'
                    : 'Decision maker has a primary phone number',
                confidence: 0.95,
                evidence_codes: ['PHONE_AVAILABLE', 'DECISION_MAKER_IDENTIFIED'],
                destination: channels.person.CALL
            });
        }
        if (channels.person.EMAIL && !recs.some((r) => r.action_type === 'EMAIL')) {
            add({
                action_type: 'EMAIL',
                priority: 'LOW',
                priority_score: 25,
                target_type: 'PERSON',
                target_id: dmPerson.id,
                target_label: personLabel(dmPerson),
                channel: 'EMAIL',
                reason: isWebsite
                    ? 'Contact the decision maker about the website opportunity by email'
                    : 'Decision maker has an email address',
                confidence: 0.9,
                evidence_codes: ['EMAIL_AVAILABLE'],
                destination: channels.person.EMAIL
            });
        }
        if (channels.person.LINKEDIN && !recs.some((r) => r.action_type === 'LINKEDIN')) {
            add({
                action_type: 'LINKEDIN',
                priority: 'LOW',
                priority_score: 20,
                target_type: 'PERSON',
                target_id: dmPerson.id,
                target_label: personLabel(dmPerson),
                channel: 'LINKEDIN',
                reason: 'Decision maker has a LinkedIn profile',
                confidence: 0.85,
                evidence_codes: ['LINKEDIN_AVAILABLE'],
                destination: channels.person.LINKEDIN
            });
        }
    }

    // Known contacts as explicit targets (NOT decision makers)
    if (!skipAggressive && dm !== 'IDENTIFIED') {
        const people = ctx.people || [];
        for (const person of people) {
            const label = personLabel(person);
            const contactLabel = label ? `${label} — Contact` : 'Contact';

            if (person.phone_whatsapp) {
                add({
                    action_type: 'WHATSAPP',
                    priority: 'MEDIUM',
                    priority_score: 42,
                    target_type: 'PERSON',
                    target_id: person.id,
                    target_label: contactLabel,
                    channel: 'WHATSAPP',
                    reason: 'Known contact has an explicit WhatsApp number (decision maker not identified)',
                    confidence: 0.85,
                    evidence_codes: ['WHATSAPP_AVAILABLE'],
                    destination: person.phone_whatsapp
                });
            }
            if (person.phone_primary) {
                add({
                    action_type: 'CALL',
                    priority: 'MEDIUM',
                    priority_score: 40,
                    target_type: 'PERSON',
                    target_id: person.id,
                    target_label: contactLabel,
                    channel: 'PHONE',
                    reason: 'Known contact has a primary phone (decision maker not identified)',
                    confidence: 0.85,
                    evidence_codes: ['PHONE_AVAILABLE'],
                    destination: person.phone_primary
                });
            }
            if (person.email) {
                add({
                    action_type: 'EMAIL',
                    priority: 'LOW',
                    priority_score: 24,
                    target_type: 'PERSON',
                    target_id: person.id,
                    target_label: contactLabel,
                    channel: 'EMAIL',
                    reason: 'Known contact has an email (decision maker not identified)',
                    confidence: 0.8,
                    evidence_codes: ['EMAIL_AVAILABLE'],
                    destination: person.email
                });
            }
            if (person.linkedin) {
                add({
                    action_type: 'LINKEDIN',
                    priority: 'LOW',
                    priority_score: 18,
                    target_type: 'PERSON',
                    target_id: person.id,
                    target_label: contactLabel,
                    channel: 'LINKEDIN',
                    reason: 'Known contact has LinkedIn (decision maker not identified)',
                    confidence: 0.75,
                    evidence_codes: ['LINKEDIN_AVAILABLE'],
                    destination: person.linkedin
                });
            }
        }

        // Organisation-level (explicit org, not a person)
        if (
            channels.organisation.CALL &&
            !wrongSuppressCall &&
            !recs.some((r) => r.action_type === 'CALL' && r.target_type === 'ORGANISATION')
        ) {
            add({
                action_type: 'CALL',
                priority: 'MEDIUM',
                priority_score: 35,
                target_type: 'ORGANISATION',
                target_id: orgId,
                target_label: orgName,
                channel: 'PHONE',
                reason: 'Organisation phone is available (decision maker not identified)',
                confidence: 0.85,
                evidence_codes: ['PHONE_AVAILABLE'],
                destination: channels.organisation.CALL
            });
        }
        if (
            channels.organisation.EMAIL &&
            !recs.some((r) => r.action_type === 'EMAIL' && r.target_type === 'ORGANISATION')
        ) {
            add({
                action_type: 'EMAIL',
                priority: 'LOW',
                priority_score: 22,
                target_type: 'ORGANISATION',
                target_id: orgId,
                target_label: orgName,
                channel: 'EMAIL',
                reason: 'Organisation email is available (decision maker not identified)',
                confidence: 0.85,
                evidence_codes: ['EMAIL_AVAILABLE'],
                destination: channels.organisation.EMAIL
            });
        }
    }

    // Sort by priority_score desc, re-rank
    recs.sort((a, b) => b.priority_score - a.priority_score);
    recs.forEach((r, i) => {
        r.rank = i + 1;
    });

    return { recommendations: recs, suppressed };
}

export function buildSignalPlan(ctx) {
    const { opportunity, organisation, research, dmPerson, lastActivity, pendingTask, channels } = ctx;
    const rs = researchState(research);
    const dm = dmState(opportunity);
    const hist = interpretLastActivity(lastActivity);
    const signals = [];

    const push = (code, subject_type, subject_id, extra = {}) => {
        signals.push({ code, subject_type, subject_id, value_type: 'BOOLEAN', value_boolean: true, ...extra });
    };

    if (rs === 'NOT_STARTED') push('RESEARCH_NOT_STARTED', 'OPPORTUNITY', opportunity.id);
    if (rs === 'IN_PROGRESS') push('RESEARCH_IN_PROGRESS', 'OPPORTUNITY', opportunity.id);
    if (rs === 'COMPLETED') push('RESEARCH_COMPLETED', 'OPPORTUNITY', opportunity.id);

    if (dm === 'IDENTIFIED') push('DECISION_MAKER_IDENTIFIED', 'PERSON', dmPerson.id);
    else if (dm === 'UNCERTAIN') push('DECISION_MAKER_UNCERTAIN', 'OPPORTUNITY', opportunity.id);
    else if (dm === 'CONFLICT') push('CONTACT_INFORMATION_CONFLICT', 'OPPORTUNITY', opportunity.id);
    else push('DECISION_MAKER_NOT_IDENTIFIED', 'OPPORTUNITY', opportunity.id);

    if (dm === 'IDENTIFIED' && dmPerson) {
        if (channels.person.CALL) push('PHONE_AVAILABLE', 'PERSON', dmPerson.id);
        if (channels.person.WHATSAPP) push('WHATSAPP_AVAILABLE', 'PERSON', dmPerson.id);
        if (channels.person.EMAIL) push('EMAIL_AVAILABLE', 'PERSON', dmPerson.id);
        if (channels.person.LINKEDIN) push('LINKEDIN_AVAILABLE', 'PERSON', dmPerson.id);
    } else if (organisation) {
        if (channels.organisation.CALL) push('PHONE_AVAILABLE', 'ORGANISATION', organisation.id);
        if (channels.organisation.EMAIL) push('EMAIL_AVAILABLE', 'ORGANISATION', organisation.id);
    }

    if (
        !channels.person.CALL &&
        !channels.person.WHATSAPP &&
        !channels.person.EMAIL &&
        !channels.organisation.CALL &&
        !channels.organisation.EMAIL
    ) {
        push('CONTACT_INFORMATION_MISSING', 'OPPORTUNITY', opportunity.id);
    }

    for (const code of hist.codes) {
        if (['POSITIVE_RESPONSE', 'RESPONSE_RECEIVED', 'NO_RESPONSE', 'WRONG_NUMBER', 'NOT_INTERESTED'].includes(code)) {
            signals.push({
                code,
                subject_type: 'ACTIVITY',
                subject_id: lastActivity?.id || null,
                value_type: 'TEXT',
                value_text: hist.outcome || code,
                source_type: 'ACTIVITY',
                source_id: lastActivity?.id || null
            });
        }
    }

    if (lastActivity?.completed_at && daysPast(lastActivity.completed_at) <= 7) {
        push('RECENT_ACTIVITY', 'OPPORTUNITY', opportunity.id);
    } else if (!lastActivity || (lastActivity.completed_at && daysPast(lastActivity.completed_at) > 14)) {
        push('STALE_OPPORTUNITY', 'OPPORTUNITY', opportunity.id);
    }

    if (opportunity.next_action_due_at) {
        const d = daysPast(opportunity.next_action_due_at);
        if (d !== null && d > 0) push('NEXT_ACTION_OVERDUE', 'OPPORTUNITY', opportunity.id);
        else if (d !== null && d > -1) push('NEXT_ACTION_DUE', 'OPPORTUNITY', opportunity.id);
    }
    if (pendingTask?.due_at) {
        const d = daysPast(pendingTask.due_at);
        if (d !== null && d > 0) push('TASK_OVERDUE', 'OPPORTUNITY', opportunity.id, { source_type: 'TASK', source_id: pendingTask.id });
        else if (d !== null && d > -1) push('TASK_DUE', 'OPPORTUNITY', opportunity.id, { source_type: 'TASK', source_id: pendingTask.id });
    }

    return signals;
}

export function buildAssessments(ctx, signalCodes) {
    const rs = researchState(ctx.research);
    const dm = dmState(ctx.opportunity);
    const hasChannel =
        signalCodes.has('PHONE_AVAILABLE') ||
        signalCodes.has('WHATSAPP_AVAILABLE') ||
        signalCodes.has('EMAIL_AVAILABLE');

    const list = [];
    list.push({
        assessment_type: 'RESEARCH_READINESS',
        subject_type: 'OPPORTUNITY',
        subject_id: ctx.opportunity.id,
        value_type: 'TEXT',
        value_text: rs === 'COMPLETED' ? 'HIGH' : rs === 'IN_PROGRESS' ? 'MEDIUM' : 'LOW',
        confidence: 1.0
    });
    list.push({
        assessment_type: 'DECISION_MAKER_READINESS',
        subject_type: 'OPPORTUNITY',
        subject_id: ctx.opportunity.id,
        value_type: 'TEXT',
        value_text: dm === 'IDENTIFIED' ? 'HIGH' : dm === 'CONFLICT' ? 'LOW' : 'LOW',
        confidence: dm === 'IDENTIFIED' ? 0.95 : 0.9
    });
    list.push({
        assessment_type: 'CONTACTABILITY',
        subject_type: 'OPPORTUNITY',
        subject_id: ctx.opportunity.id,
        value_type: 'TEXT',
        value_text: hasChannel ? (signalCodes.has('WHATSAPP_AVAILABLE') || signalCodes.has('PHONE_AVAILABLE') ? 'HIGH' : 'MEDIUM') : 'LOW',
        confidence: 0.9
    });
    list.push({
        assessment_type: 'ENGAGEMENT_LEVEL',
        subject_type: 'OPPORTUNITY',
        subject_id: ctx.opportunity.id,
        value_type: 'TEXT',
        value_text: signalCodes.has('POSITIVE_RESPONSE')
            ? 'HIGH'
            : signalCodes.has('NO_RESPONSE')
              ? 'LOW'
              : signalCodes.has('NOT_INTERESTED')
                ? 'VERY_LOW'
                : 'MEDIUM',
        confidence: 0.85
    });
    list.push({
        assessment_type: 'DATA_QUALITY',
        subject_type: 'OPPORTUNITY',
        subject_id: ctx.opportunity.id,
        value_type: 'TEXT',
        value_text: signalCodes.has('CONTACT_INFORMATION_CONFLICT') || signalCodes.has('WRONG_NUMBER')
            ? 'MEDIUM'
            : signalCodes.has('CONTACT_INFORMATION_MISSING')
              ? 'LOW'
              : 'HIGH',
        confidence: 0.8
    });
    list.push({
        assessment_type: 'OUTREACH_READINESS',
        subject_type: 'OPPORTUNITY',
        subject_id: ctx.opportunity.id,
        value_type: 'TEXT',
        value_text:
            signalCodes.has('NOT_INTERESTED')
                ? 'LOW'
                : hasChannel && (dm === 'IDENTIFIED' || signalCodes.has('PHONE_AVAILABLE'))
                  ? 'HIGH'
                  : 'MEDIUM',
        confidence: 0.85
    });
    return list;
}