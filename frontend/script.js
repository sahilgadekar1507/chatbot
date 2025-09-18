document.addEventListener('DOMContentLoaded', () => {
    // STATE VARIABLES
    let savedResumeText = null;
    let questionList = [];
    let currentQuestionIndex = 0;
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // DOM Elements
    const uploadButton = document.getElementById('upload-button');
    const resumeInput = document.getElementById('resume-input');
    const chatBox = document.getElementById('chat-box');
    const mainMenu = document.getElementById('main-menu');
    const personalizedInterviewSection = document.getElementById('personalized-interview-section');
    const personalizedInterviewButton = document.getElementById('personalized-interview-button');
    const interviewSection = document.getElementById('interview-section');
    const questionText = document.getElementById('question-text');
    const recordButton = document.getElementById('record-button');
    const backSection = document.getElementById('back-section');
    const backButton = document.getElementById('back-button');

    // --- EVENT LISTENERS ---
    uploadButton.addEventListener('click', () => resumeInput.click());
    resumeInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) uploadResume(file);
    });

    personalizedInterviewButton.addEventListener('click', () => {
        if (savedResumeText) {
            getPersonalizedQuestions(savedResumeText);
        } else {
            addMessage("Please analyze a resume first.", "bot-message");
        }
    });
    
    backButton.addEventListener('click', () => {
        mainMenu.style.display = 'flex';
        backSection.style.display = 'none';
        addMessage("What would you like to do next?", "bot-message");
    });
    
    recordButton.addEventListener('click', () => {
        if (isRecording) stopRecording();
        else startRecording();
    });

    // --- RESUME ANALYSIS ---
    function uploadResume(file) {
        const formData = new FormData();
        formData.append('resume', file);
        addMessage("Analyzing your resume... please wait.", "bot-message");
        fetch('http://127.0.0.1:5000/analyze-resume', {
            method: 'POST', body: formData,
        })
        .then(response => response.json()).then(data => {
            if (data.error) { addMessage(`Error: ${data.error}`, 'bot-message');
            } else {
                savedResumeText = data.full_text;
                const analysis = data.analysis;
                let formattedResponse = `<p><strong>Analysis Complete! Here are the results:</strong></p>` + renderJsonAsHtml(analysis);
                addMessage(formattedResponse, 'bot-message');
                mainMenu.style.display = 'none';
                personalizedInterviewSection.style.display = 'block';
                backSection.style.display = 'block';
            }
        }).catch(error => { addMessage('An error occurred while connecting to the server.', "bot-message"); });
    }

    // --- INTERVIEW LOGIC ---
    function getPersonalizedQuestions(resumeText) {
        mainMenu.style.display = 'none';
        addMessage("Generating personalized questions based on your resume...", "bot-message");
        fetch('http://127.0.0.1:5000/generate-questions-from-text', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({ resume_text: resumeText }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                addMessage(`Error: ${data.error}`, 'bot-message');
            } else {
                const questions = JSON.parse(data.questions.replace(/^```json\s*/, '').replace(/```$/, ''));
                questionList = [
                    ...(questions.behavioral_questions || []),
                    ...(questions.technical_questions || []),
                    ...(questions.project_questions || [])
                ].sort(() => Math.random() - 0.5).slice(0, 5);
                
                currentQuestionIndex = 0;
                if (questionList.length > 0) {
                    addMessage("Great, I have prepared your personalized questions. Let's begin!", "bot-message");
                    askNextQuestion();
                } else {
                    addMessage("I couldn't generate specific questions from this resume.", "bot-message");
                    mainMenu.style.display = 'flex';
                }
            }
        })
        .catch(error => {
            addMessage('An error occurred during question generation.', 'bot-message');
        });
    }

    function askNextQuestion() {
        if (currentQuestionIndex < questionList.length) {
            const question = questionList[currentQuestionIndex];
            mainMenu.style.display = 'none';
            backSection.style.display = 'none';
            interviewSection.style.display = 'block';
            questionText.textContent = question;
            speak(question);
            currentQuestionIndex++;
        } else {
            addMessage("That's all the questions! You did great. Click 'Back' to return to the menu.", "bot-message");
            interviewSection.style.display = 'none';
            backSection.style.display = 'block';
        }
    }

    // --- AUDIO RECORDING & SENDING ---
    function sendAudioToServer(audioBlob) {
        const formData = new FormData();
        const question = questionList[currentQuestionIndex - 1];
        formData.append('audio', audioBlob, 'interview_answer.webm');
        formData.append('question', question);
        addMessage("Sending your answer for analysis...", "bot-message");
        fetch('http://127.0.0.1:5000/interview-answer', {
            method: 'POST', body: formData,
        })
        .then(response => response.json()).then(data => {
            if (data.error) {
                addMessage(`Error: ${data.error}`, 'bot-message');
            } else {
                const rawAnalysis = data.analysis;
                const jsonStart = rawAnalysis.indexOf('{');
                const jsonEnd = rawAnalysis.lastIndexOf('}');
                const jsonString = rawAnalysis.substring(jsonStart, jsonEnd + 1);
                try {
                    const analysis = JSON.parse(jsonString);
                    let formattedResponse = `
                        <p><strong>Interview Feedback:</strong></p>
                        <h3>Overall Score: ${analysis.overall_score} / 10</h3>
                        <p><em>Your transcribed answer: "${analysis.transcribed_text}"</em></p>
                        <p><strong>Feedback:</strong></p><pre>${analysis.overall_feedback}</pre>
                    `;
                    addMessage(formattedResponse, 'bot-message');
                } catch(e) {
                     addMessage(`Received an invalid response from the AI. Raw text: ${rawAnalysis}`, 'bot-message');
                }
            }
            askNextQuestion();
        }).catch(error => {
            addMessage('Error: Could not send audio to the server.', 'bot-message');
            askNextQuestion();
        });
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                if (audioBlob.size > 1000) { sendAudioToServer(audioBlob);
                } else { addMessage("Recording was too short, please try again.", "bot-message"); }
            };
            audioChunks = [];
            mediaRecorder.start();
            isRecording = true;
            recordButton.textContent = '🛑 Stop Recording';
        } catch (error) { addMessage("Could not access microphone. Please check permissions.", "bot-message");}
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.textContent = '🎤 Record Answer Again';
        }
    }

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
    
    // --- DYNAMIC RENDERER & HELPER ---
    function renderJsonAsHtml(data) {
        if (typeof data !== 'object' || data === null) { return document.createTextNode(data).textContent; }
        if (Array.isArray(data)) {
            let listItems = data.map(item => `<li>${renderJsonAsHtml(item)}</li>`).join('');
            return `<ul>${listItems}</ul>`;
        }
        let objectItems = Object.entries(data).map(([key, value]) => {
            return `<li><strong>${key}:</strong> ${renderJsonAsHtml(value)}</li>`;
        }).join('');
        return `<ul>${objectItems}</ul>`;
    }
    
    function addMessage(content, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        messageElement.innerHTML = content;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});