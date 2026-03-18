import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, ClipboardCheck, Code2, ListTodo, Settings, UserCircle, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import ReactPlayground from '../../components/ReactPlayground';
import LocalStorageService from '../../services/localStorageService';
import { mentorshipApi } from '../../services/mentorshipApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';
import { useModal } from '../../hooks/useModal';
import ProfileSettingsPanel from '../../components/ProfileSettingsPanel';
import SettingsPanel from '../../components/SettingsPanel';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
const resolveMedia = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_BASE_URL}${url}`);
const isImageAttachment = (attachment) => {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  const fileName = String(attachment?.originalName || attachment?.url || '').toLowerCase();
  if (mimeType.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName);
};

const defaultDraft = {
  title: '',
  question: '',
  details: '',
  score: '',
  remark: '',
  dueDate: '',
  attachment: null,
};

const InstructorDashboard = () => {
  const { user, updateProfile, loading, isAuthenticated, getDashboardPath } = useAuth();
  const { showSuccess, showError: showErrorModal, confirm } = useModal();
  const displayName = user?.fullName || user?.username || 'Instructor';
  const [activeMenuKey, setActiveMenuKey] = useState('overview');
  const [students, setStudents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [studentEmailDraft, setStudentEmailDraft] = useState('');
  const [studentActionBusy, setStudentActionBusy] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assignmentTarget, setAssignmentTarget] = useState('selected');
  const [assignmentSelectedStudentIds, setAssignmentSelectedStudentIds] = useState([]);
  const [assignmentDraft, setAssignmentDraft] = useState(defaultDraft);
  const [assignmentAttachmentPreviewUrl, setAssignmentAttachmentPreviewUrl] = useState('');
  const [editingAssignmentId, setEditingAssignmentId] = useState('');
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);
  const assignmentPreviewRef = useRef('');
  const [accentKey, setAccentKey] = useState(() => LocalStorageService.getDashboardAccent());
  const activeAccent = getDashboardAccent(accentKey);

  const menuItems = [
    { key: 'overview', label: 'Overview', icon: BarChart3, badge: 'Now' },
    { key: 'profile', label: 'Profile', icon: UserCircle, badge: 'Now' },
    { key: 'students', label: 'Students', icon: Users, badge: 'Now' },
    { key: 'assignments', label: 'Assignments', icon: ListTodo, badge: 'Now' },
    { key: 'reviews', label: 'Activity', icon: ClipboardCheck, badge: 'Now' },
    { key: 'code-lab', label: 'Code Lab', icon: Code2, badge: 'Now' },
    { key: 'settings', label: 'Settings', icon: Settings, badge: 'Now', position: 'bottom' },
  ];

  const allAssignments = useMemo(
    () => students.flatMap((student) => student.assignments || []),
    [students]
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
        detailColor: activeAccent.textClass,
      },
      {
        title: 'Assignments',
        value: String(allAssignments.length),
        detail: 'Created from Assignments menu',
        detailColor: activeAccent.textClass,
      },
      {
        title: 'Average Score',
        value: averageScore,
        detail: 'Across scored assignments',
        detailColor: activeAccent.textClass,
      },
    ],
    [activeAccent.textClass, allAssignments.length, averageScore, students.length]
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
      const hasSelected = nextStudents.some((student) => student.id === selectedStudentId);
      if (nextStudents.length === 0) {
        setSelectedStudentId('');
      } else if (!hasSelected) {
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

  useEffect(() => {
    const handleAccentChanged = (event) => {
      setAccentKey(event?.detail?.accent || LocalStorageService.getDashboardAccent());
    };

    window.addEventListener('devportix:accent-changed', handleAccentChanged);
    return () => {
      window.removeEventListener('devportix:accent-changed', handleAccentChanged);
    };
  }, []);

  useEffect(() => {
    assignmentPreviewRef.current = assignmentAttachmentPreviewUrl;
  }, [assignmentAttachmentPreviewUrl]);

  useEffect(() => () => {
    if (assignmentPreviewRef.current) {
      URL.revokeObjectURL(assignmentPreviewRef.current);
    }
  }, []);

  const handleAssignmentFileChange = (file) => {
    setAssignmentDraft((prev) => ({ ...prev, attachment: file || null }));
    setAssignmentAttachmentPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      if (file && String(file.type || '').startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
  };

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

  const handleAddStudent = async () => {
    const studentEmail = String(studentEmailDraft || '').trim().toLowerCase();
    if (!studentEmail) {
      setError('Student email is required.');
      return;
    }

    const token = LocalStorageService.getToken();
    if (!token) return;

    try {
      setStudentActionBusy(true);
      setError('');
      await mentorshipApi.addMyStudent(token, studentEmail);
      setStudentEmailDraft('');
      await loadStudents();
      showSuccess('Student Added', 'Student was added to your dashboard successfully.');
    } catch (addError) {
      setError(addError?.message || 'Unable to add student right now.');
      showErrorModal('Add Failed', addError?.message || 'Unable to add student right now.');
    } finally {
      setStudentActionBusy(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const token = LocalStorageService.getToken();
    if (!token) return;

    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Remove Student?',
      message: 'Are you sure you want to remove this student from your list?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    try {
      setStudentActionBusy(true);
      setError('');
      await mentorshipApi.removeMyStudent(token, studentId);
      await loadStudents();
      showSuccess('Student Removed', 'Student was removed successfully.');
    } catch (removeError) {
      setError(removeError?.message || 'Unable to remove student right now.');
      showErrorModal('Remove Failed', removeError?.message || 'Unable to remove student right now.');
    } finally {
      setStudentActionBusy(false);
    }
  };

  const resetAssignmentForm = () => {
    setAssignmentDraft(defaultDraft);
    setAssignmentTarget('selected');
    setAssignmentSelectedStudentIds([]);
    setAssignmentAttachmentPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
    setEditingAssignmentId('');
    setRemoveExistingAttachment(false);
  };

  const createOrUpdateAssignment = async () => {
    const token = LocalStorageService.getToken();
    if (!token) return;
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
      remark: String(assignmentDraft.remark || '').trim(),
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
        showSuccess('Assignment Updated', 'Assignment changes were saved successfully.');
      } else {
        if (assignmentTarget === 'selected' && assignmentSelectedStudentIds.length === 0) {
          setError('Select at least one student for this assignment.');
          setBusy(false);
          return;
        }

        const response = await mentorshipApi.createAssignments(token, {
          ...payload,
          target: assignmentTarget,
          studentIds: assignmentTarget === 'selected' ? assignmentSelectedStudentIds : undefined,
        });
        showSuccess(
          'Assignment Created',
          `Assignment created for ${Number(response?.count || 0)} student(s).`
        );
      }
      resetAssignmentForm();
      await loadStudents();
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save assignment right now.');
      showErrorModal('Save Failed', saveError?.message || 'Unable to save assignment right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedStudentId(assignment.studentId);
    setAssignmentTarget('selected');
    setAssignmentSelectedStudentIds([assignment.studentId]);
    setEditingAssignmentId(assignment.id);
    setRemoveExistingAttachment(false);
    setAssignmentDraft({
      title: assignment.title || '',
      question: assignment.question || '',
      details: assignment.details || '',
      score: Number.isFinite(assignment.score) ? String(assignment.score) : '',
      remark: assignment.remark || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 10) : '',
      attachment: null,
    });
    setAssignmentAttachmentPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
    setActiveMenuKey('assignments');
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const token = LocalStorageService.getToken();
    if (!token) return;

    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Assignment?',
      message: 'Are you sure you want to delete this assignment?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    try {
      setBusy(true);
      setError('');
      await mentorshipApi.deleteAssignment(token, assignmentId);
      await loadStudents();
      if (editingAssignmentId === assignmentId) {
        resetAssignmentForm();
      }
      showSuccess('Assignment Deleted', 'Assignment was deleted successfully.');
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to delete assignment right now.');
      showErrorModal('Delete Failed', deleteError?.message || 'Unable to delete assignment right now.');
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
            <div key={card.title} className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Overview</p>
              <h3 className="font-semibold text-lg text-white mt-3">{card.title}</h3>
              <p className="text-3xl font-bold text-white mt-4">{card.value}</p>
              <p className={`text-sm mt-2 ${card.detailColor}`}>{card.detail}</p>
            </div>
          ))}
        </div>
      )}

      {activeMenuKey === 'profile' && (
        <ProfileSettingsPanel accent={activeAccent} />
      )}

      {activeMenuKey === 'settings' && (
        <SettingsPanel accent={activeAccent} />
      )}

      {activeMenuKey === 'students' && (
        <div className="space-y-4">
          <div className="dashboard-panel rounded-[1.5rem] p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-white">Assigned Students</h3>
              <button
                type="button"
                onClick={loadStudents}
                disabled={busy}
                className={`text-sm transition ${activeAccent.linkClass}`}
              >
                Refresh
              </button>
            </div>
            <p className="text-sm text-gray-400">Students are auto-added when they choose you from their dashboard.</p>
            <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-3">
              <input
                type="email"
                value={studentEmailDraft}
                onChange={(event) => setStudentEmailDraft(event.target.value)}
                placeholder="Add student by email"
                className="dashboard-input rounded-xl px-3 py-2.5 text-sm text-white"
              />
              <button
                type="button"
                onClick={handleAddStudent}
                disabled={studentActionBusy}
                className={`px-4 py-2 rounded-lg text-white ${activeAccent.primaryButtonClass}`}
              >
                {studentActionBusy ? 'Saving...' : 'Add Student'}
              </button>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="dashboard-panel rounded-[1.5rem] p-6">
              <p className="text-gray-300">No students assigned yet.</p>
            </div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="dashboard-panel rounded-[1.25rem] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{student.fullName}</p>
                    <p className="text-sm text-gray-400">{student.email}</p>
                    <p className="text-xs text-gray-400 mt-2">{(student.assignments || []).length} assignment(s)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={studentActionBusy}
                    className="px-3 py-1.5 text-xs border border-red-400/50 rounded text-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeMenuKey === 'assignments' && (
        <div className="space-y-6">
          <div className="dashboard-panel rounded-[1.5rem] p-6">
            <h3 className="font-semibold text-lg text-white mb-4">
              {editingAssignmentId ? 'Edit Assignment' : 'Create Assignment'}
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="dashboard-input rounded-xl px-3 py-2.5 text-sm text-white"
              >
                <option value="">All students (filter)</option>
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
                className="dashboard-input rounded-xl px-3 py-2.5 text-sm text-white"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={assignmentDraft.score}
                onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, score: event.target.value }))}
                placeholder="Score (optional)"
                className="dashboard-input rounded-xl px-3 py-2.5 text-sm text-white"
              />
              <input
                type="date"
                value={assignmentDraft.dueDate}
                onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="dashboard-input rounded-xl px-3 py-2.5 text-sm text-white"
              />
            </div>
            {!editingAssignmentId && (
              <div className="mt-3 space-y-2">
                <label className="text-sm text-gray-300">Assign To</label>
                <select
                  value={assignmentTarget}
                  onChange={(event) => setAssignmentTarget(event.target.value)}
                  className="dashboard-input w-full rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="selected">Selected students</option>
                  <option value="all">All my students</option>
                </select>
                {assignmentTarget === 'selected' && (
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-white/10 p-2 bg-black/10 space-y-2">
                    {students.length === 0 ? (
                      <p className="text-xs text-gray-400">No students available.</p>
                    ) : (
                      students.map((student) => (
                        <label key={student.id} className="flex items-center gap-2 text-sm text-gray-200">
                          <input
                            type="checkbox"
                            checked={assignmentSelectedStudentIds.includes(student.id)}
                            onChange={(event) =>
                              setAssignmentSelectedStudentIds((current) =>
                                event.target.checked
                                  ? [...new Set([...current, student.id])]
                                  : current.filter((id) => id !== student.id)
                              )
                            }
                          />
                          {student.fullName} ({student.email})
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <textarea
              rows={3}
              value={assignmentDraft.question}
              onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, question: event.target.value }))}
              placeholder="Assignment question"
              className="dashboard-input mt-3 w-full rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <textarea
              rows={3}
              value={assignmentDraft.details}
              onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, details: event.target.value }))}
              placeholder="Extra instructions (optional)"
              className="dashboard-input mt-3 w-full rounded-xl px-3 py-2.5 text-sm text-white"
            />
            <textarea
              rows={2}
              value={assignmentDraft.remark}
              onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, remark: event.target.value }))}
              placeholder="Instructor remark (optional)"
              className="dashboard-input mt-3 w-full rounded-xl px-3 py-2.5 text-sm text-white"
            />

            <div className="mt-3 grid md:grid-cols-[1fr_auto_auto] gap-3 items-center">
              <input
                type="file"
                onChange={(event) => handleAssignmentFileChange(event.target.files?.[0] || null)}
                className="text-sm text-gray-300"
              />
              {assignmentAttachmentPreviewUrl && (
                <div className="w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                  <img
                    src={assignmentAttachmentPreviewUrl}
                    alt="Assignment attachment preview"
                    className="h-20 w-20 rounded object-cover"
                  />
                </div>
              )}
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
                    className="dashboard-soft-button px-4 py-2 rounded-xl text-white"
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

          <div className="dashboard-panel rounded-[1.5rem] p-6">
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
                    <div key={assignment.id} className="dashboard-panel rounded-[1.25rem] p-4 bg-black/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{assignment.title}</p>
                          <p className="text-xs text-gray-400 mt-1">Student: {student?.fullName || 'Unknown'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditAssignment(assignment)}
                            className="dashboard-soft-button px-2 py-1 text-xs rounded text-white"
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
                        <>
                          {isImageAttachment(assignment.attachment) && (
                            <div className="mt-2 w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                              <img
                                src={resolveMedia(assignment.attachment.url)}
                                alt="Assignment attachment preview"
                                className="h-24 w-24 rounded object-cover"
                              />
                            </div>
                          )}
                          <a
                            href={resolveMedia(assignment.attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-sm mt-2 inline-block ${activeAccent.linkClass}`}
                          >
                            Open attachment ({assignment.attachment.originalName || 'file'})
                          </a>
                        </>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Score: {Number.isFinite(assignment.score) ? assignment.score : 'Not scored'} | Due:{' '}
                        {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Remark: {assignment.remark ? assignment.remark : 'No remark yet'}
                      </p>
                      <p className={`text-xs mt-2 ${activeAccent.textClass}`}>
                        Submission status: {assignment.submission?.submittedAt ? 'Submitted' : 'Not submitted'}
                      </p>
                      {assignment.submission?.submittedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
                        </p>
                      )}
                      {assignment.submission?.answer && (
                        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">
                          Student answer: {assignment.submission.answer}
                        </p>
                      )}
                      {assignment.submission?.attachment?.url && (
                        <>
                          {isImageAttachment(assignment.submission.attachment) && (
                            <div className="mt-2 w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                              <img
                                src={resolveMedia(assignment.submission.attachment.url)}
                                alt="Submitted assignment preview"
                                className="h-24 w-24 rounded object-cover"
                              />
                            </div>
                          )}
                          <a
                            href={resolveMedia(assignment.submission.attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-sm mt-2 inline-block ${activeAccent.linkClass}`}
                          >
                            View submitted file ({assignment.submission.attachment.originalName || 'file'})
                          </a>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeMenuKey === 'reviews' && (
        <div className="dashboard-panel rounded-[1.5rem] p-6">
          <h3 className="font-semibold text-lg text-white mb-4">Recent Assignment Activity</h3>
          {allAssignments.length === 0 ? (
            <p className="text-gray-300">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {allAssignments.slice(0, 12).map((assignment) => {
                const student = students.find((item) => item.id === assignment.studentId);
                return (
                  <div key={assignment.id} className={`border-l-4 ${activeAccent.borderClass} bg-white/5 rounded-r-lg p-4`}>
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
