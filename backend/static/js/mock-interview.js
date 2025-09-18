document.addEventListener('DOMContentLoaded', () => {
    // --- STATE VARIABLES ---
    let selectedCategory = null;
    let savedResumeText = null;
    let questionList = [];
    let currentQuestionIndex = 0;
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // --- DOM ELEMENTS ---
    const categoryCards = document.querySelectorAll('.interview-type-card');
    const quickPracticeBtn = document.getElementById('quick-practice-btn');
    const personalizedPracticeBtn = document.getElementById('personalized-practice-btn');
    const resumeInput = document.getElementById('resume-input-interview');
    const selectionPrompt = document.getElementById('selection-prompt');
    const interviewSetupSection = document.getElementById('interview-setup');
    const interviewSessionSection = document.getElementById('interview-session');
    const questionText = document.getElementById('question-text');
    const statusText = document.getElementById('status-text');
    const recordButton = document.getElementById('record-button');
    const feedbackArea = document.getElementById('feedback-area');
    const nextQuestionBtn = document.getElementById('next-question-btn');

    // --- GENERIC QUESTION BANK ---
    const questionBank = {
        technical: ["What is a REST API?", "Explain Object-Oriented Programming."],
        behavioral: ["Tell me about a time you worked with a difficult team member.", "What is your greatest achievement?"],
        hr: ["Why do you want to work for this company?", "Where do you see yourself in five years?"]
    };

    // --- INITIALIZATION ---
    savedResumeText = sessionStorage.getItem('savedResumeText');
    if (savedResumeText) {
        selectionPrompt.textContent = "Your resume is loaded! Select a category to start a personalized interview.";
        personalizedPracticeBtn.textContent = "✨ Start Personalized Interview";
    }

    // --- EVENT LISTENERS ---
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedCategory = card.dataset.category;
            categoryCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectionPrompt.textContent = `Selected: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}. Choose your practice mode.`;
            quickPracticeBtn.disabled = false;
            personalizedPracticeBtn.disabled = false;
        });
    });

    quickPracticeBtn.addEventListener('click', () => {
        const questions = questionBank[selectedCategory] || [];
        startInterview(questions);
    });

    personalizedPracticeBtn.addEventListener('click', () => {
        if (!selectedCategory) {
            selectionPrompt.textContent = "Please select a category first!";
            return;
        }
        if (savedResumeText) {
            getPersonalizedQuestionsFromText(savedResumeText);
        } else {
            resumeInput.click();
        }
    });

    resumeInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) getPersonalizedQuestionsFromFile(file);
    });

    recordButton.addEventListener('click', () => {
        if (isRecording) stopRecording();
        else startRecording();
    });
    
    nextQuestionBtn.addEventListener('click', () => askNextQuestion());

    // --- QUESTION & INTERVIEW FLOW FUNCTIONS ---
    function getPersonalizedQuestionsFromFile(resumeFile) {
        const formData = new FormData();
        formData.append('resume', resumeFile);
        selectionPrompt.textContent = "Analyzing resume to generate questions...";
        fetch('/generate-questions', { method: 'POST', body: formData })
        .then(response => response.json())
        .then(handleQuestionResponse)
        .catch(handleQuestionError);
    }
    
    function getPersonalizedQuestionsFromText(resumeText) {
        selectionPrompt.textContent = "Generating questions from your saved resume...";
        fetch('/generate-questions-from-text', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ resume_text: resumeText }),
        })
        .then(response => response.json())
        .then(handleQuestionResponse)
        .catch(handleQuestionError);
    }
    
    function handleQuestionResponse(data) {
        if (data.error) {
            selectionPrompt.textContent = `Error: ${data.error}. Starting with quick practice.`;
            startInterview(questionBank[selectedCategory]);
            return;
        }
        const questions = JSON.parse(data.questions);
        const combinedQuestions = [
            ...(questions.behavioral_questions || []),
            ...(questions.technical_questions || []),
            ...(questions.project_questions || [])
        ];
        startInterview(combinedQuestions);
    }

    function handleQuestionError(error) {
        console.error(error);
        selectionPrompt.textContent = "Error generating questions. Starting with quick practice.";
        startInterview(questionBank[selectedCategory]);
    }

    function startInterview(questions) {
        if (!questions || questions.length === 0) {
            selectionPrompt.textContent = "No questions available for this category.";
            return;
        }
        questionList = questions.sort(() => 0.5 - Math.random()).slice(0, 5);
        currentQuestionIndex = 0;
        interviewSetupSection.style.display = 'none';
        interviewSessionSection.style.display = 'block';
        askNextQuestion();
    }

    function askNextQuestion() {
        feedbackArea.innerHTML = '';
        nextQuestionBtn.style.display = 'none';
        recordButton.style.display = 'inline-block';
        recordButton.disabled = false;
        recordButton.textContent = '🎤 Record Answer';

        if (currentQuestionIndex < questionList.length) {
            const question = questionList[currentQuestionIndex];
            questionText.textContent = question;
            statusText.textContent = `Question ${currentQuestionIndex + 1} of ${questionList.length}. Click to record.`;
            speak(question);
            currentQuestionIndex++;
        } else {
            statusText.textContent = "Interview complete! Great work.";
            questionText.textContent = "You've finished the session!";
            recordButton.style.display = 'none';
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }

    // --- AUDIO RECORDING & ANALYSIS LOGIC ---
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                if (audioBlob.size > 1000) sendAudioToServer(audioBlob);
                else {
                    statusText.textContent = "Recording was too short. Please try again.";
                }
            };
            audioChunks = [];
            mediaRecorder.start();
            isRecording = true;
            statusText.textContent = "Recording... Click to stop."
            recordButton.textContent = '🛑 Stop Recording';
        } catch (error) { statusText.textContent = "Could not access microphone."; }
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
            statusText.textContent = "Recording stopped. Processing answer...";
            recordButton.disabled = true;
        }
    }

    function sendAudioToServer(audioBlob) {
        const formData = new FormData();
        const question = questionList[currentQuestionIndex - 1];
        formData.append('audio', audioBlob, 'interview_answer.webm');
        formData.append('question', question);
        statusText.textContent = "Analyzing your answer with AI...";
        fetch('/interview-answer', { method: 'POST', body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                feedbackArea.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                const analysis = JSON.parse(data.analysis);
                let formattedResponse = `
                    <h4>Feedback on Your Answer</h4>
                    <p><b>Overall Score: ${analysis.overall_score} / 10</b></p>
                    <p><em>Your answer: "${analysis.transcribed_text}"</em></p>
                    <p><b>Detailed Feedback:</b></p>
                    <div class="feedback-content">${marked.parse(analysis.overall_feedback)}</div>
                `;
                feedbackArea.innerHTML = formattedResponse;
                statusText.textContent = "Analysis complete. Ready for the next question."
            }
            nextQuestionBtn.style.display = 'inline-block';
            recordButton.style.display = 'none';
        }).catch(error => {
            feedbackArea.innerHTML = `<p>Error connecting to server.</p>`;
            nextQuestionBtn.style.display = 'inline-block';
            recordButton.style.display = 'none';
        });
    }
});