const User = require('../modules/userSchema');
const { MentorshipLink, MentorshipAssignment } = require('../modules/mentorship');

const WORK_TYPES = ['assignment', 'project'];
const WORK_TYPE_LABELS = {
  assignment: 'Assignment',
  project: 'Project',
};

const toUserPayload = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  githubUsername: userDoc.githubUsername || '',
  avatar: userDoc.avatar || null,
});

const normalizeWorkType = (value) => {
  const normalized = String(value || 'assignment').trim().toLowerCase();
  return WORK_TYPES.includes(normalized) ? normalized : null;
};

const toAttachmentPayload = (file) => {
  if (!file) return undefined;
  return {
    url: `/uploads/assignments/${file.filename}`,
    mimeType: file.mimetype || '',
    originalName: file.originalname || '',
    size: Number(file.size || 0),
  };
};

const hasSubmission = (doc) => Boolean(
  doc?.submission?.submittedAt || doc?.submission?.answer || doc?.submission?.attachment?.url
);

const hasReview = (doc) => Number.isFinite(doc?.score) || Boolean(String(doc?.remark || '').trim());

const toAssignmentPayload = (doc) => {
  const type = normalizeWorkType(doc.type) || 'assignment';
  const submitted = hasSubmission(doc);
  const reviewed = hasReview(doc);

  return {
    id: String(doc._id),
    instructorId: String(doc.instructorId),
    studentId: String(doc.studentId),
    type,
    typeLabel: WORK_TYPE_LABELS[type],
    title: doc.title,
    question: doc.question || '',
    details: doc.details || '',
    attachment: doc.attachment?.url
      ? {
          url: doc.attachment.url,
          mimeType: doc.attachment.mimeType || '',
          originalName: doc.attachment.originalName || '',
          size: Number(doc.attachment.size || 0),
        }
      : null,
    submission:
      submitted
        ? {
            answer: doc.submission?.answer || '',
            attachment: doc.submission?.attachment?.url
              ? {
                  url: doc.submission.attachment.url,
                  mimeType: doc.submission.attachment.mimeType || '',
                  originalName: doc.submission.attachment.originalName || '',
                  size: Number(doc.submission.attachment.size || 0),
                }
              : null,
            submittedAt: doc.submission?.submittedAt || null,
          }
        : null,
    score: doc.score ?? null,
    remark: doc.remark || '',
    reviewedAt: doc.reviewedAt || null,
    dueDate: doc.dueDate || null,
    submissionStatus: submitted ? 'submitted' : 'pending',
    reviewStatus: reviewed ? 'reviewed' : 'pending',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const buildGrowthSummary = (docs = []) => {
  const normalizedDocs = Array.isArray(docs) ? docs : [];
  const scoredItems = normalizedDocs.filter((doc) => Number.isFinite(doc?.score));
  const submittedItems = normalizedDocs.filter((doc) => hasSubmission(doc));
  const reviewedItems = normalizedDocs.filter((doc) => hasReview(doc));
  const assignmentsCount = normalizedDocs.filter((doc) => normalizeWorkType(doc?.type) === 'assignment').length;
  const projectsCount = normalizedDocs.filter((doc) => normalizeWorkType(doc?.type) === 'project').length;
  const averageScore = scoredItems.length > 0
    ? Number((scoredItems.reduce((sum, doc) => sum + Number(doc.score || 0), 0) / scoredItems.length).toFixed(1))
    : null;
  const latestReviewedItem = [...reviewedItems]
    .sort((left, right) => new Date(right.reviewedAt || right.updatedAt || 0) - new Date(left.reviewedAt || left.updatedAt || 0))[0];

  return {
    totalItems: normalizedDocs.length,
    assignmentsCount,
    projectsCount,
    submittedCount: submittedItems.length,
    reviewedCount: reviewedItems.length,
    pendingCount: Math.max(normalizedDocs.length - submittedItems.length, 0),
    averageScore,
    latestRemark: latestReviewedItem?.remark || '',
    latestReviewedAt: latestReviewedItem?.reviewedAt || latestReviewedItem?.updatedAt || null,
  };
};

const parseStudentIds = (rawStudentIds) => {
  if (Array.isArray(rawStudentIds)) {
    return rawStudentIds;
  }

  if (typeof rawStudentIds === 'string') {
    try {
      const maybeArray = JSON.parse(rawStudentIds);
      if (Array.isArray(maybeArray)) {
        return maybeArray;
      }
    } catch {
      return rawStudentIds.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const validateScore = (rawScore) => {
  if (rawScore === '' || rawScore === undefined || rawScore === null) {
    return { value: null };
  }

  const score = Number(rawScore);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { error: 'score must be a number between 0 and 100' };
  }

  return { value: score };
};

const validateDueDate = (rawValue) => {
  const dueDateRaw = String(rawValue || '').trim();
  if (!dueDateRaw) {
    return { value: null };
  }

  const dueDate = new Date(dueDateRaw);
  if (Number.isNaN(dueDate.getTime())) {
    return { error: 'dueDate is invalid' };
  }

  return { value: dueDate };
};

const listInstructors = async (_req, res) => {
  try {
    const instructors = await User.find({ role: 'instructor' })
      .sort({ createdAt: -1 })
      .select('fullName email role githubUsername avatar');

    return res.status(200).json({
      instructors: instructors.map(toUserPayload),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load instructors', error: error.message });
  }
};

const selectInstructor = async (req, res) => {
  try {
    const instructorId = String(req.body?.instructorId || '').trim();
    if (!instructorId) {
      return res.status(400).json({ message: 'instructorId is required' });
    }

    const instructor = await User.findOne({ _id: instructorId, role: 'instructor' })
      .select('fullName email role githubUsername avatar');
    if (!instructor) {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    const existingLink = await MentorshipLink.findOne({ studentId: req.userId, status: 'active' })
      .populate('instructorId', 'fullName email role githubUsername avatar');

    if (existingLink) {
      if (String(existingLink.instructorId?._id || existingLink.instructorId) === instructorId) {
        return res.status(200).json({
          message: 'Instructor already selected',
          mentorship: {
            id: String(existingLink._id),
            instructor: existingLink.instructorId
              ? toUserPayload(existingLink.instructorId)
              : toUserPayload(instructor),
            status: existingLink.status,
          },
        });
      }

      return res.status(409).json({
        message: 'Instructor selection is locked. Only your instructor can remove you before you can select again.',
      });
    }

    const link = await MentorshipLink.create({
      instructorId,
      studentId: req.userId,
      status: 'active',
    });

    return res.status(200).json({
      message: 'Instructor selected',
      mentorship: {
        id: String(link._id),
        instructor: toUserPayload(instructor),
        status: link.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to select instructor', error: error.message });
  }
};

const getMyMentorship = async (req, res) => {
  try {
    const link = await MentorshipLink.findOne({ studentId: req.userId, status: 'active' })
      .populate('instructorId', 'fullName email role githubUsername avatar')
      .lean();

    const assignments = await MentorshipAssignment.find({ studentId: req.userId })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      instructor: link?.instructorId ? toUserPayload(link.instructorId) : null,
      assignments: assignments.map(toAssignmentPayload),
      growthSummary: buildGrowthSummary(assignments),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load mentorship data', error: error.message });
  }
};

const listMyStudents = async (req, res) => {
  try {
    const links = await MentorshipLink.find({ instructorId: req.userId, status: 'active' })
      .populate('studentId', 'fullName email role githubUsername avatar')
      .sort({ createdAt: -1 })
      .lean();

    const students = await Promise.all(
      links.map(async (link) => {
        const student = link.studentId;
        const assignments = await MentorshipAssignment.find({
          instructorId: req.userId,
          studentId: student._id,
        })
          .sort({ dueDate: 1, createdAt: -1 })
          .lean();

        return {
          ...toUserPayload(student),
          assignments: assignments.map(toAssignmentPayload),
          growthSummary: buildGrowthSummary(assignments),
        };
      })
    );

    return res.status(200).json({ students });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load students', error: error.message });
  }
};

const addMyStudent = async (req, res) => {
  try {
    const studentEmail = String(req.body?.studentEmail || '').trim().toLowerCase();
    if (!studentEmail) {
      return res.status(400).json({ message: 'studentEmail is required' });
    }

    const student = await User.findOne({ email: studentEmail, role: 'student' })
      .select('fullName email role githubUsername avatar');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const existingLink = await MentorshipLink.findOne({ studentId: student._id, status: 'active' }).lean();
    if (existingLink && String(existingLink.instructorId) !== String(req.userId)) {
      return res.status(409).json({ message: 'Student is already assigned to another instructor' });
    }

    await MentorshipLink.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: {
          instructorId: req.userId,
          studentId: student._id,
          status: 'active',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'Student added successfully',
      student: toUserPayload(student),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add student', error: error.message });
  }
};

const removeMyStudent = async (req, res) => {
  try {
    const studentId = String(req.params.studentId || '').trim();
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const removedLink = await MentorshipLink.findOneAndDelete({
      instructorId: req.userId,
      studentId,
      status: 'active',
    });

    if (!removedLink) {
      return res.status(404).json({ message: 'Student assignment not found' });
    }

    await MentorshipAssignment.deleteMany({
      instructorId: req.userId,
      studentId,
    });

    return res.status(200).json({ message: 'Student removed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove student', error: error.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const studentId = String(req.params.studentId || '').trim();
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const link = await MentorshipLink.findOne({
      instructorId: req.userId,
      studentId,
      status: 'active',
    }).lean();

    if (!link) {
      return res.status(403).json({ message: 'This student is not assigned to you' });
    }

    const type = normalizeWorkType(req.body?.type);
    if (!type) {
      return res.status(400).json({ message: "type must be either 'assignment' or 'project'" });
    }

    const title = String(req.body?.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const question = String(req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ message: 'question is required' });
    }

    const scoreResult = validateScore(req.body?.score);
    if (scoreResult.error) {
      return res.status(400).json({ message: scoreResult.error });
    }

    const dueDateResult = validateDueDate(req.body?.dueDate);
    if (dueDateResult.error) {
      return res.status(400).json({ message: dueDateResult.error });
    }

    const details = String(req.body?.details || '').trim();
    const remark = String(req.body?.remark || '').trim();
    const created = await MentorshipAssignment.create({
      instructorId: req.userId,
      studentId,
      type,
      title,
      question,
      details,
      attachment: toAttachmentPayload(req.file),
      score: scoreResult.value,
      remark,
      reviewedAt: scoreResult.value !== null || remark ? new Date() : null,
      dueDate: dueDateResult.value,
    });

    return res.status(201).json({
      message: `${WORK_TYPE_LABELS[type]} created`,
      assignment: toAssignmentPayload(created),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create assignment', error: error.message });
  }
};

const createAssignments = async (req, res) => {
  try {
    const target = String(req.body?.target || 'selected').trim().toLowerCase();
    if (!['all', 'selected'].includes(target)) {
      return res.status(400).json({ message: "target must be either 'all' or 'selected'" });
    }

    const type = normalizeWorkType(req.body?.type);
    if (!type) {
      return res.status(400).json({ message: "type must be either 'assignment' or 'project'" });
    }

    const title = String(req.body?.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    const question = String(req.body?.question || '').trim();
    if (!question) {
      return res.status(400).json({ message: 'question is required' });
    }

    const scoreResult = validateScore(req.body?.score);
    if (scoreResult.error) {
      return res.status(400).json({ message: scoreResult.error });
    }

    const dueDateResult = validateDueDate(req.body?.dueDate);
    if (dueDateResult.error) {
      return res.status(400).json({ message: dueDateResult.error });
    }

    const details = String(req.body?.details || '').trim();
    const remark = String(req.body?.remark || '').trim();
    const activeLinks = await MentorshipLink.find({
      instructorId: req.userId,
      status: 'active',
    })
      .select('studentId')
      .lean();

    const allStudentIds = activeLinks.map((link) => String(link.studentId));
    if (allStudentIds.length === 0) {
      return res.status(400).json({ message: 'No active students found for this instructor' });
    }

    let targetStudentIds = allStudentIds;
    if (target === 'selected') {
      const allowedStudentIds = new Set(allStudentIds);
      targetStudentIds = [...new Set(parseStudentIds(req.body?.studentIds).map((item) => String(item || '').trim()).filter(Boolean))]
        .filter((studentId) => allowedStudentIds.has(studentId));

      if (targetStudentIds.length === 0) {
        return res.status(400).json({ message: 'Select at least one valid student' });
      }
    }

    const reviewedAt = scoreResult.value !== null || remark ? new Date() : null;
    const docs = targetStudentIds.map((studentId) => ({
      instructorId: req.userId,
      studentId,
      type,
      title,
      question,
      details,
      attachment: toAttachmentPayload(req.file),
      score: scoreResult.value,
      remark,
      reviewedAt,
      dueDate: dueDateResult.value,
    }));

    const createdAssignments = await MentorshipAssignment.insertMany(docs);

    return res.status(201).json({
      message: `${WORK_TYPE_LABELS[type]}s created for ${createdAssignments.length} student(s)`,
      count: createdAssignments.length,
      assignments: createdAssignments.map(toAssignmentPayload),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create assignments', error: error.message });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const assignmentId = String(req.params.assignmentId || '').trim();
    if (!assignmentId) {
      return res.status(400).json({ message: 'assignmentId is required' });
    }

    const assignment = await MentorshipAssignment.findOne({
      _id: assignmentId,
      instructorId: req.userId,
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.body?.type !== undefined) {
      const type = normalizeWorkType(req.body.type);
      if (!type) {
        return res.status(400).json({ message: "type must be either 'assignment' or 'project'" });
      }
      assignment.type = type;
    }

    if (req.body?.title !== undefined) {
      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'title cannot be empty' });
      assignment.title = title;
    }

    if (req.body?.question !== undefined) {
      const question = String(req.body.question || '').trim();
      if (!question) return res.status(400).json({ message: 'question cannot be empty' });
      assignment.question = question;
    }

    if (req.body?.details !== undefined) {
      assignment.details = String(req.body.details || '').trim();
    }

    let reviewTouched = false;
    if (req.body?.remark !== undefined) {
      assignment.remark = String(req.body.remark || '').trim();
      reviewTouched = true;
    }

    if (req.body?.score !== undefined) {
      const scoreResult = validateScore(req.body.score);
      if (scoreResult.error) {
        return res.status(400).json({ message: scoreResult.error });
      }
      assignment.score = scoreResult.value;
      reviewTouched = true;
    }

    if (req.body?.dueDate !== undefined) {
      const dueDateResult = validateDueDate(req.body.dueDate);
      if (dueDateResult.error) {
        return res.status(400).json({ message: dueDateResult.error });
      }
      assignment.dueDate = dueDateResult.value;
    }

    if (req.body?.removeAttachment === 'true') {
      assignment.attachment = {
        url: '',
        mimeType: '',
        originalName: '',
        size: 0,
      };
    }

    if (req.file) {
      assignment.attachment = toAttachmentPayload(req.file);
    }

    if (reviewTouched) {
      assignment.reviewedAt = hasReview(assignment) ? new Date() : null;
    }

    await assignment.save();

    return res.status(200).json({
      message: `${WORK_TYPE_LABELS[normalizeWorkType(assignment.type) || 'assignment']} updated`,
      assignment: toAssignmentPayload(assignment),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update assignment', error: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignmentId = String(req.params.assignmentId || '').trim();
    if (!assignmentId) {
      return res.status(400).json({ message: 'assignmentId is required' });
    }

    const removed = await MentorshipAssignment.findOneAndDelete({
      _id: assignmentId,
      instructorId: req.userId,
    });

    if (!removed) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const removedType = normalizeWorkType(removed.type) || 'assignment';
    return res.status(200).json({ message: `${WORK_TYPE_LABELS[removedType]} deleted` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete assignment', error: error.message });
  }
};

const submitMyAssignment = async (req, res) => {
  try {
    const assignmentId = String(req.params.assignmentId || '').trim();
    if (!assignmentId) {
      return res.status(400).json({ message: 'assignmentId is required' });
    }

    const assignment = await MentorshipAssignment.findOne({
      _id: assignmentId,
      studentId: req.userId,
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const answer = String(req.body?.answer || '').trim();
    const hasAttachment = Boolean(req.file);
    if (!answer && !hasAttachment) {
      return res.status(400).json({ message: 'Please provide an answer or attachment' });
    }

    assignment.submission = {
      answer,
      submittedAt: new Date(),
      attachment: hasAttachment
        ? toAttachmentPayload(req.file)
        : assignment.submission?.attachment?.url
          ? assignment.submission.attachment
          : {
              url: '',
              mimeType: '',
              originalName: '',
              size: 0,
            },
    };

    await assignment.save();

    const assignmentType = normalizeWorkType(assignment.type) || 'assignment';
    return res.status(200).json({
      message: `${WORK_TYPE_LABELS[assignmentType]} submitted`,
      assignment: toAssignmentPayload(assignment),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit assignment', error: error.message });
  }
};

module.exports = {
  listInstructors,
  selectInstructor,
  getMyMentorship,
  listMyStudents,
  addMyStudent,
  removeMyStudent,
  createAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitMyAssignment,
};
