import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ExecutionHeader from '../components/execution/ExecutionHeader';
import LastInteractionCard from '../components/execution/LastInteractionCard';
import UserNextActionCard from '../components/execution/UserNextActionCard';
import IntelligencePanel from '../components/execution/IntelligencePanel';
import AvailableActions from '../components/execution/AvailableActions';
import OutcomeCapture from '../components/execution/OutcomeCapture';

const OUTCOMES_BY_ACTION = {
    CALL: ['Connected', 'No answer', 'Busy', 'Wrong number', 'Not interested', 'Interested'],
    WHATSAPP: ['Sent', 'Replied', 'Interested', 'No response'],
    LINKEDIN: ['Connection sent', 'Message sent', 'Replied', 'No response'],
    EMAIL: ['Sent', 'Replied', 'No response'],
    RESEARCH: ['Research completed', 'Need more information'],
    NOTE: ['Quick note'],
    DECISION_MAKER: ['Identified', 'Uncertain', 'Not identified'],
    FOLLOW_UP: ['Completed', 'Rescheduled', 'No response', 'Interested', 'Not interested'],
    TASK: ['Completed', 'Rescheduled', 'Cancelled'],
    OUTREACH: ['Sent', 'Replied', 'No response', 'Interested', 'Not interested']
};

const NEXT_ACTIONS = [
    'Follow up',
    'Call',
    'WhatsApp',
    'Email',
    'LinkedIn',
    'Research',
    'Schedule meeting',
    'Send proposal',
    'Other'
];

const NEXT_REASONS = [
    'Waiting for response',
    'Requested follow-up',
    'Need more information',
    'Proposal requested',
    'Decision pending'
];

function computeDueLocal(choice) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    let target;

    if (choice === 'today') {
        target = new Date(y, m, d, 17, 0, 0, 0);
    } else if (choice === 'tomorrow') {
        target = new Date(y, m, d + 1, 9, 0, 0, 0);
    } else if (choice === 'this_week') {
        const day = now.getDay();

        if (day >= 1 && day <= 4) {
            target = new Date(y, m, d + (5 - day), 9, 0, 0, 0);
        } else {
            const daysToMon = day === 5 ? 3 : day === 6 ? 2 : 1;
            target = new Date(y, m, d + daysToMon, 9, 0, 0, 0);
        }
    } else {
        return '';
    }

    const pad = (n) => String(n).padStart(2, '0');

    return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
}

// Conservative client-side mirror of backend suggestions
// for instant prefill before save.
function clientSuggest(actionType, outcome) {
    const key = `${actionType}|${outcome}`;

    const map = {
        'CALL|No answer': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'CALL|Busy': {
            next_action: 'Call',
            due_choice: 'tomorrow',
            reason: 'Requested follow-up'
        },
        'CALL|Wrong number': {
            next_action: 'Research',
            due_choice: '',
            reason: 'Need more information'
        },
        'CALL|Interested': {
            next_action: 'Schedule meeting',
            due_choice: '',
            reason: ''
        },
        'CALL|Not interested': {
            next_action: '',
            due_choice: '',
            reason: '',
            suggest_close_lost: true
        },
        'WHATSAPP|Sent': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'WHATSAPP|No response': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'WHATSAPP|Interested': {
            next_action: 'Schedule meeting',
            due_choice: '',
            reason: ''
        },
        'EMAIL|Sent': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'EMAIL|No response': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'LINKEDIN|Connection sent': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'LINKEDIN|Message sent': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'LINKEDIN|No response': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'FOLLOW_UP|No response': {
            next_action: 'Follow up',
            due_choice: 'this_week',
            reason: 'Waiting for response'
        },
        'FOLLOW_UP|Interested': {
            next_action: 'Schedule meeting',
            due_choice: '',
            reason: ''
        },
        'FOLLOW_UP|Not interested': {
            next_action: '',
            due_choice: '',
            reason: '',
            suggest_close_lost: true
        },
        'RESEARCH|Need more information': {
            next_action: 'Research',
            due_choice: '',
            reason: 'Need more information'
        }
    };

    return map[key] || null;
}

