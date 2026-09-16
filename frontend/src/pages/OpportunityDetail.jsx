import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import NextActionCard from '../components/opportunity/NextActionCard';
import OpportunityHeader from '../components/opportunity/OpportunityHeader';
import WhyThisProspectCard from '../components/opportunity/WhyThisProspectCard';
import DecisionMakerSummaryCard from '../components/opportunity/DecisionMakerSummaryCard';
import OperationsSummaryCard from '../components/opportunity/OperationsSummaryCard';
import ScoringPanel from '../components/opportunity/ScoringPanel';
import ActivitiesList from '../components/opportunity/ActivitiesList';
import NotesList from '../components/opportunity/NotesList';
import DecisionMakerPanel from '../components/opportunity/DecisionMakerPanel';
import ResearchPanel from '../components/opportunity/ResearchPanel';
import AddTaskForm from '../components/opportunity/AddTaskForm';
import AddNoteForm from '../components/opportunity/AddNoteForm';

export default function OpportunityDetail() {
    const { id } = useParams();

    // ------ Profile state (one single source of truth) ------
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState(null);

    // ------ Research form state (kept exactly as before) ------
    const [researchForm, setResearchForm] = useState({
        website_reviewed: false,
        website_quality: '',
        social_reviewed: false,
        teams_count: '',
        players_estimate: '',
        admin_complexity: '',
        decision_maker_identified: null,
        decision_maker_name: '',
        current_system: '',
        communication_method: '',
        registration_method: '',
        reporting_method: '',
        sales_hypothesis: '',
        notes: '',
        website_status: '',
        website_url: '',
        digital_presence: '',
        problem_opportunity: '',
        potential_improvements: '',
        completed_at: null
    });
    const [researchErrors, setResearchErrors] = useState([]);
    const [researchLoading, setResearchLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [completing, setCompleting] = useState(false);

    // ------ Other local state (actions) ------
    const [newStage, setNewStage] = useState('');
    const [newTask, setNewTask] = useState({ title: '', due_at: '' });
    const [noteBody, setNoteBody] = useState('');
    const [dmStatus, setDmStatus] = useState('NOT_IDENTIFIED');
    const [dmPersonId, setDmPersonId] = useState('');
    const [dmSaving, setDmSaving] = useState(false);
    const [dmMessage, setDmMessage] = useState(null);

    // ------ Fetch profile data ------
    const fetchProfile = async () => {
        setProfileLoading(true);
        setProfileError(null);
        try {
            const res = await api.get(`/api/opportunities/${id}/profile`);
            setProfile(res.data);
            const dm = res.data.decisionMaker || {};
            setDmStatus(dm.status || 'NOT_IDENTIFIED');
            setDmPersonId(dm.selectedPerson?.id || dm.person_id || '');
            // Populate research form if research exists
            if (res.data.research) {
                const r = res.data.research;
                setResearchForm({
                    website_reviewed: r.website_reviewed || false,
                    website_quality: r.website_quality || '',
                    social_reviewed: r.social_reviewed || false,
                    teams_count: r.teams_count || '',
                    players_estimate: r.players_estimate || '',
                    admin_complexity: r.admin_complexity || '',
                    decision_maker_identified: r.decision_maker_identified !== undefined ? r.decision_maker_identified : null,
                    decision_maker_name: r.decision_maker_name || '',
                    current_system: r.current_system || '',
                    communication_method: r.communication_method || '',
                    registration_method: r.registration_method || '',
                    reporting_method: r.reporting_method || '',
                    sales_hypothesis: r.sales_hypothesis || '',
                    notes: r.notes || '',
                    website_status: r.website_status || '',
                    website_url: r.website_url || '',
                    digital_presence: r.digital_presence || '',
                    problem_opportunity: r.problem_opportunity || '',
                    potential_improvements: r.potential_improvements || '',
                    completed_at: r.completed_at || null
                });
            } else {
                // Reset form if no research
                setResearchForm({
                    website_reviewed: false,
                    website_quality: '',
                    social_reviewed: false,
                    teams_count: '',
                    players_estimate: '',
                    admin_complexity: '',
                    decision_maker_identified: null,
                    decision_maker_name: '',
                    current_system: '',
                    communication_method: '',
                    registration_method: '',
                    reporting_method: '',
                    sales_hypothesis: '',
                    notes: '',
                    website_status: '',
                    website_url: '',
                    digital_presence: '',
                    problem_opportunity: '',
                    potential_improvements: '',
                    completed_at: null
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setProfileError('Failed to load prospect profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line
    }, [id]);

    // ------ Handlers (all unchanged) ------

    const handleStageChange = async () => {
        if (!newStage) return;
        try {
            await api.post(`/api/opportunities/${id}/stage`, { stage: newStage });
            setNewStage('');
            fetchProfile(); // refresh profile after stage change
        } catch (err) {
            alert(err.response?.data?.error || 'Error changing stage');
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) return alert('Task title cannot be empty');
        try {
            await api.post(`/api/opportunities/${id}/tasks`, newTask);
            setNewTask({ title: '', due_at: '' });
            fetchProfile(); // refresh profile
        } catch (err) {
            alert(err.response?.data?.error || 'Error adding task');
        }
    };

    const handleAddNote = async () => {
        if (!noteBody.trim()) return alert('Note cannot be empty');
        try {
            await api.post(`/api/opportunities/${id}/notes`, { body: noteBody });
            setNoteBody('');
            fetchProfile(); // refresh profile
        } catch (err) {
            alert(err.response?.data?.error || 'Error adding note');
        }
    };

    const handleResearchChange = (field, value) => {
        setResearchForm(prev => ({ ...prev, [field]: value }));
        setResearchErrors(prev => prev.filter(e => !e.includes(field.replace('_', ' '))));
    };

    const handleSaveResearch = async () => {
        setSaving(true);
        try {
            await api.patch(`/api/prospecting/${id}/research`, researchForm);
            await fetchProfile();
            alert('Research saved successfully');
        } catch (err) {
            alert(err.response?.data?.error || 'Error saving research');
        } finally {
            setSaving(false);
        }
    };

    const handleCompleteResearch = async () => {
        setCompleting(true);
        setResearchErrors([]);
        try {
            await api.post(`/api/prospecting/${id}/research/complete`);
            await fetchProfile();
            alert('Research completed! Opportunity moved to RESEARCHED.');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setResearchErrors(data.errors);
            } else {
                alert(data?.error || 'Error completing research');
            }
        } finally {
            setCompleting(false);
        }
    };

    const handleSaveDecisionMaker = async () => {
        if (dmStatus === 'IDENTIFIED' && !dmPersonId) {
            setDmMessage('Select a person when status is Identified.');
            return;
        }
        if (dmStatus === 'NOT_IDENTIFIED' && dmPersonId) {
            setDmMessage('Clear the person when status is Not Identified.');
            return;
        }
        setDmSaving(true);
        setDmMessage(null);
        try {
            await api.put(`/api/opportunities/${id}/decision-maker`, {
                status: dmStatus,
                person_id: dmStatus === 'IDENTIFIED' ? dmPersonId : null,
                notes: null,
                person_updates: null
            });
            await fetchProfile();
            setDmMessage('Decision Maker saved.');
        } catch (err) {
            setDmMessage(err.response?.data?.error || 'Failed to save Decision Maker.');
        } finally {
            setDmSaving(false);
        }
    };

    // ------ Compute progress for research ------
    const computeProgress = () => {

        const f = researchForm;
        let total = 0, done = 0;
        if (researchForm.website_status !== undefined) {
            const websiteFields = [
                f.website_status,
                f.website_url,
                f.digital_presence,
                f.problem_opportunity,
                f.potential_improvements,
                f.sales_hypothesis
            ];
            total = websiteFields.length;
            done = websiteFields.filter((value) => value && value.trim().length >= 3).length;
        } else {
            total++;
            if (f.website_reviewed) done++;
            total++;
            if (f.social_reviewed) done++;
            total++;
            if (f.teams_count || f.admin_complexity || f.current_system || f.registration_method) done++;
            total++;
            if (f.sales_hypothesis && f.sales_hypothesis.trim().length >= 3) done++;
        }
        return Math.round((done / total) * 100);
    };

    // ------ Loading and error states ------
    if (profileLoading) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans">
                <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                    <p className="text-slate-400 font-medium">Loading prospect profile...</p>
                </div>
            </div>
        );
    }

    if (profileError || !profile) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center font-sans p-4">
                <div className="bg-slate-800/80 border border-red-500/50 p-6 rounded-3xl text-center max-w-md">
                    <p className="text-red-300">{profileError || 'Prospect not found'}</p>
                    <Link to="/organisations" className="mt-4 inline-block text-indigo-400 hover:underline text-sm">
                        ← Back to Organisations
                    </Link>
                </div>
            </div>
        );
    }

    const { opportunity, organisation, research, people, decisionMaker, scoring, recentActivities, nextTask, recentNotes } = profile;
    const isSportsResearch = opportunity.opportunity_type === 'SPORTS_MANAGEMENT';
    const isResearchCompleted = Boolean(research?.completed_at);
    const progress = computeProgress();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-6 selection:bg-indigo-500 selection:text-white">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* ========== HEADER ========== */}
                <OpportunityHeader
                    organisation={organisation}
                    opportunity={opportunity}
                    scoring={scoring}
                    id={id}
                    newStage={newStage}
                    onNewStageChange={setNewStage}
                    onStageApply={handleStageChange}
                />

                {/* ========== MAIN CONTENT ========== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ===== LEFT COLUMN ===== */}
                    <div className="space-y-6">

                        {/* --- Next Action --- */}
                        <NextActionCard nextTask={nextTask} opportunity={opportunity} />

                        {/* --- Why This Prospect --- */}
                        <WhyThisProspectCard opportunity={opportunity} />

                        {/* --- Decision Maker --- */}
                        <DecisionMakerSummaryCard decisionMaker={decisionMaker} id={id} />

                        {/* --- Operations (Research) --- */}
                        {isSportsResearch && (
                            <OperationsSummaryCard research={research} isResearchCompleted={isResearchCompleted} />
                        )}
</div>

                    {/* ===== RIGHT COLUMN ===== */}
                    <div className="space-y-6">

                        {/* Authoritative Decision Maker (opportunity-scoped) */}
                        <DecisionMakerPanel
                            id={id}
                            organisation={organisation}
                            people={people}
                            dmStatus={dmStatus}
                            setDmStatus={setDmStatus}
                            dmPersonId={dmPersonId}
                            setDmPersonId={setDmPersonId}
                            dmSaving={dmSaving}
                            dmMessage={dmMessage}
                            onSave={handleSaveDecisionMaker}
                        />

                        {/* --- Research Form (editable) --- */}
                        <ResearchPanel
                            research={research}
                            opportunityType={opportunity.opportunity_type}
                            researchForm={researchForm}
                            isResearchCompleted={isResearchCompleted}
                            progress={progress}
                            researchLoading={researchLoading}
                            researchErrors={researchErrors}
                            saving={saving}
                            completing={completing}
                            onResearchChange={handleResearchChange}
                            onSaveResearch={handleSaveResearch}
                            onCompleteResearch={handleCompleteResearch}
                        />

                        {/* --- Scoring & Qualification --- */}
                        <ScoringPanel scoring={scoring} />

                        {/* --- Activities --- */}
                        <ActivitiesList recentActivities={recentActivities} />

                        {/* --- Notes --- */}
                        <NotesList recentNotes={recentNotes} />

                        {/* --- Add Task & Add Note actions --- */}
                        <AddTaskForm newTask={newTask} setNewTask={setNewTask} onAddTask={handleAddTask} />
                        <AddNoteForm noteBody={noteBody} setNoteBody={setNoteBody} onAddNote={handleAddNote} />
</div>
                </div>
            </div>
        </div>
    );
}