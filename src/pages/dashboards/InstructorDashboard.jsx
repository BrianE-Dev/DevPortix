import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Code2, ListTodo, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import ReactPlayground from '../../components/ReactPlayground';
import LocalStorageService from '../../services/localStorageService';
import { mentorshipApi } from '../../services/mentorshipApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
const resolveMedia = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_BASE_URL}${url}`);

const defaultDraft = {
  title: '',
  question: '',
  details: '',
  score: '',
  dueDate: '',
  attachment: null,
};

const InstructorDashboard = () => {
  const { user, updateProfile, loading, isAuthenticated, getDashboardPath } = useAuth();
  const displayName = user?.fullName || user?.username || 'Instructor';
  const [activeMenuKey, setActiveMenuKey] = useState('overview');
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignmentDraft, setAssignmentDraft] = useState(defaultDraft);
  const [editingAssignmentId, setEditingAssignmentId] = useState('');
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);
  const activeAccent = getDashboardAccent('violet');

  const menuItems = [
    { key: 'overview', label: 'Overview', icon: BarChart3, badge: 'Now' },
    { key: 'students', label: 'Students', icon: Users, badge: 'Now' },
    { key: 'assignments', label: 'Assignments', icon: ListTodo, badge: 'Now' },
    { key: 'reviews', label: 'Activity', icon: ClipboardCheck, badge: 'Now' },
    { key: 'code-lab', label: 'Code Lab', icon: Code2, badge: 'Now' },
  ];

  const allAssignments = useMemo(
    () => students.flatMap((student) => student.assignments || []),
    [students]
  );

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [selectedStudentId, students]
  );

  const filteredAssignments = useMemo(() => {
    if (!selectedStudentId) return allAssignments;
    return allAssignments.filter((assignment) => assignment.studentId === selectedStudentId);
  }, [allAssignments, selectedStudentId]);

  const scoredAssignments = useMemo(
    () => allAssignments.filter((assignment) => Number.isFinite(assignment.score)),
    [allAssignments]
  );
  const averageScore = useMemo(() => {
    if (scoredAssignments.length === 0) return 'N/A';
    const total = scoredAssignments.reduce((sum, assignment) => sum + Number(assignment.score || 0), 0);
    return `${(total / scoredAssignments.length).toFixed(1)} / 100`;
  }, [scoredAssignments]);

  const kpiCards = useMemo(
    () => [
      {
        title: 'Active Students',
        value: String(students.length),
        detail: students.length === 0 ? 'No students selected you yet' : 'Students assigned to you',
        detailColor: 'text-emerald-300',
      },
      {
        title: 'Assignments',
        value: String(allAssignments.length),
        detail: 'Created from Assignments menu',
        detailColor: 'text-amber-300',
      },
      {
        title: 'Average Score',
        value: averageScore,
        detail: 'Across scored assignments',
        detailColor: 'text-blue-300',
      },
    ],
    [allAssignments.length, averageScore, students.length]
  );

  const loadStudents = async () => {
    const token = LocalStorageService.getToken();
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const response = await mentorshipApi.listMyStudents(token);
      const nextStudents = Array.isArray(response.students) ? response.students : [];
      setStudents(nextStudents);
      if (nextStudents.length > 0 && !selectedStudentId) {
        setSelectedStudentId(nextStudents[0].id);
      }
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load students right now.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const savedMenuKey = user?.dashboardMenu?.instructor;
    const validMenuKeys = menuItems.map((item) => item.key);
    if (savedMenuKey && validMenuKeys.includes(savedMenuKey)) {
      setActiveMenuKey((currentKey) => (currentKey === savedMenuKey ? currentKey : savedMenuKey));
    }
  }, [user?.dashboardMenu?.instructor]);

  useEffect(() => {
    if (!user?.id) return;
    loadStudents();
  }, [user?.id]);

  const handleMenuSelect = async (key) => {
    setActiveMenuKey(key);
    try {
      await updateProfile({
        dashboardMenu: {
          ...(user?.dashboardMenu || {}),
          instructor: key,
        },
      });
    } catch {
      // keep ui selection
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentDraft(defaultDraft);
    setEditingAssignmentId('');
    setRemoveExistingAttachment(false);
  };

  const createOrUpdateAssignment = async () => {
    const token = LocalStorageService.getToken();
    if (!token) return;
    if (!selectedStudentId) {
      setError('Select a student first.');
      return;
    }
    if (!String(assignmentDraft.title || '').trim()) {
      setError('Assignment title is required.');
      return;
    }
    if (!String(assignmentDraft.question || '').trim()) {
      setError('Assignment question is required.');
      return;
    }

    const payload = {
      title: String(assignmentDraft.title || '').trim(),
      question: String(assignmentDraft.question || '').trim(),
      details: String(assignmentDraft.details || '').trim(),
      score: assignmentDraft.score === '' ? '' : assignmentDraft.score,
      dueDate: assignmentDraft.dueDate || '',
    };

    if (assignmentDraft.attachment instanceof File) {
      payload.attachment = assignmentDraft.attachment;
    }

    try {
      setBusy(true);
      setError('');
      if (editingAssignmentId) {
        if (removeExistingAttachment) payload.removeAttachment = 'true';
        await mentorshipApi.updateAssignment(token, editingAssignmentId, payload);
      } else {
        await mentorshipApi.createAssignment(token, selectedStudentId, payload);
      }
      resetAssignmentForm();
      await loadStudents();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save assignment right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedStudentId(assignment.studentId);
    setEditingAssignmentId(assignment.id);
    setRemoveExistingAttachment(false);
    setAssignmentDraft({
      title: assignment.title || '',
      question: assignment.question || '',
      details: assignment.details || '',
      score: Number.isFinite(assignment.score) ? String(assignment.score) : '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 10) : '',
      attachment: null,
    });
    setActiveMenuKey('assignments');
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const token = LocalStorageService.getToken();
    if (!token) return;
    try {
      setBusy(true);
      setError('');
      await mentorshipApi.deleteAssignment(token, assignmentId);
      await loadStudents();
      if (editingAssignmentId === assignmentId) {
        resetAssignmentForm();
      }
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to delete assignment right now.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== ROLES.INSTRUCTOR) return <Navigate to={getDashboardPath()} replace />;

  return (
    <DashboardShell
      role="Instructor"
      title="Instructor Dashboard"
      subtitle={`Welcome, ${displayName}. Manage students and assignment lifecycle from one place.`}
      accentClass={activeAccent.textClass}
      activeTabClass={activeAccent.primaryButtonClass}
      menuItems={menuItems}
      activeMenuKey={activeMenuKey}
      onMenuSelect={handleMenuSelect}
    >
      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

      {activeMenuKey === 'overview' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {kpiCards.map((card) => (
            <div key={card.title} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-lg text-white">{card.title}</h3>
              <p className="text-3xl font-bold text-white mt-3">{card.value}</p>
              <p className={`text-sm mt-2 ${card.detailColor}`}>{card.detail}</p>
            </div>
          ))}
        </div>
      )}

      {activeMenuKey === 'students' && (
        <div className="space-y-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-white">Assigned Students</h3>
              <button
                type="button"
                onClick={loadStudents}
                disabled={busy}
                className="text-sm text-emerald-300 hover:text-emerald-200 transition"
              >
                Refresh
              </button>
            </div>
            <p className="text-sm text-gray-400">Students are auto-added when they choose you from their dashboard.</p>
          </div>

          {students.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <p className="text-gray-300">No students assigned yet.</p>
            </div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white">{student.fullName}</p>
                <p className="text-sm text-gray-400">{student.email}</p>
                <p className="text-xs text-gray-400 mt-2">{(student.assignments || []).length} assignment(s)</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeMenuKey === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-white mb-4">
              {editingAssignmentId ? 'Edit Assignment' : 'Create Assignment'}
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={assignmentDraft.title}
                onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Assignment title"
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={assignmentDraft.score}
                onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, score: event.target.value }))}
                placeholder="Score (optional)"
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
              />
              <input
                type="date"
                value={assignmentDraft.dueDate}
                onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
              />
            </div>

            <textarea
              rows={3}
              value={assignmentDraft.question}
              onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, question: event.target.value }))}
              placeholder="Assignment question"
              className="mt-3 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
            />
            <textarea
              rows={3}
              value={assignmentDraft.details}
              onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, details: event.target.value }))}
              placeholder="Extra instructions (optional)"
              className="mt-3 w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white"
            />

            <div className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <input
                type="file"
                onChange={(event) =>
                  setAssignmentDraft((prev) => ({ ...prev, attachment: event.target.files?.[0] || null }))
                }
                className="text-sm text-gray-300"
              />
              {editingAssignmentId && (
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={removeExistingAttachment}
                    onChange={(event) => setRemoveExistingAttachment(event.target.checked)}
                  />
                  Remove old file
                </label>
              )}
              <div className="flex gap-2 justify-end">
                {editingAssignmentId && (
                  <button
                    type="button"
                    onClick={resetAssignmentForm}
                    className="px-4 py-2 rounded-lg border border-white/20 text-white"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={createOrUpdateAssignment}
                  disabled={busy}
                  className={`px-4 py-2 rounded-lg text-white ${activeAccent.primaryButtonClass}`}
                >
                  {editingAssignmentId ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-white">Assignments</h3>
              <span className="text-sm text-gray-400">{filteredAssignments.length} item(s)</span>
            </div>

            {filteredAssignments.length === 0 ? (
              <p className="text-gray-300">No assignments found for the selected student filter.</p>
            ) : (
              <div className="space-y-3">
                {filteredAssignments.map((assignment) => {
                  const student = students.find((item) => item.id === assignment.studentId);
                  return (
                    <div key={assignment.id} className="border border-white/10 rounded-lg p-4 bg-black/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{assignment.title}</p>
                          <p className="text-xs text-gray-400 mt-1">Student: {student?.fullName || 'Unknown'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditAssignment(assignment)}
                            className="px-2 py-1 text-xs border border-white/20 rounded text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="px-2 py-1 text-xs border border-red-400/50 rounded text-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mt-2">{assignment.question}</p>
                      {assignment.details && <p className="text-sm text-gray-400 mt-1">{assignment.details}</p>}
                      {assignment.attachment?.url && (
                        <a
                          href={resolveMedia(assignment.attachment.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-emerald-300 hover:text-emerald-200 mt-2 inline-block"
                        >
                          Open attachment ({assignment.attachment.originalName || 'file'})
                        </a>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Score: {Number.isFinite(assignment.score) ? assignment.score : 'Not scored'} | Due:{' '}
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeMenuKey === 'reviews' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="font-semibold text-lg text-white mb-4">Recent Assignment Activity</h3>
          {allAssignments.length === 0 ? (
            <p className="text-gray-300">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {allAssignments.slice(0, 12).map((assignment) => {
                const student = students.find((item) => item.id === assignment.studentId);
                return (
                  <div key={assignment.id} className="border-l-4 border-emerald-400 bg-white/5 rounded-r-lg p-4">
                    <p className="font-medium text-white">{assignment.title}</p>
                    <p className="text-sm text-gray-300 mt-1">{assignment.question}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Student: {student?.fullName || 'Unknown'} | Updated:{' '}
                      {new Date(assignment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeMenuKey === 'code-lab' && (
        <ReactPlayground storageKey="instructor-dashboard-react-playground" title="Instructor React Playground" />
      )}
    </DashboardShell>
  );
};

export default InstructorDashboard;