function confidenceLabel(c) {
    const n = Number(c);

    if (Number.isNaN(n)) {
        return null;
    }

    if (n >= 0.7) {
        return 'High';
    }

    if (n >= 0.4) {
        return 'Medium';
    }

    return 'Low';
}

/**
 * Map an Action Intelligence recommendation into the
 * existing execution action shape used by this page.
 */
function mapIntelToAction(rec, context) {
    if (!rec || !context) {
        return null;
    }

    const { organisation, contact, people: contextPeople } = context;
    const intelPeople = context.intelligencePeople || contextPeople || [];
    const type = rec.action_type;
    const meta =
        typeof rec.metadata === 'string'
            ? JSON.parse(rec.metadata || '{}')
            : (rec.metadata || {});
    const destination = rec.destination || meta.destination || null;

    const personFromId = () => {
        if (rec.target_type !== 'PERSON' || !rec.target_id) {
            return null;
        }

        const fromList = (intelPeople || []).find(
            (p) => p.id === rec.target_id
        );

        if (fromList) {
            return fromList;
        }

        // Only if recommendation is for the authoritative DM
        if (contact && contact.id === rec.target_id) {
            return contact;
        }

        return null;
    };

    const person = personFromId();

    const labelBase =
        rec.target_label ||
        (person
            ? `${[person.first_name, person.last_name]
                  .filter(Boolean)
                  .join(' ')} — Contact`
            : null);

    if (type === 'RESEARCH') {
        return {
            type: 'RESEARCH',
            label: 'Research',
            target: null
        };
    }

    if (type === 'IDENTIFY_DECISION_MAKER') {
        return {
            type: 'DECISION_MAKER',
            label: 'Identify Decision Maker',
            target: null
        };
    }

    if (type === 'CLOSE_LOST') {
        return {
            type: 'CLOSE_LOST',
            label: 'Close as Lost',
            target: null
        };
    }

    if (type === 'SCHEDULE_MEETING') {
        return {
            type: 'FOLLOW_UP',
            label: labelBase
                ? `Schedule meeting — ${labelBase}`
                : 'Schedule meeting',
            target: null
        };
    }

    if (type === 'UPDATE_CONTACT') {
        return {
            type: 'DECISION_MAKER',
            label: labelBase
                ? `Update contact — ${labelBase}`
                : 'Update contact',
            target: null
        };
    }

    if (type === 'COMPLETE_TASK') {
        return {
            type: 'TASK',
            label: rec.target_label || 'Complete task',
            target: null
        };
    }

    if (type === 'FOLLOW_UP') {
        return {
            type: 'FOLLOW_UP',
            label: labelBase
                ? `Follow up — ${labelBase}`
                : 'Follow up',
            target: null
        };
    }

    if (type === 'CALL') {
        const person = personFromId();
        let target = destination;

        if (!target && rec.target_type === 'PERSON' && person) {
            target = person.phone_primary || null;
        }

        if (!target && rec.target_type === 'ORGANISATION' && organisation) {
            target = organisation.phone || null;
        }

        const label =
            rec.target_label ||
            (person
                ? `${[person.first_name, person.last_name]
                      .filter(Boolean)
                      .join(' ')} — Contact`
                : 'Call');

        return {
            type: 'CALL',
            label: label.startsWith('Call') ? label : `Call ${label}`,
            target,
            target_type: rec.target_type,
            target_id: rec.target_id
        };
    }

    if (type === 'WHATSAPP') {
        const person = personFromId();
        let target = destination;

        if (!target && person) {
            target = person.phone_whatsapp || null;
        }

        const label =
            rec.target_label ||
            (person
                ? `${[person.first_name, person.last_name]
                      .filter(Boolean)
                      .join(' ')} — Contact`
                : 'WhatsApp');

        return {
            type: 'WHATSAPP',
            label: label.includes('WhatsApp')
                ? label
                : `WhatsApp ${label}`,
            target,
            target_type: rec.target_type,
            target_id: rec.target_id
        };
    }

    if (type === 'EMAIL') {
        const person = personFromId();
        let target = destination;

        if (!target && rec.target_type === 'PERSON' && person) {
            target = person.email || person.person_email || null;
        }

        if (!target && rec.target_type === 'ORGANISATION' && organisation) {
            target = organisation.email || null;
        }

        const label =
            rec.target_label ||
            (person
                ? `${[person.first_name, person.last_name]
                      .filter(Boolean)
                      .join(' ')} — Contact`
                : 'Email');

        return {
            type: 'EMAIL',
            label: label.includes('Email') ? label : `Email ${label}`,
            target,
            target_type: rec.target_type,
            target_id: rec.target_id
        };
    }

    if (type === 'LINKEDIN') {
        const person = personFromId();
        let target = destination;

        if (!target && person) {
            target = person.linkedin || null;
        }

        const label =
            rec.target_label ||
            (person
                ? `${[person.first_name, person.last_name]
                      .filter(Boolean)
                      .join(' ')} — Contact`
                : 'LinkedIn');

        return {
            type: 'LINKEDIN',
            label: label.includes('LinkedIn')
                ? label
                : `LinkedIn ${label}`,
            target,
            target_type: rec.target_type,
            target_id: rec.target_id
        };
    }

    return {
        type,
        label: rec.reason ? `${type}` : type,
        target: null
    };
}

