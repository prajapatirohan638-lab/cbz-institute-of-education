/* =========================================================
   CBZ INSTITUTE OF EDUCATION
   FRESH WEBSITE JAVASCRIPT
   ========================================================= */


/* =========================================================
   BASIC DATA
========================================================= */

const CLASSES = [
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12"
];


const SUBJECTS = {
    Mathematics: "📐",
    Physics: "⚛️",
    Chemistry: "🧪",
    Biology: "🧬",
    Geography: "🌍",
    History: "📜",
    English: "📖"
};


/* =========================================================
   GENERAL HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showElement(id) {

    const element = document.getElementById(id);

    if (element) {
        element.classList.remove("hidden");
    }
}


function hideElement(id) {

    const element = document.getElementById(id);

    if (element) {
        element.classList.add("hidden");
    }
}


function openModal(id) {

    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add("active");
    }
}


function closeModal(id) {

    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("active");
    }
}


/* =========================================================
   STUDENT LOGIN / REGISTER
========================================================= */

function openStudentLogin() {

    closeModal("studentRegisterModal");
    openModal("studentLoginModal");
}


function openAdminLogin() {

    openModal("adminLoginModal");
}


function switchToRegister() {

    closeModal("studentLoginModal");
    openModal("studentRegisterModal");
}


function switchToLogin() {

    closeModal("studentRegisterModal");
    openModal("studentLoginModal");
}


/* =========================================================
   STUDENT REGISTRATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const registerForm =
        document.getElementById("studentRegisterForm");

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const name =
                    document.getElementById("registerName").value.trim();

                const phone =
                    document.getElementById("registerPhone").value.trim();

                const pin =
                    document.getElementById("registerPin").value.trim();

                const studentClass =
                    document.getElementById("registerClass").value;

                const location =
                    document.getElementById("registerLocation").value.trim();

                const message =
                    document.getElementById("registerMessage");


                if (!/^\d{10}$/.test(phone)) {

                    message.textContent =
                        "Please enter a valid 10-digit mobile number.";

                    return;
                }


                if (!/^\d{4}$/.test(pin)) {

                    message.textContent =
                        "PIN must contain exactly 4 digits.";

                    return;
                }


                if (!name || !studentClass || !location) {

                    message.textContent =
                        "Please fill all the details.";

                    return;
                }


                const student = {
                    name: name,
                    phone: phone,
                    pin: pin,
                    className: studentClass,
                    location: location
                };


                localStorage.setItem(
                    "cbzStudent_" + phone,
                    JSON.stringify(student)
                );


                localStorage.setItem(
                    "cbzCurrentStudent",
                    phone
                );


                message.textContent =
                    "Profile created successfully!";


                setTimeout(function () {

                    closeModal("studentRegisterModal");

                    openStudentDashboard();

                }, 700);

            }
        );
    }


    /* =====================================================
       STUDENT LOGIN
    ===================================================== */

    const loginForm =
        document.getElementById("studentLoginForm");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                const phone =
                    document.getElementById("loginPhone").value.trim();

                const pin =
                    document.getElementById("loginPin").value.trim();

                const message =
                    document.getElementById("loginMessage");


                const savedStudent =
                    localStorage.getItem(
                        "cbzStudent_" + phone
                    );


                if (!savedStudent) {

                    message.textContent =
                        "Student profile not found. Please create a profile first.";

                    return;
                }


                const student =
                    JSON.parse(savedStudent);


                if (student.pin !== pin) {

                    message.textContent =
                        "Incorrect PIN.";

                    return;
                }


                localStorage.setItem(
                    "cbzCurrentStudent",
                    phone
                );


                message.textContent =
                    "Login successful!";


                setTimeout(function () {

                    closeModal("studentLoginModal");

                    openStudentDashboard();

                }, 500);

            }
        );
    }


    /* =====================================================
       ADMIN LOGIN
    ===================================================== */

    const adminForm =
        document.getElementById("adminLoginForm");


    if (adminForm) {

        adminForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                const username =
                    document.getElementById("adminUsername").value.trim();

                const password =
                    document.getElementById("adminPassword").value.trim();

                const message =
                    document.getElementById("adminLoginMessage");


                if (
                    username === "admin" &&
                    password === "1234"
                ) {

                    localStorage.setItem(
                        "cbzAdminLoggedIn",
                        "true"
                    );


                    message.textContent =
                        "Login successful!";


                    setTimeout(function () {

                        closeModal("adminLoginModal");

                        openAdminDashboard();

                    }, 500);

                } else {

                    message.textContent =
                        "Incorrect username or password.";

                }

            }
        );
    }


    /* =====================================================
       NOTES CLASS SELECTOR
    ===================================================== */

    const notesClass =
        document.getElementById("notesClass");


    if (notesClass) {

        notesClass.addEventListener(
            "change",
            function () {

                const className = this.value;

                const selectedText =
                    document.getElementById("selectedClassText");

                const subjectContainer =
                    document.getElementById("notesSubjects");

                const pdfContainer =
                    document.getElementById("pdfNotes");


                if (!className) {

                    selectedText.textContent = "";

                    subjectContainer.innerHTML = "";

                    pdfContainer.style.display = "none";

                    return;
                }


                selectedText.textContent =
                    className + " — Select a Subject";


                pdfContainer.style.display = "none";

                renderNotesSubjects(className);

            }
        );
    }


    /* =====================================================
       RESTORE LOGIN SESSION
    ===================================================== */

    restoreSession();

});


