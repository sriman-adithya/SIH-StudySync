import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  MessageSquare,
  Video,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  Copy,
  Check,
  Send,
  Loader2,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Topic, MCQQuestion, AlternativeResources } from "../types";

interface QuizMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic;
  subjectName: string;
  onTopicMastered: (topicId: string, score: number) => void;
  onSaveNotes: (topicId: string, notes: string) => void;
}

export const QuizMasteryModal: React.FC<QuizMasteryModalProps> = ({
  isOpen,
  onClose,
  topic,
  subjectName,
  onTopicMastered,
  onSaveNotes,
}) => {
  const [activeTab, setActiveTab] = useState<"study" | "quiz" | "tutor" | "multimodal">("study");
  const [notes, setNotes] = useState(topic.notes || "");
  const [savedNotesMessage, setSavedNotesMessage] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Tutor Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: `Hello! I'm your StudySync tutor for "${topic.title}". I'm here to give you concise, punctual, crystal-clear answers. What would you like clarified before your quiz?`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Alternative Resources state (YouTube, NotebookLM, Audio)
  const [resources, setResources] = useState<AlternativeResources | null>(null);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [copiedNotebookLM, setCopiedNotebookLM] = useState(false);

  // Audio synthesizer (Web Speech API) state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);

  useEffect(() => {
    if (isOpen) {
      setNotes(topic.notes || "");
      setQuizSubmitted(false);
      setUserAnswers({});
      setQuizScore(null);
      fetchQuizQuestions();
      fetchAlternativeResources();
    } else {
      // Stop speech if modal closes
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      }
    }
  }, [isOpen, topic.id]);

  const handleSaveNotes = () => {
    onSaveNotes(topic.id, notes);
    setSavedNotesMessage(true);
    setTimeout(() => setSavedNotesMessage(false), 2000);
  };

  const fetchQuizQuestions = async () => {
    setIsLoadingQuiz(true);
    try {
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: topic.title,
          subjectName,
          keyConcepts: topic.keyConcepts,
          difficulty: topic.difficulty,
          questionCount: 5,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.questions) {
        setQuestions(json.data.questions);
      } else {
        throw new Error("Invalid quiz response");
      }
    } catch {
      // High-yield fallback questions grounded in the topic
      const fallbackQuestions: MCQQuestion[] = [
        {
          id: "q1",
          question: `What is the core principle underlying ${topic.title}?`,
          options: [
            topic.keyConcepts[0] || "Structured step-by-step breakdown",
            "Random memory retrieval without repetition",
            "Ignoring edge cases and asymptotic bounds",
            "Passive skimming of notes",
          ],
          correctOptionIndex: 0,
          explanation: `The foundational concept of ${topic.title} centers directly around ${topic.keyConcepts[0] || "its primary principles"}.`,
        },
        {
          id: "q2",
          question: `Which of the following best represents a key application of ${topic.title}?`,
          options: [
            "Maximizing cognitive confusion",
            topic.keyConcepts[1] || "Systematic problem solving and optimization",
            "Eliminating all review intervals",
            "Arbitrary trial and error",
          ],
          correctOptionIndex: 1,
          explanation: `Application of this topic emphasizes ${topic.keyConcepts[1] || "structured conceptual execution"}.`,
        },
        {
          id: "q3",
          question: `When practicing active recall for ${topic.title}, what yields the highest retention?`,
          options: [
            "Re-reading the exact same text 10 times",
            "Retrieving core principles from memory without immediate cues",
            "Waiting until exam morning to review",
            "Skipping practice problems entirely",
          ],
          correctOptionIndex: 1,
          explanation: "Neuroscience proves active memory retrieval creates far stronger synaptic pathways than passive recognition.",
        },
        {
          id: "q4",
          question: `Why is this topic rated as ${topic.difficulty} difficulty in your study menu?`,
          options: [
            "It requires mastering foundational logic and continuous application",
            "It has no real-world relevance",
            "It is completely identical to every other topic",
            "It can only be understood by AI",
          ],
          correctOptionIndex: 0,
          explanation: "Mastery demands understanding the underlying rules and applying them with clarity.",
        },
      ];
      setQuestions(fallbackQuestions);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const fetchAlternativeResources = async () => {
    setIsLoadingResources(true);
    try {
      const res = await fetch("/api/gemini/recommend-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: topic.title,
          subjectName,
          keyConcepts: topic.keyConcepts,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setResources(json.data);
      }
    } catch (err) {
      console.error("Resource fetch failed:", err);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmitQuiz = () => {
    if (questions.length === 0) return;
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    setQuizScore(scorePercent);
    setQuizSubmitted(true);

    // Pass mark is 75% (user specified 70 to 80%)
    if (scorePercent >= 75) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      onTopicMastered(topic.id, scorePercent);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    fetchQuizQuestions();
  };

  // AI Tutor message send
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/gemini/tutor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          topicTitle: topic.title,
          subjectName,
          chatHistory: chatMessages,
          studentNotes: notes,
        }),
      });
      const json = await res.json();
      if (json.success && json.reply) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: json.reply }]);
      } else {
        throw new Error("Chat failed");
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `In essence, "${topic.title}" revolves around: ${topic.keyConcepts.join(", ")}. Keep explanations succinct: identify the base principle, understand how it handles input, and verify edge cases. Ready to try an MCQ?`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Built-in TTS Audio controls (Web Speech API)
  const togglePlayAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported on this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToRead =
      resources?.audioScript ||
      `Subject: ${subjectName}. Topic: ${topic.title}. ${topic.description}. Key concepts to remember: ${topic.keyConcepts.join(
        ", "
      )}. ${notes ? `Student notes: ${notes}` : ""}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleCopyNotebookLM = () => {
    const textToCopy =
      resources?.notebookLmDossier ||
      `# StudySync Source Dossier: ${topic.title}\nSubject: ${subjectName}\nModule: ${topic.moduleName}\n\n## Overview\n${topic.description}\n\n## Key Concepts\n${topic.keyConcepts.map((c) => `- ${c}`).join("\n")}\n\n## Student Study Notes\n${notes || "No extra notes"}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedNotebookLM(true);
    setTimeout(() => setCopiedNotebookLM(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded border border-indigo-500/40">
                {subjectName}
              </span>
              <span className="text-xs text-slate-400">• {topic.moduleName}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{topic.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 sm:gap-4 overflow-x-auto text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab("study")}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "study"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Study & Notes
          </button>
          <button
            onClick={() => setActiveTab("quiz")}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "quiz"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Mastery Quiz (Pass ≥ 75%)
          </button>
          <button
            onClick={() => setActiveTab("tutor")}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "tutor"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            AI Tutor Chat
          </button>
          <button
            onClick={() => setActiveTab("multimodal")}
            className={`py-3 px-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "multimodal"
                ? "border-indigo-600 text-indigo-700 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Video className="w-4 h-4 text-rose-500" />
            YouTube, Audio & NotebookLM
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: STUDY & NOTES */}
          {activeTab === "study" && (
            <div className="space-y-6">
              {/* Overview & Key Concepts */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Topic Overview</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                    Est. {topic.estimatedMinutes} mins
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{topic.description}</p>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Core Concepts to Master:</p>
                  <div className="flex flex-wrap gap-2">
                    {topic.keyConcepts.map((concept, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 bg-white text-slate-800 rounded-lg border border-slate-200 shadow-2xs"
                      >
                        ✓ {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Freeform Notes Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    My Personal Topic Notes
                  </label>
                  {savedNotesMessage && (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Notes Saved!
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your study notes, key takeaways, formulas, or questions here..."
                  className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white font-mono leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
              </div>

              {/* Call to action for Quiz */}
              <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Ready to complete this topic?
                  </h4>
                  <p className="text-xs text-slate-700 mt-0.5">
                    Answer 4-5 high-yield MCQs. Scoring <strong>≥ 75%</strong> unlocks topic completion and schedules your
                    Ebbinghaus forgetting curve revisions!
                  </p>
                </div>
                <button
                  id="btn-goto-quiz"
                  onClick={() => setActiveTab("quiz")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-all"
                >
                  Start Mastery Quiz
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MASTERY QUIZ */}
          {activeTab === "quiz" && (
            <div className="space-y-6">
              {isLoadingQuiz ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    Generating conceptual mastery questions for "{topic.title}"...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-700">
                      Mastery Threshold: <strong className="text-indigo-600">75%</strong>
                    </span>
                    <span className="text-slate-700">
                      Answered: {Object.keys(userAnswers).length} of {questions.length}
                    </span>
                  </div>

                  {/* Question Cards */}
                  <div className="space-y-4">
                    {questions.map((q, qIdx) => {
                      const selectedOpt = userAnswers[qIdx];
                      const isCorrect = selectedOpt === q.correctOptionIndex;

                      return (
                        <div
                          key={q.id || qIdx}
                          className={`p-4 rounded-xl border transition-all ${
                            quizSubmitted
                              ? isCorrect
                                ? "border-emerald-300 bg-emerald-50/40"
                                : "border-rose-300 bg-rose-50/40"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900 mb-3">
                            <span className="text-indigo-600 font-bold mr-1">Q{qIdx + 1}.</span> {q.question}
                          </p>

                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedOpt === optIdx;
                              let optStyle = "border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800";

                              if (quizSubmitted) {
                                if (optIdx === q.correctOptionIndex) {
                                  optStyle = "border-emerald-500 bg-emerald-100 text-emerald-900 font-semibold";
                                } else if (isSelected && !isCorrect) {
                                  optStyle = "border-rose-400 bg-rose-100 text-rose-900 font-medium";
                                } else {
                                  optStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60";
                                }
                              } else if (isSelected) {
                                optStyle = "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold shadow-2xs";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={quizSubmitted}
                                  onClick={() => handleSelectOption(qIdx, optIdx)}
                                  className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${optStyle}`}
                                >
                                  <span>
                                    <strong className="mr-2">{String.fromCharCode(65 + optIdx)}.</strong>
                                    {opt}
                                  </span>
                                  {quizSubmitted && optIdx === q.correctOptionIndex && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  )}
                                  {quizSubmitted && isSelected && !isCorrect && (
                                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && q.explanation && (
                            <div className="mt-3 p-2.5 rounded-lg bg-slate-100/90 border border-slate-200 text-[11px] text-slate-700">
                              💡 <strong>Key Explanation:</strong> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submission and Result Bar */}
                  {quizSubmitted ? (
                    <div
                      className={`p-5 rounded-xl border text-center space-y-3 ${
                        (quizScore || 0) >= 75
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="flex justify-center">
                        {(quizScore || 0) >= 75 ? (
                          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-base font-bold">
                          {(quizScore || 0) >= 75 ? "🎉 Topic Mastered!" : "Almost there! Needs Review"}
                        </h3>
                        <p className="text-xs mt-1">
                          You scored <strong>{quizScore}%</strong> (Passing threshold: 75%).
                          {(quizScore || 0) >= 75
                            ? " Topic marked complete! Your Ebbinghaus Spaced Repetitions (Day +1, +3, +7, +14, +30) are now active in the calendar."
                            : " To ensure durable long-term retention, please review the explanations above and retry the quiz."}
                        </p>
                      </div>

                      <div className="flex justify-center gap-3 pt-2">
                        {(quizScore || 0) < 75 ? (
                          <button
                            onClick={handleRetryQuiz}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry Quiz
                          </button>
                        ) : (
                          <button
                            onClick={onClose}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                          >
                            Done & Return to Today's Focus
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        id="btn-submit-quiz"
                        disabled={Object.keys(userAnswers).length < questions.length}
                        onClick={handleSubmitQuiz}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Submit & Evaluate ({Object.keys(userAnswers).length}/{questions.length} answered)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 3: AI STUDY TUTOR */}
          {activeTab === "tutor" && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Punctual & Precise AI Tutor:</strong> Optimized to give direct, bite-sized clarity with zero fluff.
                </span>
              </div>

              {/* Chat Thread */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 min-h-[260px] max-h-[380px] overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                          : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-2xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-700 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      Thinking precisely...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  placeholder="Ask any question about this topic (e.g. 'Can you give an intuition in 2 sentences?')..."
                  className="flex-1 text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                />
                <button
                  disabled={!chatInput.trim() || isChatLoading}
                  onClick={handleSendChatMessage}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-MODAL LEARNING (YOUTUBE, NOTEBOOKLM, AUDIO TTS) */}
          {activeTab === "multimodal" && (
            <div className="space-y-6">
              {/* Feature 1: Built-in Audio Synthesizer (TTS) */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Hands-Free Audio Synthesizer</h4>
                      <p className="text-[11px] text-slate-700">Listen while commuting or multitasking</p>
                    </div>
                  </div>
                  <button
                    onClick={togglePlayAudio}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                      isPlayingAudio
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Listen Aloud
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-indigo-100/60">
                  {resources?.audioScript ||
                    `"${topic.title} in ${subjectName}: Focus on ${topic.keyConcepts.join(
                      ", "
                    )}. Active repetition cements this into long-term cortex storage."`}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1">
                  <span className="flex items-center gap-1">
                    Speed:
                    {[0.8, 1.0, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpeechRate(rate)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          speechRate === rate ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </span>
                  <span className="text-slate-700 italic">Built-in Web Speech API (zero latency)</span>
                </div>
              </div>

              {/* Feature 2: Google NotebookLM Export Integration */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      NLM
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Google NotebookLM Study Dossier</h4>
                      <p className="text-[11px] text-slate-700">One-click copy for NotebookLM Deep Dive podcast</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="https://notebooklm.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>Open NotebookLM</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={handleCopyNotebookLM}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                    >
                      {copiedNotebookLM ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Dossier
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {resources?.notebookLmDossier ||
                    `# ${topic.title}\nSubject: ${subjectName}\nKey Concepts:\n${topic.keyConcepts
                      .map((c) => `- ${c}`)
                      .join("\n")}`}
                </div>
                <p className="text-[11px] text-slate-700">
                  Tip: In NotebookLM, paste this as a new text source and click <strong>"Audio Overview"</strong> to generate a 2-host deep-dive discussion of your topic!
                </p>
              </div>

              {/* Feature 3: Curated YouTube Learning Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-600" />
                  Recommended Visual YouTube Lectures
                </h4>

                {isLoadingResources ? (
                  <div className="py-6 text-center text-xs text-slate-700">Finding top video explanations...</div>
                ) : (
                  <div className="space-y-2">
                    {resources?.youtubeSuggestions?.map((yt, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{yt.title}</p>
                          <p className="text-[11px] text-slate-700">
                            {yt.channel} • {yt.duration} — <span className="italic">{yt.reason}</span>
                          </p>
                        </div>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(yt.searchQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Watch</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )) || (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{topic.title} Crash Course</p>
                          <p className="text-[11px] text-slate-700">Visual explanation and problem breakdown</p>
                        </div>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                            `${subjectName} ${topic.title} tutorial`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold"
                        >
                          <span>Search YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