export default function ProspectExecution() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [context, setContext] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [actionOutcome, setActionOutcome] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [memory, setMemory] = useState('');

    const [nextAction, setNextAction] = useState('');
    const [nextActionDue, setNextActionDue] = useState('');
    const [nextActionReason, setNextActionReason] = useState('');
    const [nextActionIntent, setNextActionIntent] = useState('untouched');
    const [dueChoice, setDueChoice] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [selectedActionType, setSelectedActionType] = useState(null);
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [showCloseLost, setShowCloseLost] = useState(false);

    const [intelligence, setIntelligence] = useState(null);
    const [intelError, setIntelError] = useState(null);

    const fetchContext = async () => {
        setLoading(true);
        setError(null);
        setIntelError(null);

        try {
            const res = await api.get(`/api/execution/${id}`);

            try {
                // Explicitly run intelligence once per page load.
                // It does not run on every React re-render.
                const intelRes = await api.post(
                    `/api/intelligence/${id}/run`,
                    {}
                );

                setIntelligence(intelRes.data);
                setContext({
                    ...res.data,
                    intelligencePeople:
                        intelRes.data.people || res.data.people || []
                });
            } catch (ie) {
                console.error(ie);
                setIntelError('Intelligence unavailable');
                setIntelligence(null);
                setContext(res.data);
            }
        } catch (err) {
            setError('Failed to load execution context.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContext();
    }, [id]);

    const handleActionSelect = (action) => {
        const actionType = action.type;
        const target = action.target;

        setSelectedActionType(actionType);
        setSelectedLabel(action.label || actionType);

        setActionOutcome('');
        setNextAction('');
        setNextActionDue('');
        setNextActionReason('');
        setNextActionIntent('untouched');
        setDueChoice('');
        setShowCloseLost(false);

        if (actionType === 'CLOSE_LOST') {
            setShowCloseLost(true);
            setActionOutcome('Not interested');
            return;
        }

        if (actionType === 'CALL' && target) {
            window.location.href = `tel:${target}`;
        } else if (actionType === 'CALL' && !target) {
            // Keep the action selected so an outcome can still be recorded.
        } else if (actionType === 'WHATSAPP' && target) {
            window.location.href = `https://wa.me/${String(target).replace(/[^0-9]/g, '')}`;
        } else if (actionType === 'WHATSAPP' && !target) {
            // Keep the action selected so an outcome can still be recorded.
        } else if (actionType === 'EMAIL' && target) {
            window.location.href = `mailto:${target}`;
        } else if (actionType === 'EMAIL' && !target) {
            // Keep the action selected so an outcome can still be recorded.
        } else if (actionType === 'LINKEDIN' && target) {
            window.open(
                target.startsWith('http') ? target : `https://${target}`,
                '_blank'
            );
        } else if (actionType === 'RESEARCH') {
            navigate(`/opportunities/${id}`);
        } else if (actionType === 'DECISION_MAKER') {
            navigate(`/opportunities/${id}/decision-maker`);
        }
    };

    const handleOutcomeSelect = (opt) => {
        setActionOutcome(opt);

        const suggestion = clientSuggest(selectedActionType, opt);

        if (suggestion) {
            setNextAction(suggestion.next_action || '');
            setNextActionReason(suggestion.reason || '');
            setNextActionIntent(suggestion.next_action ? 'replacement' : 'untouched');

            if (suggestion.due_choice) {
                setDueChoice(suggestion.due_choice);
                setNextActionDue(
                    computeDueLocal(suggestion.due_choice)
                );
            } else {
                setDueChoice('');
                setNextActionDue('');
            }

            setShowCloseLost(!!suggestion.suggest_close_lost);
        } else {
            // No automatic inference for Connected / Replied / etc.
            setNextAction('');
            setNextActionDue('');
            setNextActionReason('');
            setNextActionIntent('untouched');
            setDueChoice('');
            setShowCloseLost(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedActionType) {
            alert('Please select an action first.');
            return;
        }

        if (!actionOutcome) {
            alert('Please select an outcome.');
            return;
        }

        setSubmitting(true);

        try {
            await api.post(`/api/execution/${id}/record`, {
                actionType: selectedActionType,
                outcome: actionOutcome,
                note: actionNote || undefined,
                nextAction: nextAction || undefined,
                nextActionDue: nextActionDue || undefined,
                nextActionReason: nextActionReason || undefined,
                clearNextAction: nextActionIntent === 'clear',
                memory: memory || undefined,
                actionLabel: selectedLabel || undefined
            });

            navigate('/queue');
        } catch (err) {
            alert(
                err.response?.data?.error ||
                'Failed to record action.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseLost = async () => {
        setSubmitting(true);

        try {
            // Record the outcome first if not already saved.
            if (selectedActionType && actionOutcome) {
                await api.post(`/api/execution/${id}/record`, {
                    actionType: selectedActionType,
                    outcome: actionOutcome,
                    note: actionNote || undefined,
                    clearNextAction: true,
                    memory: memory || undefined,
                    actionLabel: selectedLabel || undefined
                });
            }

            await api.post(
                `/api/opportunities/${id}/stage`,
                { stage: 'lost' }
            );

            navigate('/queue');
        } catch (err) {
            alert(
                err.response?.data?.error ||
                'Failed to close as Lost.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                    <p className="text-slate-400 font-medium">
                        Loading execution...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !context) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
                <div className="bg-slate-800/80 border border-red-500/50 p-6 rounded-3xl text-center max-w-md">
                    <p className="text-red-300">
                        {error || 'Not found'}
                    </p>

                    <button
                        onClick={() => navigate('/queue')}
                        className="mt-4 text-indigo-400 hover:underline text-sm"
                    >
                        Back to Queue
                    </button>
                </div>
            </div>
        );
    }

    const {
        opportunity,
        organisation,
        contact,
        execution,
        scoring,
        decisionMaker,
        latest_note
    } = context;

    const recommended = execution.recommended_action;
    const actions = execution.available_actions || [];
    const last = execution.last_interaction;
    const outcomeOptions = selectedActionType
        ? (OUTCOMES_BY_ACTION[selectedActionType] || [])
        : [];

    const intelRecommendations = Array.isArray(
        intelligence?.recommendations
    )
        ? [...intelligence.recommendations].sort(
              (a, b) => Number(a.rank || 0) - Number(b.rank || 0)
          )
        : [];

    const primaryIntelRecommendation =
        intelRecommendations.length > 0
            ? intelRecommendations[0]
            : null;

    const additionalIntelRecommendations =
        intelRecommendations.length > 1
            ? intelRecommendations.slice(1)
            : [];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-6 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-2xl mx-auto space-y-5">

                <ExecutionHeader
                    organisation={organisation}
                    opportunity={opportunity}
                    scoring={scoring}
                    decisionMaker={decisionMaker}
                    researchState={execution.research_state}
                    contact={contact}
                    onBack={() => navigate('/queue')}
                />

                <LastInteractionCard
                    last={last}
                    latest_note={latest_note}
                />

                <UserNextActionCard
                    opportunity={opportunity}
                />

                {/* Intelligence unavailable */}
                {intelError && (
                    <div className="bg-slate-800/60 border border-amber-500/30 p-4 rounded-2xl text-sm text-amber-200">
                        {intelError}. Existing execution recommendations
                        remain available below.
                    </div>
                )}

                <IntelligencePanel
                    intelRecommendations={intelRecommendations}
                    primaryIntelRecommendation={
                        primaryIntelRecommendation
                    }
                    additionalIntelRecommendations={
                        additionalIntelRecommendations
                    }
                    confidenceLabel={confidenceLabel}
                    mapIntelToAction={mapIntelToAction}
                    context={context}
                    onActionSelect={handleActionSelect}
                />

                {/* Legacy recommendation fallback */}
                {intelRecommendations.length === 0 &&
                    recommended &&
                    recommended.type !== 'NONE' && (
                        <div className="bg-slate-800/80 border border-indigo-500/30 p-5 rounded-3xl shadow-xl">
                            <h3 className="text-sm font-semibold text-indigo-400 mb-1">
                                Recommended
                            </h3>

                            {recommended.reason && (
                                <p className="text-xs text-slate-400 mb-3">
                                    {recommended.reason}
                                </p>
                            )}

                            <button
                                onClick={() =>
                                    handleActionSelect(recommended)
                                }
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-2xl text-lg shadow-lg shadow-indigo-600/30 transition active:scale-[0.98]"
                            >
                                {recommended.label}
                            </button>
                        </div>
                    )}

                {intelRecommendations.length === 0 &&
                    recommended &&
                    recommended.type === 'NONE' &&
                    recommended.reason && (
                        <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl text-sm text-slate-300">
                            {recommended.reason}
                        </div>
                    )}

                <AvailableActions
                    actions={actions}
                    selectedActionType={selectedActionType}
                    selectedLabel={selectedLabel}
                    onActionSelect={handleActionSelect}
                />

                <OutcomeCapture
                    selectedActionType={selectedActionType}
                    selectedLabel={selectedLabel}
                    outcomeOptions={outcomeOptions}
                    actionOutcome={actionOutcome}
                    actionNote={actionNote}
                    memory={memory}
                    nextAction={nextAction}
                    nextActionDue={nextActionDue}
                    nextActionReason={nextActionReason}
                    dueChoice={dueChoice}
                    showCloseLost={showCloseLost}
                    submitting={submitting}
                    NEXT_ACTIONS={NEXT_ACTIONS}
                    NEXT_REASONS={NEXT_REASONS}
                    onOutcomeSelect={handleOutcomeSelect}
                    onActionNoteChange={setActionNote}
                    onMemoryChange={setMemory}
                    onNextActionChange={(value) => {
                        const clear = value === '__CLEAR_NEXT_ACTION__';
                        setNextAction(clear ? '' : value);
                        setNextActionIntent(clear ? 'clear' : value ? 'replacement' : 'untouched');
                    }}
                    onDueChoiceChange={setDueChoice}
                    onNextActionDueChange={setNextActionDue}
                    onNextActionReasonChange={setNextActionReason}
                    computeDueLocal={computeDueLocal}
                    onCloseLost={handleCloseLost}
                    onKeepOpen={() => setShowCloseLost(false)}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}