/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function openStudentDashboard() {

    const phone =
        localStorage.getItem("cbzCurrentStudent");


    if (!phone) {

        openStudentLogin();

        return;
    }


    const savedStudent =
        localStorage.getItem(
            "cbzStudent_" + phone
        );


    if (!savedStudent) {

        openStudentLogin();

        return;
    }


    const student =
        JSON.parse(savedStudent);


    hideElement("homePage");
    hideElement("adminDashboard");
    hideElement("generalSection");

    document.getElementById("notesSection").style.display = "none";


    showElement("studentDashboard");


    const nameElement =
        document.getElementById("studentDashboardName");


    if (nameElement) {

        nameElement.textContent =
            student.name;
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function studentLogout() {

    localStorage.removeItem(
        "cbzCurrentStudent"
    );


    hideElement("studentDashboard");

    document.getElementById("notesSection").style.display = "none";

    hideElement("generalSection");

    showElement("homePage");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function openAdminDashboard() {

    hideElement("homePage");
    hideElement("studentDashboard");
    hideElement("generalSection");

    document.getElementById("notesSection").style.display = "none";


    showElement("adminDashboard");


    document.getElementById(
        "adminContentSection"
    ).classList.add("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function adminLogout() {

    localStorage.removeItem(
        "cbzAdminLoggedIn"
    );


    hideElement("adminDashboard");

    showElement("homePage");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SESSION RESTORE
========================================================= */

function restoreSession() {

    const adminLoggedIn =
        localStorage.getItem("cbzAdminLoggedIn");


    const studentLoggedIn =
        localStorage.getItem("cbzCurrentStudent");


    if (adminLoggedIn === "true") {

        openAdminDashboard();

        return;
    }


    if (studentLoggedIn) {

        const savedStudent =
            localStorage.getItem(
                "cbzStudent_" + studentLoggedIn
            );


        if (savedStudent) {

            openStudentDashboard();

        }

    }

}


/* =========================================================
   GENERAL SECTION
========================================================= */

function openGeneral(titleHtml) {

    hideElement("homePage");
    hideElement("studentDashboard");
    hideElement("adminDashboard");

    document.getElementById("notesSection").style.display = "none";


    showElement("generalSection");


    const content =
        document.getElementById("generalContent");


    content.innerHTML =
        titleHtml;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function closeGeneralSection() {

    hideElement("generalSection");

    document.getElementById("notesSection").style.display = "none";


    const studentLoggedIn =
        localStorage.getItem("cbzCurrentStudent");


    if (studentLoggedIn) {

        showElement("studentDashboard");

    } else {

        showElement("homePage");

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   NOTES
========================================================= */

function openNotes() {

    hideElement("studentDashboard");
    hideElement("generalSection");


    document.getElementById(
        "notesSection"
    ).style.display = "block";


    document.getElementById(
        "notesClass"
    ).value = "";


    document.getElementById(
        "selectedClassText"
    ).textContent = "";


    document.getElementById(
        "notesSubjects"
    ).innerHTML = "";


    document.getElementById(
        "pdfNotes"
    ).style.display = "none";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function renderNotesSubjects(className) {

    const container =
        document.getElementById("notesSubjects");


    container.innerHTML = "";


    Object.keys(SUBJECTS).forEach(function (subject) {

        const card =
            document.createElement("div");


        card.className =
            "notes-subject-card";


        card.innerHTML = `

            <div class="subject-icon">
                ${SUBJECTS[subject]}
            </div>

            <h3>
                ${escapeHtml(subject)}
            </h3>

        `;


        card.addEventListener(
            "click",
            function () {

                loadNotes(
                    className,
                    subject
                );

            }
        );


        container.appendChild(card);

    });

}


async function loadNotes(
    className,
    subject
) {

    const pdfContainer =
        document.getElementById("pdfNotes");


    pdfContainer.style.display = "block";


    pdfContainer.innerHTML = `

        <div class="loading">
            Loading ${escapeHtml(subject)} notes...
        </div>

    `;


    try {

        const response =
            await fetch(
                `/get-notes/${encodeURIComponent(className)}/${encodeURIComponent(subject)}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message || "Unable to load notes."
            );

        }


        renderPdfList(
            pdfContainer,
            `${SUBJECTS[subject]} ${subject} Notes`,
            data.files,
            "No study material is available for this subject yet."
        );


    } catch (error) {

        pdfContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    Unable to load notes
                </h3>

                <p>
                    Please make sure the Flask server is running.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   GENERIC PDF LIST
========================================================= */

function renderPdfList(
    container,
    title,
    files,
    emptyMessage
) {

    if (!files || files.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No material available
                </h3>

                <p>
                    ${escapeHtml(emptyMessage)}
                </p>

            </div>

        `;

        return;
    }


    let html = `

        <div class="general-title">

            <span>
                AVAILABLE MATERIALS
            </span>

            <h1>
                ${escapeHtml(title)}
            </h1>

            <p>
                ${files.length} PDF${files.length === 1 ? "" : "s"} available
            </p>

        </div>

        <div class="admin-list">

    `;


    files.forEach(function (file) {

        html += `

            <div class="admin-list-item">

                <div>

                    <h3>
                        📄 ${escapeHtml(file.name)}
                    </h3>

                    <p>
                        PDF Study Material
                    </p>

                </div>

                <div class="admin-item-actions">

                    <a
                        href="${escapeHtml(file.path)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="open-pdf"
                    >
                        📖 Open
                    </a>

                    <a
                        href="${escapeHtml(file.path)}"
                        download
                        class="download-pdf"
                    >
                        ⬇️ Download
                    </a>

                </div>

            </div>

        `;

    });


    html += `
        </div>
    `;


    container.innerHTML = html;
}


/* =========================================================
   MOCK TESTS
========================================================= */

let mockTestsCache = [];

let currentMockTest = null;
let currentMockAnswers = [];
let mockTimer = null;
let mockTimeLeft = 0;

let lastScore = 0;
let lastTotal = 0;
let lastPercentage = 0;
let lastAnswered = 0;


/* LOAD TESTS FROM FLASK SERVER */

async function loadMockTestsFromServer() {

    try {

        const response = await fetch("/api/mock-tests");

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load mock tests."
            );
        }

        mockTestsCache = Array.isArray(data.tests)
            ? data.tests
            : [];

        return mockTestsCache;

    } catch (error) {

        console.error(
            "Mock tests loading error:",
            error
        );

        mockTestsCache = [];

        return [];

    }

}


/* OPEN MOCK TESTS */

async function openMockTests() {

    openGeneral(`

        <div class="general-title">

            <span>
                PRACTICE
            </span>

            <h1>
                📝 Mock Tests
            </h1>

            <p>
                Loading available tests...
            </p>

        </div>

        <div class="loading">
            Please wait...
        </div>

    `);


    await loadMockTestsFromServer();


    renderMockClassSelection();

}


/* CLASS SELECTION */

function renderMockClassSelection() {

    openGeneral(`

        <div class="general-title">

            <span>
                PRACTICE
            </span>

            <h1>
                📝 Mock Tests
            </h1>

            <p>
                Select your class.
            </p>

        </div>

        <div
            class="choice-grid"
            id="mockClassGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "mockClassGrid"
        );


    CLASSES.forEach(function (className) {

        const card =
            document.createElement("div");


        card.className =
            "choice-card";


        card.textContent =
            className;


        card.onclick =
            function () {

                showMockSubjects(
                    className
                );

            };


        grid.appendChild(card);

    });

}


/* SUBJECT SELECTION */

function showMockSubjects(className) {

    openGeneral(`

        <button
            class="back-btn"
            onclick="renderMockClassSelection()"
        >
            ← Back
        </button>


        <div class="general-title">

            <span>
                ${escapeHtml(className)}
            </span>

            <h1>
                Choose a Subject
            </h1>

            <p>
                Select the subject for your practice test.
            </p>

        </div>


        <div
            class="choice-grid"
            id="mockSubjectGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "mockSubjectGrid"
        );


    Object.keys(SUBJECTS).forEach(
        function (subject) {

            const card =
                document.createElement("div");


            card.className =
                "choice-card";


            card.innerHTML =
                `${SUBJECTS[subject]} ${escapeHtml(subject)}`;


            card.onclick =
                function () {

                    showMockTestList(
                        className,
                        subject
                    );

                };


            grid.appendChild(card);

        }
    );

}


/* TEST LIST */

function showMockTestList(
    className,
    subject
) {

    const tests =
        mockTestsCache.filter(
            function (test) {

                return (
                    test.className === className &&
                    test.subject === subject
                );

            }
        );


    openGeneral(`

        <button
            class="back-btn"
            onclick="showMockSubjects('${escapeHtml(className)}')"
        >
            ← Back to Subjects
        </button>


        <div class="general-title">

            <span>
                ${escapeHtml(className)}
            </span>

            <h1>
                ${SUBJECTS[subject]}
                ${escapeHtml(subject)}
                Tests
            </h1>

            <p>
                Select a test to begin.
            </p>

        </div>


        <div
            class="choice-grid"
            id="mockTestGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "mockTestGrid"
        );


    if (tests.length === 0) {

        grid.innerHTML = `

            <div class="empty-state">

                <h3>
                    No test available
                </h3>

                <p>
                    A test for this subject will be added soon.
                </p>

            </div>

        `;

        return;
    }


    tests.forEach(
        function (test) {

            const card =
                document.createElement("div");


            card.className =
                "choice-card";


            card.innerHTML = `

                <div
                    style="
                        font-size:28px;
                        margin-bottom:8px;
                    "
                >
                    📝
                </div>


                <h3>
                    ${escapeHtml(test.title)}
                </h3>


                <p
                    style="
                        margin:7px 0;
                        color:#70798a;
                        font-size:13px;
                    "
                >
                    ${test.questions.length}
                    Questions
                </p>


                <p
                    style="
                        margin-bottom:8px;
                        color:#70798a;
                        font-size:13px;
                    "
                >
                    ⏱️ ${test.duration || test.questions.length}
                    Minutes
                </p>


                <p
                    style="
                        margin-bottom:12px;
                        color:#70798a;
                        font-size:13px;
                    "
                >
                    ${escapeHtml(
                        test.description || "Practice Test"
                    )}
                </p>


                <button
                    class="primary-btn"
                >
                    Start Test →
                </button>

            `;


            card.onclick =
                function () {

                    startMockTest(
                        className,
                        subject,
                        test.id
                    );

                };


            grid.appendChild(card);

        }
    );

}


/* FIND TEST */

function findMockTest(
    className,
    subject,
    testId
) {

    return mockTestsCache.find(
        function (test) {

            return (
                test.className === className &&
                test.subject === subject &&
                test.id === testId
            );

        }
    );

}


/* START TEST */

function startMockTest(
    className,
    subject,
    testId
) {

    const test =
        findMockTest(
            className,
            subject,
            testId
        );


    if (!test) {

        alert(
            "Test not found."
        );

        return;

    }


    currentMockTest = {

        className:
            className,

        subject:
            subject,

        test:
            test

    };


    currentMockAnswers =
        new Array(
            test.questions.length
        ).fill(-1);


    mockTimeLeft =
        Number(test.duration) > 0
            ? Number(test.duration) * 60
            : test.questions.length * 60;


    openTestQuestions();


    startMockTimer();

}


/* TEST QUESTIONS */

function openTestQuestions() {

    const data =
        currentMockTest;


    let html = `

        <button
            class="back-btn"
            onclick="showMockTestList(
                '${escapeHtml(data.className)}',
                '${escapeHtml(data.subject)}'
            )"
        >
            ← Back to Tests
        </button>


        <div class="general-title">

            <span>
                ${escapeHtml(data.className)}
            </span>

            <h1>
                📝 ${escapeHtml(data.test.title)}
            </h1>

            <p>
                ${data.test.questions.length}
                Questions
            </p>

        </div>


        <div
            class="mock-test-container"
        >

            <div
                class="mock-test-info"
            >

                <div>

                    <strong>
                        ${escapeHtml(data.subject)}
                    </strong>

                    <p>
                        Choose the correct answer.
                    </p>

                </div>


                <div
                    id="testTimer"
                    class="test-timer"
                >
                    00:00
                </div>

            </div>


            <div
                class="mock-test-box"
            >
    `;


    data.test.questions.forEach(
        function (question, index) {

            html += `

                <div
                    class="question-card"
                >

                    <div
                        class="question-number"
                    >
                        Question ${index + 1}
                    </div>


                    <h3>
                        ${escapeHtml(
                            question.question
                        )}
                    </h3>

            `;


            question.options.forEach(
                function (
                    option,
                    optionIndex
                ) {

                    html += `

                        <label
                            class="option-label"
                        >

                            <input
                                type="radio"
                                name="question-${index}"
                                value="${optionIndex}"
                                onchange="saveMockAnswer(
                                    ${index},
                                    ${optionIndex}
                                )"
                            >

                            <span>
                                ${escapeHtml(option)}
                            </span>

                        </label>

                    `;

                }
            );


            html += `

                </div>

            `;

        }
    );


    html += `

                <button
                    class="submit-test-btn"
                    onclick="submitMockTest()"
                >
                    Submit Test
                </button>


            </div>

        </div>

    `;


    openGeneral(html);

}


/* SAVE ANSWER */

function saveMockAnswer(
    questionIndex,
    optionIndex
) {

    currentMockAnswers[
        questionIndex
    ] = optionIndex;

}


/* TIMER */

function startMockTimer() {

    clearInterval(
        mockTimer
    );


    updateMockTimer();


    mockTimer =
        setInterval(
            function () {

                mockTimeLeft--;


                updateMockTimer();


                if (
                    mockTimeLeft <= 0
                ) {

                    clearInterval(
                        mockTimer
                    );


                    submitMockTest(
                        true
                    );

                }

            },
            1000
        );

}


/* UPDATE TIMER */

function updateMockTimer() {

    const timer =
        document.getElementById(
            "testTimer"
        );


    if (!timer) {
        return;
    }


    const minutes =
        Math.floor(
            mockTimeLeft / 60
        );


    const seconds =
        mockTimeLeft % 60;


    timer.textContent =
        String(minutes).padStart(
            2,
            "0"
        )
        +
        ":"
        +
        String(seconds).padStart(
            2,
            "0"
        );

}


/* SUBMIT TEST */

function submitMockTest(
    autoSubmitted = false
) {

    clearInterval(
        mockTimer
    );


    const data =
        currentMockTest;


    if (!data) {
        return;
    }


    let score = 0;
    let answered = 0;


    data.test.questions.forEach(
        function (
            question,
            index
        ) {

            const selected =
                currentMockAnswers[index];


            if (
                selected !== undefined &&
                selected !== -1
            ) {

                answered++;


                if (
                    Number(selected) ===
                    Number(question.answer)
                ) {

                    score++;

                }

            }

        }
    );


    const total =
        data.test.questions.length;


    const percentage =
        total > 0
            ? Math.round(
                (score / total) * 100
            )
            : 0;


    showTestResult(
        score,
        total,
        percentage,
        answered,
        autoSubmitted
    );

}


/* RESULT */

function showTestResult(
    score,
    total,
    percentage,
    answered,
    autoSubmitted
) {

    const data =
        currentMockTest;


    lastScore =
        score;

    lastTotal =
        total;

    lastPercentage =
        percentage;

    lastAnswered =
        answered;


    openGeneral(`

        <div
            class="result-card"
        >

            <div
                class="result-icon"
            >
                🏆
            </div>


            <h2>
                Test Completed
            </h2>


            <p>

                ${
                    autoSubmitted
                    ? "Time is over. Your test was submitted automatically."
                    : "Your test has been submitted successfully."
                }

            </p>


            <div
                class="score-number"
            >
                ${score}/${total}
            </div>


            <div
                class="percentage"
            >
                ${percentage}%
            </div>


            <div
                class="result-stats"
            >

                <div
                    class="result-stat"
                >

                    <strong>
                        ${score}
                    </strong>

                    <span>
                        Correct
                    </span>

                </div>


                <div
                    class="result-stat"
                >

                    <strong>
                        ${total - score}
                    </strong>

                    <span>
                        Incorrect
                    </span>

                </div>


                <div
                    class="result-stat"
                >

                    <strong>
                        ${answered}
                    </strong>

                    <span>
                        Answered
                    </span>

                </div>

            </div>


            <div
                class="result-buttons"
            >

                <button
                    onclick="reviewMockTest()"
                >
                    📖 Review Answers
                </button>


                <button
                    onclick="startMockTest(
                        '${escapeHtml(data.className)}',
                        '${escapeHtml(data.subject)}',
                        '${escapeHtml(data.test.id)}'
                    )"
                >
                    🔄 Retake
                </button>


                <button
                    onclick="showMockTestList(
                        '${escapeHtml(data.className)}',
                        '${escapeHtml(data.subject)}'
                    )"
                >
                    ← Tests
                </button>

            </div>

        </div>

    `);

}


/* REVIEW ANSWERS */

function reviewMockTest() {

    const data =
        currentMockTest;


    if (!data) {
        return;
    }


    let html = `

        <button
            class="back-btn"
            onclick="showTestResultPage()"
        >
            ← Back to Result
        </button>


        <div
            class="general-title"
        >

            <span>
                ANSWER REVIEW
            </span>

            <h1>
                📖 Review Answers
            </h1>

        </div>


        <div
            class="answer-review-container"
        >

    `;


    data.test.questions.forEach(
        function (
            question,
            index
        ) {

            const selectedAnswer =
                currentMockAnswers[index];


            const correct =
                Number(selectedAnswer) ===
                Number(question.answer);


            html += `

                <div
                    class="answer-review ${
                        correct
                        ? "correct"
                        : "wrong"
                    }"
                >

                    <strong>
                        Question ${index + 1}
                    </strong>


                    <p>
                        ${escapeHtml(
                            question.question
                        )}
                    </p>


                    <p>

                        <strong>
                            Your answer:
                        </strong>

                        ${
                            selectedAnswer >= 0
                            ? escapeHtml(
                                question.options[
                                    selectedAnswer
                                ]
                            )
                            : "Not answered"
                        }

                    </p>


                    <p>

                        <strong>
                            Correct answer:
                        </strong>

                        ${escapeHtml(
                            question.options[
                                question.answer
                            ]
                        )}

                    </p>

                </div>

            `;

        }
    );


    html += `

        </div>

    `;


    openGeneral(
        html
    );

}


/* BACK TO RESULT */

function showTestResultPage() {

    showTestResult(
        lastScore,
        lastTotal,
        lastPercentage,
        lastAnswered,
        false
    );

}


/* =========================================================
   SYLLABUS
========================================================= */

function openSyllabus() {

    openGeneral(`

        <div class="general-title">

            <span>
                STUDY PLAN
            </span>

            <h1>
                📘 Syllabus
            </h1>

            <p>
                Select your class.
            </p>

        </div>

        <div
            class="choice-grid"
            id="syllabusClassGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "syllabusClassGrid"
        );


    CLASSES.forEach(function (className) {

        const card =
            document.createElement("div");


        card.className =
            "choice-card";


        card.textContent =
            className;


        card.onclick =
            function () {

                showSyllabusSubjects(
                    className
                );

            };


        grid.appendChild(card);

    });

}


function showSyllabusSubjects(className) {

    openGeneral(`

        <button
            class="back-btn"
            onclick="openSyllabus()"
        >
            ← Back
        </button>

        <div class="general-title">

            <span>
                ${escapeHtml(className)}
            </span>

            <h1>
                Choose a Subject
            </h1>

        </div>

        <div
            class="choice-grid"
            id="syllabusSubjectGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "syllabusSubjectGrid"
        );


    Object.keys(SUBJECTS).forEach(
        function (subject) {

            const card =
                document.createElement("div");


            card.className =
                "choice-card";


            card.innerHTML =
                `${SUBJECTS[subject]} ${escapeHtml(subject)}`;


            card.onclick =
                function () {

                    loadSyllabus(
                        className,
                        subject
                    );

                };


            grid.appendChild(card);

        }
    );

}


async function loadSyllabus(
    className,
    subject
) {

    openGeneral(`

        <div class="loading">
            Loading syllabus...
        </div>

    `);


    try {

        const response =
            await fetch(
                `/get-syllabus/${encodeURIComponent(className)}/${encodeURIComponent(subject)}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error();

        }


        let html = `

            <button
                class="back-btn"
                onclick="showSyllabusSubjects('${escapeHtml(className)}')"
            >
                ← Back to Subjects
            </button>

            <div
                id="syllabusFiles"
            ></div>

        `;


        openGeneral(html);


        renderPdfList(
            document.getElementById("syllabusFiles"),
            `${SUBJECTS[subject]} ${subject} Syllabus`,
            data.files,
            "The syllabus for this subject has not been uploaded yet."
        );


    } catch (error) {

        openGeneral(`

            <div class="empty-state">

                <h3>
                    Unable to load syllabus
                </h3>

                <p>
                    Please make sure the Flask server is running.
                </p>

            </div>

        `);

    }

}


/* =========================================================
   QUESTION PAPERS
========================================================= */

function openQuestionPapers() {

    openGeneral(`

        <div class="general-title">

            <span>
                PRACTICE MATERIAL
            </span>

            <h1>
                📄 Question Papers
            </h1>

            <p>
                Select your class.
            </p>

        </div>

        <div
            class="choice-grid"
            id="paperClassGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "paperClassGrid"
        );


    CLASSES.forEach(function (className) {

        const card =
            document.createElement("div");


        card.className =
            "choice-card";


        card.textContent =
            className;


        card.onclick =
            function () {

                showQuestionPaperSubjects(
                    className
                );

            };


        grid.appendChild(card);

    });

}


function showQuestionPaperSubjects(className) {

    openGeneral(`

        <button
            class="back-btn"
            onclick="openQuestionPapers()"
        >
            ← Back
        </button>

        <div class="general-title">

            <span>
                ${escapeHtml(className)}
            </span>

            <h1>
                Choose a Subject
            </h1>

        </div>

        <div
            class="choice-grid"
            id="paperSubjectGrid"
        ></div>

    `);


    const grid =
        document.getElementById(
            "paperSubjectGrid"
        );


    Object.keys(SUBJECTS).forEach(
        function (subject) {

            const card =
                document.createElement("div");


            card.className =
                "choice-card";


            card.innerHTML =
                `${SUBJECTS[subject]} ${escapeHtml(subject)}`;


            card.onclick =
                function () {

                    loadQuestionPapers(
                        className,
                        subject
                    );

                };


            grid.appendChild(card);

        }
    );

}


async function loadQuestionPapers(
    className,
    subject
) {

    openGeneral(`

        <div class="loading">
            Loading question papers...
        </div>

    `);


    try {

        const response =
            await fetch(
                `/get-question-papers/${encodeURIComponent(className)}/${encodeURIComponent(subject)}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error();

        }


        let html = `

            <button
                class="back-btn"
                onclick="showQuestionPaperSubjects('${escapeHtml(className)}')"
            >
                ← Back to Subjects
            </button>

            <div
                id="questionPaperFiles"
            ></div>

        `;


        openGeneral(html);


        renderPdfList(
            document.getElementById(
                "questionPaperFiles"
            ),
            `${SUBJECTS[subject]} ${subject} Question Papers`,
            data.files,
            "No question paper has been uploaded for this subject yet."
        );


    } catch (error) {

        openGeneral(`

            <div class="empty-state">

                <h3>
                    Unable to load question papers
                </h3>

                <p>
                    Please make sure the Flask server is running.
                </p>

            </div>

        `);

    }

}


/* =========================================================
   HELP DESK
========================================================= */

function openHelpDesk() {

    openGeneral(`

        <div class="general-title">

            <span>
                STUDENT SUPPORT
            </span>

            <h1>
                💬 Help Desk
            </h1>

            <p>
                Need help? Contact CBZ Institute.
            </p>

        </div>


        <div class="contact-details">

            <div class="contact-card">

                <div class="contact-icon">
                    📞
                </div>

                <h3>
                    Call Us
                </h3>

                <p>
                    +91 8981262617
                </p>

                <a
                    class="location-btn"
                    href="tel:+918981262617"
                >
                    Call Now
                </a>

            </div>


            <div class="contact-card">

                <div class="contact-icon">
                    📞
                </div>

                <h3>
                    Alternative Number
                </h3>

                <p>
                    +91 8910883754
                </p>

                <a
                    class="location-btn"
                    href="tel:+918910883754"
                >
                    Call Now
                </a>

            </div>


            <div class="contact-card">

                <div class="contact-icon">
                    📍
                </div>

                <h3>
                    Institute Location
                </h3>

                <a
                    class="location-btn"
                    href="https://maps.app.goo.gl/f6AaTeU72pb9TaBCA"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Open Location
                </a>

            </div>

        </div>

    `);

}


/* =========================================================
   NOTICE BOARD
========================================================= */

async function getNotices() {

    try {

        const response = await fetch("/api/notices");

        const data = await response.json();

        if (data.success) {
            return data.notices || [];
        }

        console.error("Notice API error:", data.message);

        return [];

    } catch (error) {

        console.error("Could not load notices:", error);

        return [];

    }

}

function saveNotices(notices) {

    localStorage.setItem(
        "cbzNotices",
        JSON.stringify(notices)
    );

}


async function openNoticeBoard() {

    const notices =
        await getNotices();

    let html = `

        <div class="general-title">

            <span>
                IMPORTANT UPDATES
            </span>

            <h1>
                📢 Notice Board
            </h1>

            <p>
                Important announcements from CBZ Institute.
            </p>

        </div>

    `;


    if (notices.length === 0) {

        html += `

            <div class="empty-state">

                <h3>
                    No new notices
                </h3>

                <p>
                    There are no important notices at the moment.
                </p>

            </div>

        `;

    } else {

        html += `<div class="notice-box">`;


        notices.forEach(function (notice) {

            html += `

                <div class="notice-item">

                    <strong>
                        ${escapeHtml(notice.title)}
                    </strong>

                    <p>
                        ${escapeHtml(notice.message)}
                    </p>

                </div>

            `;

        });


        html += `</div>`;

    }


    openGeneral(html);

}


/* =========================================================
   PROFILE
========================================================= */

function openProfile() {

    const phone =
        localStorage.getItem(
            "cbzCurrentStudent"
        );


    if (!phone) {

        openStudentLogin();

        return;
    }


    const savedStudent =
        localStorage.getItem(
            "cbzStudent_" + phone
        );


    if (!savedStudent) {

        openStudentLogin();

        return;
    }


    const student =
        JSON.parse(savedStudent);


    openGeneral(`

        <div class="general-title">

            <span>
                STUDENT PROFILE
            </span>

            <h1>
                👤 My Profile
            </h1>

            <p>
                Your saved student information.
            </p>

        </div>


        <div class="result-card">

            <div class="result-icon">
                👤
            </div>

            <h2>
                ${escapeHtml(student.name)}
            </h2>


            <div class="result-stats">

                <div class="result-stat">

                    <strong>
                        📱
                    </strong>

                    <span>
                        ${escapeHtml(student.phone)}
                    </span>

                </div>


                <div class="result-stat">

                    <strong>
                        🎓
                    </strong>

                    <span>
                        ${escapeHtml(student.className)}
                    </span>

                </div>


                <div class="result-stat">

                    <strong>
                        📍
                    </strong>

                    <span>
                        ${escapeHtml(student.location)}
                    </span>

                </div>

            </div>

        </div>

    `);

}


/* =========================================================
   YOUTUBE
========================================================= */

function openYoutube() {

    window.open(
        "https://www.youtube.com/@CBZINSTITUTE",
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   ADMIN SECTION
========================================================= */

function openAdminContent() {

    document
        .getElementById("adminContentSection")
        .classList.remove("hidden");


    document
        .getElementById("adminDashboard")
        .querySelector(".dashboard-grid")
        .classList.add("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function closeAdminContent() {

    document
        .getElementById("adminContentSection")
        .classList.add("hidden");


    document
        .getElementById("adminDashboard")
        .querySelector(".dashboard-grid")
        .classList.remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================================
   ADMIN PDF MANAGER
========================================================= */

function buildAdminDocumentForm(
    type,
    title,
    description,
    uploadEndpoint
) {

    const inputId =
        "adminFileInput";


    const classId =
        "adminDocumentClass";


    const subjectId =
        "adminDocumentSubject";


    const messageId =
        "adminUploadMessage";


    return `

        <div class="admin-panel-title">

            <span>
                ADMIN PANEL
            </span>

            <h1>
                ${escapeHtml(title)}
            </h1>

            <p>
                ${escapeHtml(description)}
            </p>

        </div>


        <div class="admin-form">

            <select id="${classId}">

                <option value="">
                    -- Select Class --
                </option>

                ${CLASSES.map(
                    function (className) {

                        return `
                            <option>
                                ${escapeHtml(className)}
                            </option>
                        `;

                    }
                ).join("")}

            </select>


            <select id="${subjectId}">

                <option value="">
                    -- Select Subject --
                </option>

                ${Object.keys(SUBJECTS).map(
                    function (subject) {

                        return `
                            <option>
                                ${escapeHtml(subject)}
                            </option>
                        `;

                    }
                ).join("")}

            </select>


            <input
                type="file"
                id="${inputId}"
                accept=".pdf,application/pdf"
            >


            <button
                class="primary-btn"
                onclick="uploadAdminPdf(
                    '${escapeHtml(type)}',
                    '${escapeHtml(uploadEndpoint)}'
                )"
            >
                📤 Upload PDF
            </button>


            <p
                id="${messageId}"
                class="form-message"
            ></p>

        </div>


        <div
            id="adminDocumentList"
            class="admin-list"
        >

            <div class="empty-state">

                <h3>
                    Select class and subject
                </h3>

                <p>
                    Existing PDFs will appear here.
                </p>

            </div>

        </div>

    `;

}


function openAdminNotes() {

    openAdminContent();


    document.getElementById(
        "adminContent"
    ).innerHTML =
        buildAdminDocumentForm(
            "notes",
            "📚 Manage Notes",
            "Upload multiple PDF notes directly from your laptop.",
            "/upload-note"
        );


    setupAdminDocumentSelectors(
        "notes"
    );

}


function openAdminSyllabus() {

    openAdminContent();


    document.getElementById(
        "adminContent"
    ).innerHTML =
        buildAdminDocumentForm(
            "syllabus",
            "📘 Manage Syllabus",
            "Upload multiple syllabus PDFs directly from your laptop.",
            "/upload-syllabus"
        );


    setupAdminDocumentSelectors(
        "syllabus"
    );

}


function openAdminQuestionPapers() {

    openAdminContent();


    document.getElementById(
        "adminContent"
    ).innerHTML =
        buildAdminDocumentForm(
            "question-papers",
            "📄 Manage Question Papers",
            "Upload multiple question paper PDFs directly from your laptop.",
            "/upload-question-paper"
        );


    setupAdminDocumentSelectors(
        "question-papers"
    );

}


function setupAdminDocumentSelectors(type) {

    const classSelect =
        document.getElementById(
            "adminDocumentClass"
        );


    const subjectSelect =
        document.getElementById(
            "adminDocumentSubject"
        );


    async function load() {

        const className =
            classSelect.value;

        const subject =
            subjectSelect.value;


        if (!className || !subject) {

            document.getElementById(
                "adminDocumentList"
            ).innerHTML = `

                <div class="empty-state">

                    <h3>
                        Select class and subject
                    </h3>

                    <p>
                        Existing PDFs will appear here.
                    </p>

                </div>

            `;

            return;
        }


        await loadAdminDocuments(
            type,
            className,
            subject
        );

    }


    classSelect.addEventListener(
        "change",
        load
    );


    subjectSelect.addEventListener(
        "change",
        load
    );

}


function getAdminEndpoints(type) {

    if (type === "notes") {

        return {
            get: "/get-notes",
            delete: "/delete-note"
        };

    }


    if (type === "syllabus") {

        return {
            get: "/get-syllabus",
            delete: "/delete-syllabus"
        };

    }


    return {
        get: "/get-question-papers",
        delete: "/delete-question-paper"
    };

}


async function loadAdminDocuments(
    type,
    className,
    subject
) {

    const list =
        document.getElementById(
            "adminDocumentList"
        );


    list.innerHTML = `

        <div class="loading">
            Loading PDFs...
        </div>

    `;


    const endpoints =
        getAdminEndpoints(type);


    try {

        const response =
            await fetch(
                `${endpoints.get}/${encodeURIComponent(className)}/${encodeURIComponent(subject)}`
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error();

        }


        if (!data.files || data.files.length === 0) {

            list.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No PDF uploaded
                    </h3>

                    <p>
                        Upload a PDF using the form above.
                    </p>

                </div>

            `;

            return;
        }


        list.innerHTML =
            data.files.map(
                function (file) {

                    return `

                        <div class="admin-list-item">

                            <div>

                                <h3>
                                    📄 ${escapeHtml(file.name)}
                                </h3>

                                <p>
                                    ${escapeHtml(className)}
                                    •
                                    ${escapeHtml(subject)}
                                </p>

                            </div>


                            <div class="admin-item-actions">

                                <a
                                    href="${escapeHtml(file.path)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    📖 Open
                                </a>


                                <a
                                    href="${escapeHtml(file.path)}"
                                    download
                                >
                                    ⬇️ Download
                                </a>


                                <button
                                    class="delete-btn"
                                    onclick="deleteAdminPdf(
                                        '${escapeHtml(type)}',
                                        '${escapeHtml(className)}',
                                        '${escapeHtml(subject)}',
                                        '${escapeHtml(file.name)}'
                                    )"
                                >
                                    🗑️ Delete
                                </button>

                            </div>

                        </div>

                    `;

                }
            ).join("");


    } catch (error) {

        list.innerHTML = `

            <div class="empty-state">

                <h3>
                    Unable to load PDFs
                </h3>

                <p>
                    Please check that the Flask server is running.
                </p>

            </div>

        `;

    }

}


async function uploadAdminPdf(
    type,
    endpoint
) {

    const className =
        document.getElementById(
            "adminDocumentClass"
        ).value;


    const subject =
        document.getElementById(
            "adminDocumentSubject"
        ).value;


    const fileInput =
        document.getElementById(
            "adminFileInput"
        );


    const message =
        document.getElementById(
            "adminUploadMessage"
        );


    if (!className || !subject) {

        message.textContent =
            "Please select class and subject.";

        return;
    }


    if (!fileInput.files.length) {

        message.textContent =
            "Please select a PDF.";

        return;
    }


    const file =
        fileInput.files[0];


    if (
        !file.name
            .toLowerCase()
            .endsWith(".pdf")
    ) {

        message.textContent =
            "Only PDF files are allowed.";

        return;
    }


    const formData =
        new FormData();


    formData.append(
        "className",
        className
    );


    formData.append(
        "subject",
        subject
    );


    formData.append(
        "file",
        file
    );


    message.textContent =
        "Uploading...";


    try {

        const response =
            await fetch(
                endpoint,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Upload failed."
            );

        }


        message.textContent =
            "PDF uploaded successfully.";


        fileInput.value = "";


        await loadAdminDocuments(
            type,
            className,
            subject
        );


    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to upload PDF.";

    }

}


async function deleteAdminPdf(
    type,
    className,
    subject,
    filename
) {

    const endpoints =
        getAdminEndpoints(type);


    const confirmed =
        confirm(
            `Delete "${filename}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                endpoints.delete,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        className:
                            className,

                        subject:
                            subject,

                        filename:
                            filename

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Delete failed."
            );

        }


        await loadAdminDocuments(
            type,
            className,
            subject
        );


    } catch (error) {

        alert(
            error.message ||
            "Unable to delete PDF."
        );

    }

}


/* =========================================================
   ADMIN MOCK TESTS
========================================================= */

/* =========================================================
   ADMIN MOCK TESTS
========================================================= */

async function openAdminMockTests() {

    openAdminContent();

    document.getElementById("adminContent").innerHTML = `

        <div class="admin-panel-title">

            <span>
                ADMIN PANEL
            </span>

            <h1>
                📝 Manage Mock Tests
            </h1>

            <p>
                Add, edit and delete mock tests.
            </p>

        </div>

        <div class="admin-form">

            <button
                class="primary-btn"
                onclick="openMockTestForm()"
            >
                ➕ Add New Test
            </button>

        </div>

        <div
            id="adminMockTestList"
            class="admin-list"
        >

            <div class="loading">
                Loading mock tests...
            </div>

        </div>

    `;

    await renderAdminMockTests();

}


/* =========================================================
   LOAD ADMIN TEST LIST
========================================================= */

async function renderAdminMockTests() {

    const list =
        document.getElementById(
            "adminMockTestList"
        );

    if (!list) return;

    list.innerHTML = `
        <div class="loading">
            Loading mock tests...
        </div>
    `;

    await loadMockTestsFromServer();

    if (mockTestsCache.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Mock Tests Yet
                </h3>

                <p>
                    Click "Add New Test" to create your first test.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        mockTestsCache.map(
            function (test) {

                return `

                    <div class="admin-list-item">

                        <div>

                            <h3>
                                📝 ${escapeHtml(test.title)}
                            </h3>

                            <p>
                                ${escapeHtml(test.className)}
                                •
                                ${escapeHtml(test.subject)}
                            </p>

                            <p>
                                ${test.questions.length}
                                Questions
                                •
                                ⏱️ ${test.duration || test.questions.length}
                                Minutes
                            </p>

                            <p>
                                ${escapeHtml(
                                    test.description || "Practice Test"
                                )}
                            </p>

                        </div>


                        <div class="admin-item-actions">

                            <button
                                class="primary-btn"
                                onclick="editMockTest('${escapeHtml(test.id)}')"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteMockTest('${escapeHtml(test.id)}')"
                            >
                                🗑️ Delete
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   MOCK TEST FORM
========================================================= */

function openMockTestForm(
    testId = null
) {

    const existingTest =
        testId
            ? mockTestsCache.find(
                function (test) {
                    return test.id === testId;
                }
            )
            : null;


    const isEdit =
        Boolean(existingTest);


    const questions =
        existingTest &&
        Array.isArray(existingTest.questions)
            ? existingTest.questions
            : [
                {
                    question: "",
                    options: ["", "", "", ""],
                    answer: 0
                }
            ];


    let html = `

        <div class="admin-panel-title">

            <span>
                ADMIN PANEL
            </span>

            <h1>
                ${isEdit
                    ? "✏️ Edit Mock Test"
                    : "➕ Create Mock Test"}
            </h1>

            <p>
                ${isEdit
                    ? "Update the test details and questions."
                    : "Create a new practice test for students."}
            </p>

        </div>


        <div class="admin-form">

            <select id="mockTestClass">

                <option value="">
                    -- Select Class --
                </option>

                ${CLASSES.map(
                    function (className) {

                        return `

                            <option
                                value="${escapeHtml(className)}"
                                ${
                                    existingTest &&
                                    existingTest.className === className
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(className)}
                            </option>

                        `;

                    }
                ).join("")}

            </select>


            <select id="mockTestSubject">

                <option value="">
                    -- Select Subject --
                </option>

                ${Object.keys(SUBJECTS).map(
                    function (subject) {

                        return `

                            <option
                                value="${escapeHtml(subject)}"
                                ${
                                    existingTest &&
                                    existingTest.subject === subject
                                        ? "selected"
                                        : ""
                                }
                            >
                                ${escapeHtml(subject)}
                            </option>

                        `;

                    }
                ).join("")}

            </select>


            <input
                type="text"
                id="mockTestTitle"
                placeholder="Test title"
                value="${
                    existingTest
                        ? escapeHtml(existingTest.title)
                        : ""
                }"
            >


            <textarea
                id="mockTestDescription"
                placeholder="Test description"
            >${
                existingTest
                    ? escapeHtml(existingTest.description || "")
                    : ""
            }</textarea>


            <input
                type="number"
                id="mockTestDuration"
                placeholder="Duration in minutes"
                min="1"
                value="${
                    existingTest
                        ? Number(existingTest.duration || 10)
                        : 10
                }"
            >

        </div>


        <div
            class="admin-panel-title"
            style="margin-top:25px;"
        >

            <span>
                QUESTIONS
            </span>

            <h2>
                Test Questions
            </h2>

            <p>
                Add questions with four options and select the correct answer.
            </p>

        </div>


        <div
            id="mockQuestionsContainer"
            class="admin-list"
        ></div>


        <div
            style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
                margin-top:20px;
            "
        >

            <button
                class="primary-btn"
                onclick="addMockQuestion()"
            >
                ➕ Add Question
            </button>


            <button
                class="primary-btn"
                onclick="saveMockTest(${
                    isEdit
                        ? `'${escapeHtml(testId)}'`
                        : "null"
                })"
            >
                💾 ${isEdit ? "Update Test" : "Save Test"}
            </button>


            <button
                class="back-btn"
                onclick="openAdminMockTests()"
            >
                ← Cancel
            </button>

        </div>


        <p
            id="mockTestFormMessage"
            class="form-message"
        ></p>

    `;


    document.getElementById(
        "adminContent"
    ).innerHTML = html;


    renderMockQuestions(
        questions
    );

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderMockQuestions(
    questions
) {

    const container =
        document.getElementById(
            "mockQuestionsContainer"
        );


    if (!container) return;


    container.innerHTML =
        questions.map(
            function (question, index) {

                return `

                    <div
                        class="admin-list-item mock-question-editor"
                        data-question-index="${index}"
                    >

                        <div style="width:100%;">

                            <h3>
                                Question ${index + 1}
                            </h3>


                            <input
                                type="text"
                                class="mock-question-text"
                                placeholder="Enter question"
                                value="${escapeHtml(
                                    question.question || ""
                                )}"
                            >


                            <input
                                type="text"
                                class="mock-option"
                                placeholder="Option 1"
                                value="${escapeHtml(
                                    question.options?.[0] || ""
                                )}"
                            >


                            <input
                                type="text"
                                class="mock-option"
                                placeholder="Option 2"
                                value="${escapeHtml(
                                    question.options?.[1] || ""
                                )}"
                            >


                            <input
                                type="text"
                                class="mock-option"
                                placeholder="Option 3"
                                value="${escapeHtml(
                                    question.options?.[2] || ""
                                )}"
                            >


                            <input
                                type="text"
                                class="mock-option"
                                placeholder="Option 4"
                                value="${escapeHtml(
                                    question.options?.[3] || ""
                                )}"
                            >


                            <select
                                class="mock-correct-answer"
                            >

                                <option
                                    value="0"
                                    ${
                                        Number(question.answer) === 0
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Correct Answer: Option 1
                                </option>


                                <option
                                    value="1"
                                    ${
                                        Number(question.answer) === 1
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Correct Answer: Option 2
                                </option>


                                <option
                                    value="2"
                                    ${
                                        Number(question.answer) === 2
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Correct Answer: Option 3
                                </option>


                                <option
                                    value="3"
                                    ${
                                        Number(question.answer) === 3
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Correct Answer: Option 4
                                </option>

                            </select>


                            <button
                                class="delete-btn"
                                type="button"
                                onclick="removeMockQuestion(${index})"
                                style="margin-top:10px;"
                            >
                                🗑️ Remove Question
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   ADD QUESTION
========================================================= */

function addMockQuestion() {

    const questions =
        collectMockQuestions();


    questions.push({

        question: "",

        options: [
            "",
            "",
            "",
            ""
        ],

        answer: 0

    });


    renderMockQuestions(
        questions
    );

}


/* =========================================================
   REMOVE QUESTION
========================================================= */

function removeMockQuestion(
    index
) {

    const questions =
        collectMockQuestions();


    if (questions.length <= 1) {

        alert(
            "At least one question is required."
        );

        return;

    }


    questions.splice(
        index,
        1
    );


    renderMockQuestions(
        questions
    );

}


/* =========================================================
   COLLECT QUESTIONS
========================================================= */

function collectMockQuestions() {

    const cards =
        document.querySelectorAll(
            ".mock-question-editor"
        );


    const questions = [];


    cards.forEach(
        function (card) {

            const questionText =
                card.querySelector(
                    ".mock-question-text"
                ).value.trim();


            const options =
                Array.from(
                    card.querySelectorAll(
                        ".mock-option"
                    )
                ).map(
                    function (input) {
                        return input.value.trim();
                    }
                );


            const answer =
                Number(
                    card.querySelector(
                        ".mock-correct-answer"
                    ).value
                );


            questions.push({

                question:
                    questionText,

                options:
                    options,

                answer:
                    answer

            });

        }
    );


    return questions;

}


/* =========================================================
   SAVE / UPDATE MOCK TEST
========================================================= */

async function saveMockTest(
    testId = null
) {

    const className =
        document.getElementById(
            "mockTestClass"
        ).value;


    const subject =
        document.getElementById(
            "mockTestSubject"
        ).value;


    const title =
        document.getElementById(
            "mockTestTitle"
        ).value.trim();


    const description =
        document.getElementById(
            "mockTestDescription"
        ).value.trim();


    const duration =
        Number(
            document.getElementById(
                "mockTestDuration"
            ).value
        );


    const message =
        document.getElementById(
            "mockTestFormMessage"
        );


    const questions =
        collectMockQuestions();


    if (!className) {

        message.textContent =
            "Please select a class.";

        return;

    }


    if (!subject) {

        message.textContent =
            "Please select a subject.";

        return;

    }


    if (!title) {

        message.textContent =
            "Please enter a test title.";

        return;

    }


    if (!Number.isInteger(duration) || duration < 1) {

        message.textContent =
            "Duration must be at least 1 minute.";

        return;

    }


    if (questions.length === 0) {

        message.textContent =
            "Please add at least one question.";

        return;

    }


    for (
        let i = 0;
        i < questions.length;
        i++
    ) {

        if (!questions[i].question) {

            message.textContent =
                `Please enter Question ${i + 1}.`;

            return;

        }


        if (
            questions[i].options.length !== 4 ||
            questions[i].options.some(
                function (option) {
                    return !option;
                }
            )
        ) {

            message.textContent =
                `Please fill all 4 options for Question ${i + 1}.`;

            return;

        }


        if (
            questions[i].answer < 0 ||
            questions[i].answer > 3
        ) {

            message.textContent =
                `Please select the correct answer for Question ${i + 1}.`;

            return;

        }

    }


    const payload = {

        className:
            className,

        subject:
            subject,

        title:
            title,

        description:
            description,

        duration:
            duration,

        questions:
            questions

    };


    message.textContent =
        testId
            ? "Updating test..."
            : "Saving test...";


    try {

        const response =
            await fetch(
                testId
                    ? `/api/mock-tests/${encodeURIComponent(testId)}`
                    : "/api/mock-tests",
                {

                    method:
                        testId
                            ? "PUT"
                            : "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to save mock test."
            );

        }


        await loadMockTestsFromServer();


        alert(
            testId
                ? "Mock test updated successfully!"
                : "Mock test created successfully!"
        );


        await openAdminMockTests();


    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to save mock test.";

    }

}


/* =========================================================
   EDIT MOCK TEST
========================================================= */

async function editMockTest(
    testId
) {

    await loadMockTestsFromServer();


    const test =
        mockTestsCache.find(
            function (item) {
                return item.id === testId;
            }
        );


    if (!test) {

        alert(
            "Mock test not found."
        );

        return;

    }


    openMockTestForm(
        testId
    );

}


/* =========================================================
   DELETE MOCK TEST
========================================================= */

async function deleteMockTest(
    testId
) {

    const test =
        mockTestsCache.find(
            function (item) {
                return item.id === testId;
            }
        );


    if (!test) {

        alert(
            "Mock test not found."
        );

        return;

    }


    const confirmed =
        confirm(
            `Delete "${test.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/mock-tests/${encodeURIComponent(testId)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to delete mock test."
            );

        }


        await loadMockTestsFromServer();


        alert(
            "Mock test deleted successfully!"
        );


        await renderAdminMockTests();


    } catch (error) {

        alert(
            error.message ||
            "Unable to delete mock test."
        );

    }

}


/* =========================================================
   ADMIN NOTICES
========================================================= */

function openAdminNotices() {

    openAdminContent();

    renderAdminNotices();

}


async function renderAdminNotices() {

    const notices =
    await getNotices();


    let html = `

        <div class="admin-panel-title">

            <span>
                ADMIN PANEL
            </span>

            <h1>
                📢 Manage Notices
            </h1>

            <p>
                Add or remove important announcements.
            </p>

        </div>


        <div class="admin-form">

            <input
                type="text"
                id="noticeTitle"
                placeholder="Notice title"
            >


            <textarea
                id="noticeMessage"
                placeholder="Write your notice..."
            ></textarea>


            <button
                class="primary-btn"
                onclick="addNotice()"
            >
                ➕ Add Notice
            </button>

        </div>


        <div
            class="admin-list"
            id="adminNoticeList"
        ></div>

    `;


    document.getElementById(
        "adminContent"
    ).innerHTML = html;


    const list =
        document.getElementById(
            "adminNoticeList"
        );


    if (notices.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                <h3>
                    No notices
                </h3>

                <p>
                    Add your first notice above.
                </p>

            </div>

        `;

        return;
    }


    list.innerHTML =
        notices.map(
            function (notice, index) {

                return `

                    <div class="admin-list-item">

                        <div>

                            <h3>
                                📢 ${escapeHtml(notice.title)}
                            </h3>

                            <p>
                                ${escapeHtml(notice.message)}
                            </p>

                        </div>


                        <div class="admin-item-actions">

                            <button
                                class="delete-btn"
                                onclick="deleteNotice(${index})"
                            >
                                🗑️ Delete
                            </button>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


async function addNotice() {

    const title =
        document.getElementById(
            "noticeTitle"
        ).value.trim();


    const message =
        document.getElementById(
            "noticeMessage"
        ).value.trim();


    if (!title || !message) {

        alert(
            "Please enter both title and notice."
        );

        return;
    }


    try {

        const response = await fetch(
            "/api/notices",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: title,
                    message: message
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            console.error(
                "Add notice error:",
                data.message
            );

            alert(
                data.message ||
                "Could not add notice."
            );

            return;
        }


        document.getElementById(
            "noticeTitle"
        ).value = "";


        document.getElementById(
            "noticeMessage"
        ).value = "";


        alert(
            "Notice added successfully!"
        );


        await renderAdminNotices();

    } catch (error) {

        console.error(
            "Add notice failed:",
            error
        );

        alert(
            "Could not connect to the server."
        );

    }

}


async function deleteNotice(index) {

    const notices =
        getNotices();


    if (!notices[index]) {
        return;
    }


    const confirmDelete =
        confirm(
            "Are you sure you want to delete this notice?"
        );


    if (!confirmDelete) {
        return;
    }


    notices.splice(
        index,
        1
    );


    localStorage.setItem(
        "cbzNotices",
        JSON.stringify(notices)
    );


    await renderAdminNotices();

}


function showStudentNotices() {

    const notices =
        getNotices();


    const generalSection =
        document.getElementById(
            "generalSection"
        );


    if (!generalSection) {
        return;
    }


    generalSection.style.display =
        "block";


    if (notices.length === 0) {

        generalSection.innerHTML = `

            <button
                class="back-btn"
                onclick="closeGeneralSection()"
            >
                ← Back to Dashboard
            </button>

            <div class="content-header">

                <span>CBZ INSTITUTE</span>

                <h1>📢 Notice Board</h1>

                <p>
                    Important notices and announcements
                </p>

            </div>

            <div class="empty-state">

                <h3>No notices available</h3>

                <p>
                    New notices will appear here.
                </p>

            </div>

        `;

        return;
    }


    generalSection.innerHTML = `

        <button
            class="back-btn"
            onclick="closeGeneralSection()"
        >
            ← Back to Dashboard
        </button>


        <div class="content-header">

            <span>CBZ INSTITUTE</span>

            <h1>📢 Notice Board</h1>

            <p>
                Important notices and announcements
            </p>

        </div>


        <div class="notice-list">

            ${notices.map(
                (notice) => `

                    <div class="notice-card">

                        <div class="notice-icon">
                            📢
                        </div>

                        <div class="notice-content">

                            <h3>
                                ${escapeHtml(notice.title)}
                            </h3>

                            <p>
                                ${escapeHtml(notice.message)}
                            </p>

                            <small>
                                ${notice.date || ""}
                            </small>

                        </div>

                    </div>

                `
            ).join("")}

        </div>

    `;

}


async function getNotices() {
    try {
        const response = await fetch("/api/notices");

        const data = await response.json();

        if (data.success) {
            return data.notices || [];
        }

        console.error("Notice API error:", data.message);
        return [];

    } catch (error) {
        console.error("Could not load notices:", error);
        return [];
    }
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}