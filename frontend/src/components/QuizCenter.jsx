import { useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import LocalStorageService from '../services/localStorageService';
import { quizApi } from '../services/quizApi';

const TRACKS = [
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'react', label: 'React' },
];

const FREE_PLAN_UPGRADE_MESSAGE =
  'Upgrade to a better plan to generate certificates.';

const formatTrack = (track) => {
  const found = TRACKS.find((item) => item.id === track);
  return found ? found.label : String(track || '').toUpperCase();
};

const sanitizeFilePart = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const downloadDataUrl = (fileName, dataUrl) => {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const downloadBlobUrl = (fileName, blobUrl) => {
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

const buildCertificateDataUrl = (certificate) =>
  new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1100;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Unable to create certificate image.'));
        return;
      }

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.45, '#1e293b');
      gradient.addColorStop(1, '#0b1120');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);

      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';

      ctx.font = '700 52px Georgia';
      ctx.fillText('Certificate of Completion', canvas.width / 2, 200);

      ctx.font = '600 30px Arial';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('DevPortix', canvas.width / 2, 258);

      ctx.font = '400 28px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('This certifies that', canvas.width / 2, 350);

      ctx.font = '700 58px Georgia';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(certificate.studentName, canvas.width / 2, 440);

      ctx.font = '400 28px Arial';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`has successfully completed the ${certificate.track} quiz`, canvas.width / 2, 518);
      ctx.fillText(
        `with a score of ${certificate.score}/${certificate.totalQuestions} (${certificate.percentage}%)`,
        canvas.width / 2,
        562
      );

      const completedDate = new Date(certificate.completedAt).toLocaleDateString();
      ctx.font = '400 22px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Completed: ${completedDate}`, canvas.width / 2, 644);
      ctx.fillText(`Certificate ID: ${certificate.certificateId}`, canvas.width / 2, 684);

      ctx.font = '600 26px Arial';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Issued by ${certificate.issuedBy}`, canvas.width / 2, 782);

      resolve(canvas.toDataURL('image/png'));
    } catch (error) {
      reject(error);
    }
  });

const QuizCenter = ({ accent, userSubscription: _userSubscription, userFullName }) => {
  const activeAccent = accent || {
    textClass: 'text-blue-300',
    primaryButtonClass: 'bg-blue-600 hover:bg-blue-500',
    focusRingClass: 'focus:ring-blue-500/70',
  };
  const [activeTrack, setActiveTrack] = useState('html');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [submitNotice, setSubmitNotice] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [loadError, setLoadError] = useState('');
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [passPercentage, setPassPercentage] = useState(60);
  const [certificatePreview, setCertificatePreview] = useState(null);
  const pdfPreviewUrlRef = useRef('');

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((questionId) => Number.isInteger(answers[questionId])).length,
    [answers]
  );
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  useEffect(() => {
    let mounted = true;

    const loadTrackQuestions = async () => {
      const token = LocalStorageService.getToken();
      if (!token) return;
      try {
        setQuestionsLoading(true);
        setLoadError('');
        setActionNotice('');
        setSubmitNotice('');
        setScore(null);
        setAnswers({});
        const response = await quizApi.getQuestions(token, activeTrack);
        if (!mounted) return;
        setQuestions(Array.isArray(response.questions) ? response.questions : []);
        setPassPercentage(Number(response.passPercentage) || 60);
      } catch (error) {
        if (!mounted) return;
        setLoadError(error?.message || 'Unable to load quiz questions right now.');
      } finally {
        if (mounted) {
          setQuestionsLoading(false);
        }
      }
    };

    loadTrackQuestions();
    return () => {
      mounted = false;
    };
  }, [activeTrack]);

  useEffect(() => {
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current);
      pdfPreviewUrlRef.current = '';
    }
    setCertificatePreview(null);
  }, [activeTrack]);

  useEffect(() => () => {
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current);
      pdfPreviewUrlRef.current = '';
    }
  }, []);

  const onAnswerSelect = (questionId, selectedIndex) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: selectedIndex,
    }));
  };

  const submitCurrentQuiz = async () => {
    if (!allAnswered) {
      setActionNotice('Answer all questions before submitting.');
      return;
    }

    const token = LocalStorageService.getToken();
    if (!token) return;

    try {
      setBusyAction('submit');
      setLoadError('');
      setActionNotice('');
      setSubmitNotice('');
      const response = await quizApi.submit(token, activeTrack, answers);
      setPassPercentage(Number(response?.passPercentage) || 60);

      const hasInlineScore =
        Number.isFinite(Number(response?.score)) &&
        Number.isFinite(Number(response?.totalQuestions)) &&
        Number.isFinite(Number(response?.percentage));

      if (hasInlineScore) {
        setScore({
          score: Number(response.score),
          totalQuestions: Number(response.totalQuestions),
          percentage: Number(response.percentage),
          passed: Boolean(response.passed),
          passPercentage: Number(response.passPercentage) || 60,
          completedAt: response.completedAt || response.submittedAt || new Date().toISOString(),
        });
        setSubmitNotice(`Quiz submitted for ${formatTrack(activeTrack)}. Your score is shown below.`);
      } else {
        const latest = await quizApi.getScore(token, activeTrack);
        setPassPercentage(Number(latest?.passPercentage) || 60);
        setScore(latest);
        setSubmitNotice(`Quiz submitted for ${formatTrack(activeTrack)}. Your score is shown below.`);
      }
    } catch (error) {
      setActionNotice(error?.message || 'Unable to submit quiz right now.');
    } finally {
      setBusyAction('');
    }
  };

  const seeScore = async () => {
    const token = LocalStorageService.getToken();
    if (!token) return;

    try {
      setBusyAction('score');
      setActionNotice('');
      const response = await quizApi.getScore(token, activeTrack);
      setPassPercentage(Number(response.passPercentage) || 60);
      setScore(response);
    } catch (error) {
      setActionNotice(error?.message || 'Unable to fetch your score right now.');
    } finally {
      setBusyAction('');
    }
  };

  const generateCertificate = async (type) => {
    const token = LocalStorageService.getToken();
    if (!token) return;

    try {
      setBusyAction(type);
      setActionNotice('');
      const response = await quizApi.getCertificate(token, activeTrack, type);
      const certificate = {
        ...response.certificate,
        studentName: response.certificate?.studentName || userFullName || 'DevPortix Student',
      };

      const imageDataUrl = await buildCertificateDataUrl(certificate);
      const trackPart = sanitizeFilePart(certificate.track);
      const fileBase = `devportix-${trackPart}-certificate`;

      if (type === 'png') {
        if (pdfPreviewUrlRef.current) {
          URL.revokeObjectURL(pdfPreviewUrlRef.current);
          pdfPreviewUrlRef.current = '';
        }
        setCertificatePreview({
          type: 'png',
          source: imageDataUrl,
          fileName: `${fileBase}.png`,
        });
        downloadDataUrl(`${fileBase}.png`, imageDataUrl);
        setActionNotice('Certificate PNG downloaded successfully.');
        return;
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1100, 1600],
      });
      pdf.addImage(imageDataUrl, 'PNG', 0, 0, 1600, 1100);
      const pdfBlob = pdf.output('blob');
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);
      if (pdfPreviewUrlRef.current) {
        URL.revokeObjectURL(pdfPreviewUrlRef.current);
      }
      pdfPreviewUrlRef.current = pdfBlobUrl;
      setCertificatePreview({
        type: 'pdf',
        source: pdfBlobUrl,
        fileName: `${fileBase}.pdf`,
      });
      downloadBlobUrl(`${fileBase}.pdf`, pdfBlobUrl);
      setActionNotice('Certificate PDF downloaded successfully.');
    } catch (error) {
      if (error?.status === 403) {
        setActionNotice(error?.message || FREE_PLAN_UPGRADE_MESSAGE);
        return;
      }
      setActionNotice(error?.message || 'Unable to generate certificate right now.');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white">Quiz Center</h3>
        <p className="text-gray-300 mt-2">
          Practice with 10 multiple-choice questions in each track: HTML, CSS, JavaScript, and React.
          Pass mark is above {passPercentage}%.
        </p>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {TRACKS.map((track) => {
            const isActive = track.id === activeTrack;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrack(track.id)}
                className={`px-4 py-2 rounded-lg border text-sm transition ${
                  isActive
                    ? `${activeAccent.primaryButtonClass} border-transparent text-white`
                    : 'border-white/20 text-gray-200 hover:bg-white/10'
                }`}
              >
                {track.label}
              </button>
            );
          })}
        </div>

        {questionsLoading && <p className="text-gray-300">Loading questions...</p>}
        {loadError && <p className="text-red-300">{loadError}</p>}

        {!questionsLoading && !loadError && (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <article key={question.id} className="border border-white/10 bg-black/20 rounded-lg p-4">
                <p className="text-white font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <div className="mt-3 grid gap-2">
                  {(question.options || []).map((option, optionIndex) => {
                    const checked = answers[question.id] === optionIndex;
                    return (
                      <label
                        key={`${question.id}-${optionIndex}`}
                        className={`flex items-start gap-3 rounded-md border px-3 py-2 cursor-pointer transition ${
                          checked ? 'border-cyan-400/60 bg-cyan-500/10 text-white' : 'border-white/10 text-gray-200 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={checked}
                          onChange={() => onAnswerSelect(question.id, optionIndex)}
                          className="mt-1"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={submitCurrentQuiz}
            disabled={busyAction === 'submit' || questionsLoading}
            className={`px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass} disabled:opacity-70`}
          >
            {busyAction === 'submit' ? 'Submitting...' : 'Submit Quiz'}
          </button>

          <button
            type="button"
            onClick={seeScore}
            disabled={busyAction === 'score' || questionsLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-70"
          >
            {busyAction === 'score' ? 'Loading Score...' : 'See Score'}
          </button>

          <button
            type="button"
            onClick={() => generateCertificate('png')}
            disabled={busyAction === 'png' || questionsLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-70"
          >
            {busyAction === 'png' ? 'Generating PNG...' : 'Generate Certificate (PNG)'}
          </button>

          <button
            type="button"
            onClick={() => generateCertificate('pdf')}
            disabled={busyAction === 'pdf' || questionsLoading}
            className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition disabled:opacity-70"
          >
            {busyAction === 'pdf' ? 'Generating PDF...' : 'Generate Certificate (PDF)'}
          </button>
        </div>

        <p className={`text-sm mt-3 ${activeAccent.textClass}`}>
          Answered {answeredCount}/{questions.length} questions in {formatTrack(activeTrack)}.
        </p>
        {submitNotice && <p className="text-green-300 mt-2">{submitNotice}</p>}
        {actionNotice && <p className="text-amber-300 mt-2">{actionNotice}</p>}

        {score && (
          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-white font-semibold">Latest {formatTrack(activeTrack)} Score</p>
            <p className="text-gray-300 mt-1">
              {score.score}/{score.totalQuestions} ({score.percentage}%)
            </p>
            <p className={`mt-1 text-sm ${score.passed ? 'text-green-300' : 'text-rose-300'}`}>
              {score.passed
                ? 'Passed: eligible for certificate generation.'
                : `Not passed yet: you need above ${score.passPercentage || 60}%.`}
            </p>
          </div>
        )}

        {certificatePreview && (
          <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
            <p className="text-white font-semibold mb-3">
              Certificate Preview ({certificatePreview.type.toUpperCase()})
            </p>
            {certificatePreview.type === 'png' ? (
              <div className="space-y-3">
                <img
                  src={certificatePreview.source}
                  alt="Certificate preview"
                  className="w-full max-w-3xl rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => downloadDataUrl(certificatePreview.fileName, certificatePreview.source)}
                  className={`px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
                >
                  Download PNG Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <iframe
                  title="Certificate PDF Preview"
                  src={certificatePreview.source}
                  className="w-full h-[420px] rounded-lg border border-white/10 bg-white"
                />
                <button
                  type="button"
                  onClick={() => downloadBlobUrl(certificatePreview.fileName, certificatePreview.source)}
                  className={`px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
                >
                  Download PDF Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizCenter;
