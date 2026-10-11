/* =========================================================
   ADMIN DASHBOARD & MARKS MANAGEMENT
   ERODE ARTS AND SCIENCE COLLEGE
========================================================= */

let currentStudent = null;
let currentMarks = [];

/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    if (!checkAdminLogin()) {
        return;
    }

    loadAdminName();
    setCurrentDate();
    setupLogout();

    showSection("dashboard");
});

/* =========================================================
   ADMIN LOGIN CHECK
========================================================= */

function checkAdminLogin() {
    const adminData = sessionStorage.getItem("admin");

    if (!adminData) {
        window.location.href = "./admin-login.html";
        return false;
    }

    try {
        JSON.parse(adminData);
    } catch (error) {
        console.error("Invalid admin session:", error);
        sessionStorage.removeItem("admin");
        window.location.href = "./admin-login.html";
        return false;
    }

    return true;
}

/* =========================================================
   LOAD ADMIN NAME
========================================================= */

function loadAdminName() {
    const adminNameHeader = document.getElementById("headerAdminName");
    const adminNameSidebar = document.getElementById("sidebarAdminName");
    const oldAdminName = document.querySelector(".admin-name");

    let admin = null;

    try {
        const savedAdmin = sessionStorage.getItem("admin");
        if (savedAdmin) {
            admin = JSON.parse(savedAdmin);
        }
    } catch (error) {
        console.error("Unable to read admin session:", error);
        admin = null;
    }

    if (!admin) return;

    const name = admin.username || admin.name || "Admin";

    if (adminNameHeader) adminNameHeader.textContent = name;
    if (adminNameSidebar) adminNameSidebar.textContent = name.toUpperCase();
    if (oldAdminName) oldAdminName.textContent = "👤 " + name;
}

/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {
    const logoutButton = document.getElementById("logoutButton");
    const logoutModal = document.getElementById("logoutModal");
    const cancelLogout = document.getElementById("cancelLogout");
    const confirmLogout = document.getElementById("confirmLogout");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            if (logoutModal) {
                logoutModal.hidden = false;
            } else {
                logoutNow();
            }
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener("click", function () {
            if (logoutModal) {
                logoutModal.hidden = true;
            }
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener("click", function () {
            logoutNow();
        });
    }

    if (logoutModal) {
        logoutModal.addEventListener("click", function (event) {
            if (event.target === logoutModal) {
                logoutModal.hidden = true;
            }
        });
    }
}

function logoutNow() {
    sessionStorage.removeItem("admin");
    currentStudent = null;
    currentMarks = [];
    window.location.href = "./admin-login.html";
}

/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(url, options = {}) {
    const requestOptions = {
        ...options,
        headers: {
            ...(options.headers || {})
        }
    };

    if (
        options.body &&
        typeof options.body === "object" &&
        !(options.body instanceof FormData)
    ) {
        requestOptions.body = JSON.stringify(options.body);
        requestOptions.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, requestOptions);
    const text = await response.text();

    let data;

    try {
        data = text ? JSON.parse(text) : {};
    } catch (error) {
        console.error("API URL:", url);
        console.error("HTTP status:", response.status);
        console.error("Server response:", text);

        throw new Error(
            `Server response is not JSON (HTTP ${response.status}). Check the Node.js terminal and browser Console.`
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message || data.error || `Request failed (${response.status}).`
        );
    }

    return data;
}

/* =========================================================
   CURRENT DATE
========================================================= */

function setCurrentDate() {
    const dateElement = document.getElementById("currentDate");
    if (!dateElement) return;

    const today = new Date();
    dateElement.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

/* =========================================================
   SHOW SECTION

/* =========================================================
   SHOW SECTION - LOAD CONTENT ON THE RIGHT SIDE
========================================================= */

async function showSection(section) {
    const content = document.getElementById("contentSection");
    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    if (!content) {
        console.error("contentSection element not found.");
        return;
    }

    // Highlight the selected sidebar menu
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.section === section
        );
    });

    // Update the heading on the right
    const sections = {
        dashboard: {
            title: "Dashboard",
            subtitle: "Welcome to the Student Portal Administration"
        },
        addStudent: {
            title: "Add Student",
            subtitle: "Create a new student profile"
        },
        studentProfile: {
            title: "Student Profile",
            subtitle: "Search and manage student information"
        },
        marks: {
            title: "Manage Marks",
            subtitle: "Add, search, edit and delete student marks"
        },
        fees: {
            title: "Manage Fees",
            subtitle: "Manage student fee information"
        },
        attendance: {
            title: "Attendance",
            subtitle: "Manage student attendance"
        },
        students: {
            title: "View Students",
            subtitle: "View all registered students"
        }
    };

    const selected = sections[section];

    if (!selected) {
        console.error("Unknown dashboard section:", section);
        return;
    }

    if (pageTitle) pageTitle.textContent = selected.title;
    if (pageSubtitle) pageSubtitle.textContent = selected.subtitle;

    // Display a loading message in the right panel
    content.innerHTML = `
        <div class="loading-box">
            Loading ${selected.title}...
        </div>
    `;

    // Load the selected section into the same right panel
    try {
        switch (section) {
            case "dashboard":
                await loadDashboard();
                break;

            case "addStudent":
                loadAddStudent();
                break;

            case "studentProfile":
                loadStudentProfile();
                break;

            case "marks":
                await loadMarks();
                break;

            case "fees":
                loadFees();
                break;

            case "attendance":
                loadAttendance();
                break;

            case "students":
                await loadStudents();
                break;
        }
    } catch (error) {
        console.error("Unable to load section:", error);

        content.innerHTML = `
            <div class="error-box">
                Unable to load ${selected.title}.
                Please check the browser Console and server.
            </div>
        `;
    }
}
/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {
    const content = document.getElementById("contentSection");
    if (!content) return;

    content.innerHTML = `<div class="loading-box">Loading dashboard...</div>`;

    try {
        const data = await apiRequest("/api/admin/students");
        const students = Array.isArray(data.students) ? data.students : [];

        const totalStudents = students.length;
        const maleStudents = students.filter(s => normalizeGender(s.gender) === "male").length;
        const femaleStudents = students.filter(s => normalizeGender(s.gender) === "female").length;
        const otherStudents = students.filter(s => {
            const g = normalizeGender(s.gender);
            return g !== "male" && g !== "female";
        }).length;

        content.innerHTML = `
            <!-- STATISTICS -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👨‍🎓</div>
                    <div>
                        <h3>${totalStudents}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👨</div>
                    <div>
                        <h3>${maleStudents}</h3>
                        <p>Male Students</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👩</div>
                    <div>
                        <h3>${femaleStudents}</h3>
                        <p>Female Students</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🧑</div>
                    <div>
                        <h3>${otherStudents}</h3>
                        <p>Other / Not Specified</p>
                    </div>
                </div>
            </div>

            <!-- QUICK ACTIONS -->
            <div class="dashboard-card">
                <h2>Quick Actions</h2>
                <div class="quick-actions">
                    <button onclick="showSection('addStudent')">➕ Add Student</button>
                    <button onclick="showSection('studentProfile')">👤 Student Profile</button>
                    <button onclick="showSection('marks')">📊 Manage Marks</button>
                    <button onclick="showSection('fees')">💰 Manage Fees</button>
                    <button onclick="showSection('attendance')">📅 Attendance</button>
                    <button onclick="showSection('students')">👥 View Students</button>
                </div>
            </div>

            <!-- STUDENT OVERVIEW -->
            <div class="dashboard-card">
                <div class="card-header-row">
                    <div>
                        <h2>Student Overview</h2>
                        <p>Showing up to 10 students</p>
                    </div>
                    <button class="secondary-button" onclick="showSection('students')">View All</button>
                </div>

                ${students.length === 0 ? `
                    <div class="empty-box">
                        <div class="empty-icon">👨‍🎓</div>
                        <p>No students registered yet.</p>
                    </div>
                ` : `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Register No</th>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Department</th>
                                    <th>Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${students.slice(0, 10).map(student => `
                                    <tr>
                                        <td>${escapeHTML(student.registerNo)}</td>
                                        <td>${escapeHTML(student.name)}</td>
                                        <td>${getGenderBadge(student.gender)}</td>
                                        <td>${escapeHTML(student.department)}</td>
                                        <td>${escapeHTML(student.year)}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    } catch (error) {
        content.innerHTML = `<div class="error-box">❌ ${escapeHTML(error.message)}</div>`;
    }
}

/* =========================================================
   ADD STUDENT
========================================================= */

function loadAddStudent() {
    const content = document.getElementById("contentSection");
    if (!content) return;

    content.innerHTML = `
        <div class="form-card">
            <h2>Add New Student</h2>
            <p class="form-description">Enter the student's details below.</p>

            <form id="addStudentForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="studentName">Student Name</label>
                        <input type="text" id="studentName" required placeholder="Enter student name">
                    </div>

                    <div class="form-group">
                        <label for="studentRegisterNo">Register Number</label>
                        <input type="text" id="studentRegisterNo" required placeholder="Enter register number">
                    </div>

                    <div class="form-group">
                        <label for="studentEmail">Email</label>
                        <input type="email" id="studentEmail" required placeholder="Enter email">
                    </div>

                    <div class="form-group">
                        <label for="studentPhone">Phone</label>
                        <input type="tel" id="studentPhone" required placeholder="Enter phone number">
                    </div>

                    <div class="form-group">
                        <label for="studentDepartment">Department</label>
                        <input type="text" id="studentDepartment" required placeholder="Example: Information Technology">
                    </div>

                    <div class="form-group">
                        <label for="studentYear">Year</label>
                        <select id="studentYear" required>
                            <option value="">Select Year</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="studentGender">Gender</label>
                        <select id="studentGender" required onchange="updateGenderAnimation('studentGender', 'genderAnimation')">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div class="gender-animation-box" id="genderAnimation">
                        <div class="gender-placeholder">
                            <span class="gender-placeholder-icon">👤</span>
                            <span>Select Gender</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="studentPassword">Password</label>
                        <input type="password" id="studentPassword" required minlength="4" placeholder="Create password">
                    </div>
                </div>

                <div id="addStudentMessage" class="message-box"></div>

                <button type="submit" class="primary-button">➕ Add Student</button>
            </form>
        </div>
    `;

    const form = document.getElementById("addStudentForm");
    if (form) {
        form.addEventListener("submit", submitAddStudent);
    }
}

function updateGenderAnimation(selectId, animationId) {
    const select = document.getElementById(selectId);
    const animation = document.getElementById(animationId);

    if (!select || !animation) return;

    const gender = select.value;

    if (gender === "Male") {
        animation.innerHTML = `
            <div class="gender-display">
                <img src="./male.gif" alt="Male" class="profile-gender-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="gender-fallback-large" style="display:none;">👨‍🎓</div>
                <span>Male</span>
            </div>
        `;
        return;
    }

    if (gender === "Female") {
        animation.innerHTML = `
            <div class="gender-display">
                <img src="./female.gif" alt="Female" class="profile-gender-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="gender-fallback-large" style="display:none;">👩‍🎓</div>
                <span>Female</span>
            </div>
        `;
        return;
    }

    if (gender === "Other") {
        animation.innerHTML = `
            <div class="gender-display">
                <div class="gender-fallback-large">🧑‍🎓</div>
                <span>Other</span>
            </div>
        `;
        return;
    }

    animation.innerHTML = `
        <div class="gender-placeholder">
            <span class="gender-placeholder-icon">👤</span>
            <span>Select Gender</span>
        </div>
    `;
}

async function submitAddStudent(event) {
    event.preventDefault();
    const message = document.getElementById("addStudentMessage");

    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const studentData = {
        name: getValue("studentName"),
        registerNo: getValue("studentRegisterNo"),
        email: getValue("studentEmail"),
        phone: getValue("studentPhone"),
        department: getValue("studentDepartment"),
        year: document.getElementById("studentYear")?.value || "",
        gender: document.getElementById("studentGender")?.value || "",
        password: getValue("studentPassword")
    };

    if (!studentData.gender) {
        showMessage(message, "Please select gender.", "error");
        return;
    }

    if (!studentData.name || !studentData.registerNo || !studentData.email || !studentData.phone || !studentData.department || !studentData.year || !studentData.password) {
        showMessage(message, "Please fill all required fields.", "error");
        return;
    }

    try {
        const data = await apiRequest("/api/admin/student", {
            method: "POST",
            body: studentData
        });

        showMessage(message, data.message || "Student added successfully.", "success");
        const form = document.getElementById("addStudentForm");
        if (form) form.reset();
        resetGenderAnimation("genderAnimation");
    } catch (error) {
        showMessage(message, error.message, "error");
    }
}

function resetGenderAnimation(animationId) {
    const animation = document.getElementById(animationId);
    if (!animation) return;

    animation.innerHTML = `
        <div class="gender-placeholder">
            <span class="gender-placeholder-icon">👤</span>
            <span>Select Gender</span>
        </div>
    `;
}

/* =========================================================
   STUDENT PROFILE SEARCH PAGE
========================================================= */

function loadStudentProfile() {
    const content = document.getElementById("contentSection");
    if (!content) return;

    content.innerHTML = `
        <div class="search-card">
            <h2>Search Student</h2>
            <p>Enter the student's register number.</p>
            <div class="search-row">
                <input type="text" id="profileRegisterNo" placeholder="Enter Register Number">
                <button onclick="searchStudentProfile()" class="primary-button">🔍 Search</button>
            </div>
        </div>
        <div id="profileResult"></div>
    `;
}

async function searchStudentProfile() {
    const input = document.getElementById("profileRegisterNo");
    const result = document.getElementById("profileResult");

    if (!input || !result) return;
    const registerNo = input.value.trim();

    if (!registerNo) {
        result.innerHTML = `<div class="error-box">Please enter register number.</div>`;
        return;
    }

    result.innerHTML = `<div class="loading-box">Searching student...</div>`;

    try {
        const data = await apiRequest("/api/admin/student/" + encodeURIComponent(registerNo));
        currentStudent = data.student;
        displayStudentProfile(currentStudent);
    } catch (error) {
        currentStudent = null;
        result.innerHTML = `<div class="error-box">❌ ${escapeHTML(error.message)}</div>`;
    }
}

function displayStudentProfile(student) {
    const result = document.getElementById("profileResult");
    if (!result) return;

    if (!student) {
        result.innerHTML = `<div class="error-box">Student information not found.</div>`;
        return;
    }

    const gender = student.gender || "Not Specified";

    result.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-animation">
                    ${getGenderImage(gender)}
                </div>
                <div class="profile-heading">
                    <h2>${escapeHTML(student.name)}</h2>
                    <p>Register No: <strong>${escapeHTML(student.registerNo)}</strong></p>
                </div>
            </div>

            <form id="updateStudentForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="editName">Student Name</label>
                        <input type="text" id="editName" value="${escapeAttribute(student.name)}" required>
                    </div>

                    <div class="form-group">
                        <label>Register Number</label>
                        <input type="text" value="${escapeAttribute(student.registerNo)}" disabled>
                    </div>

                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" value="${escapeAttribute(student.email)}" required>
                    </div>

                    <div class="form-group">
                        <label for="editPhone">Phone</label>
                        <input type="tel" id="editPhone" value="${escapeAttribute(student.phone)}" required>
                    </div>

                    <div class="form-group">
                        <label for="editDepartment">Department</label>
                        <input type="text" id="editDepartment" value="${escapeAttribute(student.department)}" required>
                    </div>

                    <div class="form-group">
                        <label for="editYear">Year</label>
                        <select id="editYear" required>
                            <option value="1st Year" ${student.year === "1st Year" ? "selected" : ""}>1st Year</option>
                            <option value="2nd Year" ${student.year === "2nd Year" ? "selected" : ""}>2nd Year</option>
                            <option value="3rd Year" ${student.year === "3rd Year" ? "selected" : ""}>3rd Year</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="editGender">Gender</label>
                        <select id="editGender" required onchange="updateGenderAnimation('editGender', 'editGenderAnimation')">
                            <option value="Male" ${normalizeGender(gender) === "male" ? "selected" : ""}>Male</option>
                            <option value="Female" ${normalizeGender(gender) === "female" ? "selected" : ""}>Female</option>
                            <option value="Other" ${normalizeGender(gender) === "other" ? "selected" : ""}>Other</option>
                        </select>
                    </div>

                    <div id="editGenderAnimation" class="gender-animation-box">
                        ${getGenderImage(gender)}
                    </div>

                    <div class="form-group">
                        <label for="editPassword">New Password</label>
                        <input type="password" id="editPassword" minlength="4" placeholder="Leave empty to keep old password">
                    </div>
                </div>

                <div id="updateStudentMessage" class="message-box"></div>

                <div class="button-row">
                    <button type="submit" class="primary-button">💾 Update Student</button>
                    <button type="button" class="danger-button" onclick="deleteStudent('${escapeAttribute(student.registerNo)}')">🗑️ Delete Student</button>
                </div>
            </form>
        </div>
    `;

    const updateForm = document.getElementById("updateStudentForm");
    if (updateForm) {
        updateForm.addEventListener("submit", updateStudent);
    }
}

function getGenderImage(gender) {
    const normalized = normalizeGender(gender);

    if (normalized === "male") {
        return `
            <div class="gender-display">
                <img src="./male.gif" alt="Male" class="profile-gender-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="gender-fallback-large" style="display:none;">👨‍🎓</div>
                <span>Male</span>
            </div>
        `;
    }

    if (normalized === "female") {
        return `
            <div class="gender-display">
                <img src="./female.gif" alt="Female" class="profile-gender-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="gender-fallback-large" style="display:none;">👩‍🎓</div>
                <span>Female</span>
            </div>
        `;
    }

    return `
        <div class="gender-display">
            <div class="gender-fallback-large">🧑‍🎓</div>
            <span>${escapeHTML(gender || "Not Specified")}</span>
        </div>
    `;
}

async function updateStudent(event) {
    event.preventDefault();

    if (!currentStudent) {
        alert("Please search for a student first.");
        return;
    }

    const message = document.getElementById("updateStudentMessage");
    const getElementValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const studentData = {
        name: getElementValue("editName"),
        email: getElementValue("editEmail"),
        phone: getElementValue("editPhone"),
        department: getElementValue("editDepartment"),
        year: document.getElementById("editYear")?.value || "",
        gender: document.getElementById("editGender")?.value || ""
    };

    const passwordInput = document.getElementById("editPassword");
    if (passwordInput && passwordInput.value.trim()) {
        studentData.password = passwordInput.value.trim();
    }

    if (!studentData.gender) {
        showMessage(message, "Please select gender.", "error");
        return;
    }

    try {
        const data = await apiRequest(
            "/api/admin/student/" + encodeURIComponent(currentStudent.registerNo),
            {
                method: "PUT",
                body: studentData
            }
        );

        showMessage(message, data.message || "Student updated successfully.", "success");
        currentStudent = data.student || currentStudent;

        setTimeout(function () {
            const input = document.getElementById("profileRegisterNo");
            if (input) {
                input.value = currentStudent.registerNo;
                searchStudentProfile();
            }
        }, 500);
    } catch (error) {
        showMessage(message, error.message, "error");
    }
}

async function deleteStudent(registerNo) {
    const confirmed = confirm(
        "Are you sure you want to delete this student?\n\n" +
        "Register No: " + registerNo + "\n\n" +
        "Marks, fees and attendance records will also be deleted."
    );

    if (!confirmed) return;

    try {
        const data = await apiRequest(
            "/api/admin/student/" + encodeURIComponent(registerNo),
            { method: "DELETE" }
        );

        alert(data.message || "Student deleted successfully.");
        currentStudent = null;
        showSection("students");
    } catch (error) {
        alert("Delete failed: " + error.message);
    }
}

/* =========================================================
   MARKS SECTION & MANAGEMENT
========================================================= */

async function loadStudentMarks(registerNo) {
  try {
    const response = await fetch(
      `/api/student/${encodeURIComponent(registerNo)}/marks`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      }
    );

    const text = await response.text();
    let result;

    try {
      result = JSON.parse(text);
    } catch {
      console.error("Server returned non-JSON:", text);
      throw new Error(
        "The server did not return JSON. Check the API route."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.message || `Request failed: ${response.status}`
      );
    }

    if (result.success === false) {
      throw new Error(result.message || "Unable to retrieve marks.");
    }

    const marks = Array.isArray(result)
      ? result
      : result.marks;

    if (!Array.isArray(marks)) {
      console.error("Unexpected response:", result);
      throw new Error("The response does not contain a marks array.");
    }

    console.log("Student marks:", marks);

    const tbody = document.getElementById("marksTableBody");

    if (!tbody) {
      console.error("Element #marksTableBody was not found.");
      return;
    }

    if (marks.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6">No marks found.</td></tr>';
      return;
    }

    tbody.innerHTML = marks.map(mark => `
      <tr>
        <td>${escapeHTML(mark.semester ?? "")}</td>
        <td>${escapeHTML(mark.subject ?? "")}</td>
        <td>${escapeHTML(mark.internal ?? "")}</td>
        <td>${escapeHTML(mark.external ?? "")}</td>
        <td>${escapeHTML(mark.total ?? "")}</td>
      </tr>
    `).join("");

  } catch (error) {
    console.error("Error retrieving student marks:", error);
    alert("Error retrieving student/marks: " + error.message);
  }
}

function renderMarksSection() {
    loadMarks();
}

async function loadMarks() {
    currentStudent = null;
    currentMarks = [];

    const content = document.getElementById("contentSection");
    if (content) {
        content.innerHTML = `
            <h2>Manage Student Marks</h2>

            <!-- 1. Add marks first -->
            <div class="data-card">
                <h3>Add Student Marks</h3>
                <form id="addMarksForm" class="management-form">
                    <label>Register Number
                        <input name="registerNo" required placeholder="Enter student register number">
                    </label>

                    <label>Semester
                        <select name="semester" required>
                            <option value="">Select Semester</option>
                            ${Array.from({ length: 8 }, (_, i) => `<option value="Semester ${i + 1}">Semester ${i + 1}</option>`).join("")}
                        </select>
                    </label>

                    <label>Subject
                        <input name="subject" required maxlength="150">
                    </label>

                    <label>Internal Marks
                        <input name="internal" type="number" min="0" max="100" required>
                    </label>

                    <label>External Marks
                        <input name="external" type="number" min="0" max="100" required>
                    </label>

                    <button type="submit" class="primary-button">Add Marks</button>
                </form>
            </div>

            <hr>

            <!-- 2. All Marks Table / Search -->
            <div class="search-card">
                <h3>Search Student Marks</h3>
                <form id="marksSearchForm" class="management-form">
                    <div class="search-row">
                        <input name="registerNo" id="marksRegisterNo" placeholder="Enter register number (or leave empty to view all)">
                        <button type="submit" class="primary-button">🔍 Search Marks</button>
                        <button type="button" class="secondary-button" onclick="loadAllMarks()">View All Marks</button>
                    </div>
                </form>
            </div>

            <div id="marksStudentInfo"></div>
            <div id="marksTableWrapper">
                <div class="table-responsive">
                    <table class="table management-table">
                        <thead>
                            <tr>
                                <th>Register No</th>
                                <th>Semester</th>
                                <th>Subject</th>
                                <th>Internal</th>
                                <th>External</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="marksTableBody">
                            <tr>
                                <td colspan="7">Loading marks...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div id="marksFormWrapper"></div>
        `;

        const addForm = document.getElementById("addMarksForm");
        if (addForm) addForm.addEventListener("submit", addMarksFirst);

        const searchForm = document.getElementById("marksSearchForm");
        if (searchForm) searchForm.addEventListener("submit", searchMarks);
    }

    await loadAllMarks();
}

async function loadAllMarks() {
    const tbody = document.getElementById("marksTableBody");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7">Loading marks...</td></tr>';

    try {
        const data = await apiRequest("/api/admin/marks");
        const marks = Array.isArray(data) ? data : (data.marks || []);
        currentMarks = marks;
        renderMarksTableRows(marks);
    } catch (error) {
        console.error("Error loading marks:", error);
        tbody.innerHTML = '<tr><td colspan="7">Could not load marks. Check the server and API route.</td></tr>';
    }
}

async function addMarksFirst(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const values = Object.fromEntries(new FormData(form).entries());

    const registerNo = values.registerNo.trim();
    const internal = Number(values.internal);
    const external = Number(values.external);

    if (
        !registerNo ||
        !values.semester ||
        !values.subject.trim() ||
        values.internal === "" ||
        values.external === "" ||
        !Number.isFinite(internal) ||
        !Number.isFinite(external) ||
        internal < 0 || internal > 100 ||
        external < 0 || external > 100
    ) {
        alert("Please enter a valid semester, subject, and marks between 0 and 100.");
        return;
    }

    setButtonLoading(button, true);

    try {
        const data = await apiRequest("/api/admin/marks", {
            method: "POST",
            body: {
                registerNo,
                semester: values.semester,
                subject: values.subject.trim(),
                internal,
                external
            }
        });

        alert(data.message || "Marks added successfully!");
        form.reset();
        await loadAllMarks();
    } catch (error) {
        alert("Error adding marks: " + error.message);
    } finally {
        setButtonLoading(button, false, "Add Marks");
    }
}

async function searchMarks(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("marksRegisterNo") || document.querySelector('#marksSearchForm [name="registerNo"]');
    const registerNo = input ? input.value.trim() : "";

    const infoElem = document.getElementById("marksStudentInfo");
    const tbody = document.getElementById("marksTableBody");
    const formElem = document.getElementById("marksFormWrapper");

    if (!registerNo) {
        await loadAllMarks();
        if (infoElem) infoElem.innerHTML = "";
        return;
    }

    if (tbody) tbody.innerHTML = '<tr><td colspan="7">Searching marks...</td></tr>';
    if (formElem) formElem.innerHTML = "";

    try {
        const [studentData, marksData] = await Promise.all([
            apiRequest(`/api/admin/student/${encodeURIComponent(registerNo)}`).catch(() => null),
            apiRequest(`/api/admin/student/${encodeURIComponent(registerNo)}/marks`)
        ]);

        if (studentData && studentData.student) {
            currentStudent = studentData.student;
            if (infoElem) {
                infoElem.innerHTML = `
                    <h3>
                        ${escapeHTML(currentStudent.name)}
                        (${escapeHTML(currentStudent.registerNo)})
                    </h3>
                `;
            }
        } else {
            if (infoElem) infoElem.innerHTML = `<h3>Register No: ${escapeHTML(registerNo)}</h3>`;
        }

        currentMarks = marksData.marks || [];
        renderMarksTableRows(currentMarks);
    } catch (error) {
        currentStudent = null;
        currentMarks = [];

        if (infoElem) infoElem.innerHTML = "";
        if (tbody) tbody.innerHTML = '<tr><td colspan="7">No records found or error retrieving marks.</td></tr>';
        alert("Error retrieving student/marks: " + error.message);
    }
}

function renderMarksTableRows(marks) {
    const tbody = document.getElementById("marksTableBody");
    if (!tbody) return;

    if (!marks || marks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No marks records found.</td></tr>';
        return;
    }

    tbody.innerHTML = marks.map(mark => `
        <tr>
            <td>${escapeHTML(mark.registerNo || mark.register_no || "")}</td>
            <td>${escapeHTML(mark.semester ?? "")}</td>
            <td>${escapeHTML(mark.subject || "")}</td>
            <td>${numberValue(mark.internal)}</td>
            <td>${numberValue(mark.external)}</td>
            <td>${numberValue(mark.total || (Number(mark.internal || 0) + Number(mark.external || 0)))}</td>
            <td>
                <button type="button" class="small-button" onclick="editMarks(${Number(mark.id)})">
                    Edit
                </button>
                <button type="button" class="small-danger-button" onclick="deleteMarks(${Number(mark.id)})">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

window.editMarks = async function (id) {
    let mark = currentMarks.find(item => Number(item.id) === Number(id));

    if (!mark) {
        const tbody = document.getElementById("marksTableBody");
        if (tbody) {
            const row = [...tbody.querySelectorAll("tr")].find(r => r.querySelector(`button[onclick*="editMarks(${id})"]`));
            if (row) {
                const cells = row.querySelectorAll("td");
                mark = {
                    id: id,
                    registerNo: cells[0]?.textContent.trim(),
                    semester: cells[1]?.textContent.trim(),
                    subject: cells[2]?.textContent.trim(),
                    internal: cells[3]?.textContent.trim(),
                    external: cells[4]?.textContent.trim()
                };
            }
        }
    }

    if (!mark) {
        alert("Marks record not found.");
        return;
    }

    const currentSemester = mark.semester || "";
    const currentSubject = mark.subject || "";
    const currentInternal = mark.internal ?? "";
    const currentExternal = mark.external ?? "";

    const semester = prompt("Enter semester:", currentSemester);
    if (semester === null) return;

    const subject = prompt("Enter subject:", currentSubject);
    if (subject === null) return;

    const internal = prompt("Enter internal marks (0–100):", currentInternal);
    if (internal === null) return;

    const external = prompt("Enter external marks (0–100):", currentExternal);
    if (external === null) return;

    const internalNumber = Number(internal);
    const externalNumber = Number(external);

    if (
        !semester.trim() ||
        !subject.trim() ||
        !Number.isFinite(internalNumber) ||
        !Number.isFinite(externalNumber) ||
        internalNumber < 0 ||
        internalNumber > 100 ||
        externalNumber < 0 ||
        externalNumber > 100
    ) {
        alert("Enter a valid semester, subject and marks between 0 and 100.");
        return;
    }

    try {
        const data = await apiRequest(`/api/admin/marks/${id}`, {
            method: "PUT",
            body: {
                semester: semester.trim(),
                subject: subject.trim(),
                internal: internalNumber,
                external: externalNumber,
                total: internalNumber + externalNumber
            }
        });

        alert(data.message || "Marks updated successfully!");

        if (currentStudent && currentStudent.registerNo) {
            await searchMarks();
        } else {
            await loadAllMarks();
        }
    } catch (error) {
        console.error("Error updating marks:", error);
        alert(error.message || "Could not update marks.");
    }
};

window.deleteMarks = async function (id) {
    if (!confirm("Are you sure you want to delete this marks record?")) {
        return;
    }

    try {
        const data = await apiRequest(`/api/admin/marks/${id}`, {
            method: "DELETE"
        });

        alert(data.message || "Marks record deleted successfully!");

        if (currentStudent && currentStudent.registerNo) {
            await searchMarks();
        } else {
            await loadAllMarks();
        }
    } catch (error) {
        console.error("Error deleting marks:", error);
        alert(error.message || "Could not delete marks.");
    }
};

/*
/* =========================================================
   FEES MANAGEMENT
========================================================= */

function loadFees() {
    const content = document.getElementById("contentSection");
    if (!content) return;

    content.innerHTML = `
        <h2>Manage Student Fees</h2>
        <p>Add, search and update student fee details.</p>

        <!-- ADD FEES FIRST -->
        <div class="data-card">
            <h3>Add Student Fees</h3>

            <form id="addFeesForm" class="management-form">
                <label>Register Number
                    <input type="text" id="addFeesRegisterNo"
                        name="registerNo"
                        placeholder="Enter student register number"
                        required>
                </label>

                <label>Tuition Fees (₹)
                    <input type="number" id="tuitionFee"
                        min="0" step="0.01" value="0" required>
                </label>

                <label>Tuition Status
                    <select id="tuitionStatus">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </label>

                <label>Exam Fees (₹)
                    <input type="number" id="examFee"
                        min="0" step="0.01" value="0" required>
                </label>

                <label>Exam Status
                    <select id="examStatus">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </label>

                <label>Hostel Fees (₹)
                    <input type="number" id="hostelFee"
                        min="0" step="0.01" value="0" required>
                </label>

                <label>Hostel Status
                    <select id="hostelStatus">
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                    </select>
                </label>

                <label>Paid Fees (₹)
                    <input type="number" id="paidFees"
                        min="0" step="0.01" value="0" required>
                </label>

                <label>Total Fees (₹)
                    <input type="number" id="totalFees"
                        value="0.00" readonly>
                </label>

                <label>Pending Fees (₹)
                    <input type="number" id="pendingFees"
                        value="0.00" readonly>
                </label>

                <div class="fee-summary">
                    <div>
                        <span>Total</span>
                        <strong id="feeSummaryTotal">₹0.00</strong>
                    </div>
                    <div>
                        <span>Paid</span>
                        <strong id="feeSummaryPaid">₹0.00</strong>
                    </div>
                    <div>
                        <span>Pending</span>
                        <strong id="feeSummaryPending">₹0.00</strong>
                    </div>
                </div>

                <div id="feesMessage" class="message-box"></div>

                <button type="submit" id="saveFeesButton"
                    class="primary-button">
                    Register Fees
                </button>
            </form>
        </div>

        <hr>

        <!-- SEARCH FEES BELOW -->
        <div class="search-card">
            <h3>Search Student Fees</h3>

            <form id="feesSearchForm" class="management-form">
                <div class="search-row">
                    <input type="text" id="feesSearchRegisterNo"
                        placeholder="Enter register number"
                        required>

                    <button type="submit" class="primary-button">
                        🔍 Search Fees
                    </button>
                </div>
            </form>
        </div>

        <div id="feesSearchResult"></div>
    `;

    setupFeeCalculation();

    document.getElementById("addFeesForm")
        ?.addEventListener("submit", saveFees);

    document.getElementById("feesSearchForm")
        ?.addEventListener("submit", searchFees);
}


/* =========================================================
   AUTOMATIC FEE CALCULATION
========================================================= */

function setupFeeCalculation() {
    const tuition = document.getElementById("tuitionFee");
    const exam = document.getElementById("examFee");
    const hostel = document.getElementById("hostelFee");
    const paid = document.getElementById("paidFees");

    const totalInput = document.getElementById("totalFees");
    const pendingInput = document.getElementById("pendingFees");

    const summaryTotal = document.getElementById("feeSummaryTotal");
    const summaryPaid = document.getElementById("feeSummaryPaid");
    const summaryPending = document.getElementById("feeSummaryPending");
    const message = document.getElementById("feesMessage");
    const saveButton = document.getElementById("saveFeesButton");

    if (!tuition || !exam || !hostel || !paid ||
        !totalInput || !pendingInput) {
        console.error("Fee calculation fields were not found.");
        return;
    }

    function update() {
        const tuitionAmount = Math.max(0, Number(tuition.value) || 0);
        const examAmount = Math.max(0, Number(exam.value) || 0);
        const hostelAmount = Math.max(0, Number(hostel.value) || 0);
        const paidAmount = Math.max(0, Number(paid.value) || 0);

        const total = tuitionAmount + examAmount + hostelAmount;
        const pending = Math.max(total - paidAmount, 0);
        const invalid = paidAmount > total;

        totalInput.value = total.toFixed(2);
        pendingInput.value = pending.toFixed(2);

        summaryTotal.textContent = "₹" + total.toFixed(2);
        summaryPaid.textContent = "₹" + paidAmount.toFixed(2);
        summaryPending.textContent = "₹" + pending.toFixed(2);

        paid.setCustomValidity(
            invalid ? "Paid fees cannot exceed total fees." : ""
        );

        if (invalid) {
            showMessage(
                message,
                "Paid fees cannot exceed total fees.",
                "error"
            );
        } else {
            showMessage(message, "", "");
        }

        if (saveButton) {
            saveButton.disabled = invalid;
        }
    }

    [tuition, exam, hostel, paid].forEach(input => {
        input.addEventListener("input", update);
    });

    update();
}


/* =========================================================
   REGISTER OR UPDATE FEES
========================================================= */

async function saveFees(event) {
    event.preventDefault();

    const form = document.getElementById("addFeesForm");
    const message = document.getElementById("feesMessage");
    const button = document.getElementById("saveFeesButton");

    const registerNo =
        document.getElementById("addFeesRegisterNo").value.trim();

    const tuitionFee = Number(document.getElementById("tuitionFee").value);
    const examFee = Number(document.getElementById("examFee").value);
    const hostelFee = Number(document.getElementById("hostelFee").value);
    const paidFees = Number(document.getElementById("paidFees").value);

    const amounts = [tuitionFee, examFee, hostelFee, paidFees];

    if (!registerNo) {
        showMessage(message, "Enter the student register number.", "error");
        return;
    }

    if (amounts.some(value => !Number.isFinite(value) || value < 0)) {
        showMessage(message, "Enter valid fee amounts.", "error");
        return;
    }

    const totalFees = tuitionFee + examFee + hostelFee;

    if (paidFees > totalFees) {
        showMessage(
            message,
            "Paid fees cannot exceed total fees.",
            "error"
        );
        return;
    }

    const body = {
        registerNo,
        tuitionFee,
        tuitionStatus: document.getElementById("tuitionStatus").value,
        examFee,
        examStatus: document.getElementById("examStatus").value,
        hostelFee,
        hostelStatus: document.getElementById("hostelStatus").value,
        paidFees
    };

    setButtonLoading(button, true);

    try {
        // Check the register number without requiring a separate search.
        const studentData = await apiRequest(
            "/api/admin/student/" + encodeURIComponent(registerNo)
        );

        if (!studentData.student) {
            throw new Error(
                "Student not found. Add the student first, then register fees."
            );
        }

        // If fees already exist, update them instead of creating a duplicate.
        let existingFees = null;

        try {
            const feesData = await apiRequest(
                "/api/admin/student/" +
                encodeURIComponent(registerNo) +
                "/fees"
            );

            existingFees = feesData.fees || null;
        } catch (error) {
            // No existing fee record: create one below.
            console.log("No existing fee record:", error.message);
        }

        let response;

        if (existingFees && existingFees.id) {
            response = await apiRequest(
                "/api/admin/fees/" + encodeURIComponent(existingFees.id),
                {
                    method: "PUT",
                    body
                }
            );
        } else {
            response = await apiRequest("/api/admin/fees", {
                method: "POST",
                body
            });
        }

        showMessage(
            message,
            response.message ||
                (existingFees
                    ? "Student fees updated successfully."
                    : "Student fees registered successfully."),
            "success"
        );

        // Refresh the search section if it is showing this student.
        const searchInput =
            document.getElementById("feesSearchRegisterNo");

        if (searchInput &&
            searchInput.value.trim() === registerNo) {
            await searchFees();
        }

        if (form) form.reset();

        // Reset the calculated amounts after clearing the form.
        setupFeeCalculation();

    } catch (error) {
        showMessage(message, error.message, "error");
    } finally {
        setButtonLoading(button, false, "Register Fees");
    }
}


/* =========================================================
   SEARCH EXISTING STUDENT FEES
========================================================= */

async function searchFees(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("feesSearchRegisterNo");
    const result = document.getElementById("feesSearchResult");

    if (!input || !result) return;

    const registerNo = input.value.trim();

    if (!registerNo) {
        result.innerHTML =
            `<div class="error-box">Enter a register number.</div>`;
        return;
    }

    result.innerHTML =
        `<div class="loading-box">Loading fee information...</div>`;

    try {
        const studentData = await apiRequest(
            "/api/admin/student/" + encodeURIComponent(registerNo)
        );

        const student = studentData.student;

        if (!student) {
            throw new Error("Student not found.");
        }

        const feesData = await apiRequest(
            "/api/admin/student/" +
            encodeURIComponent(registerNo) +
            "/fees"
        );

        const fees = feesData.fees;

        if (!fees) {
            result.innerHTML = `
                <div class="data-card">
                    <h3>No fees registered yet</h3>
                    <p>Student: ${escapeHTML(student.name)}</p>
                    <p>Register No: ${escapeHTML(registerNo)}</p>
                    <button type="button" class="primary-button"
                        onclick="loadFees()">
                        Add Fees
                    </button>
                </div>
            `;
            return;
        }

        const tuition = Number(fees.tuition_fee || 0);
        const exam = Number(fees.exam_fee || 0);
        const hostel = Number(fees.hostel_fee || 0);
        const paid = Number(fees.paid_fees || 0);
        const total = tuition + exam + hostel;
        const pending = Math.max(total - paid, 0);

        result.innerHTML = `
            <div class="data-card">
                <h3>Student Fee Details</h3>
                <p>Student: <strong>${escapeHTML(student.name)}</strong></p>
                <p>Register No: <strong>${escapeHTML(registerNo)}</strong></p>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fee Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Tuition</td>
                                <td>₹${tuition.toFixed(2)}</td>
                                <td>${escapeHTML(fees.tuition_status || "Pending")}</td>
                            </tr>
                            <tr>
                                <td>Exam</td>
                                <td>₹${exam.toFixed(2)}</td>
                                <td>${escapeHTML(fees.exam_status || "Pending")}</td>
                            </tr>
                            <tr>
                                <td>Hostel</td>
                                <td>₹${hostel.toFixed(2)}</td>
                                <td>${escapeHTML(fees.hostel_status || "Pending")}</td>
                            </tr>
                            <tr>
                                <th>Total Fees</th>
                                <th>₹${total.toFixed(2)}</th>
                                <th></th>
                            </tr>
                            <tr>
                                <td>Paid Fees</td>
                                <td>₹${paid.toFixed(2)}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Pending Fees</td>
                                <td>₹${pending.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <button type="button" class="primary-button"
                    onclick="loadFees()">
                    Back to Add Fees
                </button>
            </div>
        `;
    } catch (error) {
        result.innerHTML =
            `<div class="error-box">❌ ${escapeHTML(error.message)}</div>`;
    }
}
/* =========================================================
   DAILY ATTENDANCE MANAGEMENT
========================================================= */

function loadAttendance() {

    const content =
        document.getElementById("contentSection");

    if (!content) return;

    content.innerHTML = `

        <div class="search-card">

            <h2>Manage Daily Attendance</h2>

            <p>
                Search a student and manage daily attendance.
            </p>

            <div class="search-row">

                <input
                    type="text"
                    id="attendanceRegisterNo"
                    placeholder="Enter Register Number"
                >

                <button
                    type="button"
                    onclick="searchAttendance()"
                    class="primary-button"
                >
                    🔍 Search
                </button>

            </div>

        </div>


        <div id="attendanceResult"></div>

    `;
}


/* =========================================================
   SEARCH STUDENT ATTENDANCE
========================================================= */

async function searchAttendance() {

    const input =
        document.getElementById(
            "attendanceRegisterNo"
        );

    const result =
        document.getElementById(
            "attendanceResult"
        );

    if (!input || !result) return;

    const registerNo =
        input.value.trim();

    if (!registerNo) {

        result.innerHTML = `
            <div class="error-box">
                Please enter register number.
            </div>
        `;

        return;
    }

    result.innerHTML = `
        <div class="loading-box">
            Loading attendance...
        </div>
    `;

    try {

        const data =
            await apiRequest(
                "/api/admin/student/" +
                encodeURIComponent(registerNo) +
                "/daily-attendance"
            );

        displayDailyAttendance(
            registerNo,
            data
        );

    } catch (error) {

        result.innerHTML = `
            <div class="error-box">
                ❌ ${escapeHTML(error.message)}
            </div>
        `;

    }
}


/* =========================================================
   DISPLAY DAILY ATTENDANCE
========================================================= */

function displayDailyAttendance(
    registerNo,
    data
) {

    const result =
        document.getElementById(
            "attendanceResult"
        );

    if (!result) return;

    const attendance =
        Array.isArray(data.attendance)
            ? data.attendance
            : [];

    const student =
        data.student || {};

    result.innerHTML = `

        <!-- STUDENT INFORMATION -->

        <div class="data-card">

            <h2>Student Information</h2>

            <div class="form-grid">

                <div class="form-group">

                    <label>Student Name</label>

                    <input
                        type="text"
                        value="${escapeAttribute(
                            student.name || "-"
                        )}"
                        readonly
                    >

                </div>


                <div class="form-group">

                    <label>Register Number</label>

                    <input
                        type="text"
                        value="${escapeAttribute(
                            student.registerNo ||
                            registerNo
                        )}"
                        readonly
                    >

                </div>


                <div class="form-group">

                    <label>Department</label>

                    <input
                        type="text"
                        value="${escapeAttribute(
                            student.department || "-"
                        )}"
                        readonly
                    >

                </div>


                <div class="form-group">

                    <label>Year</label>

                    <input
                        type="text"
                        value="${escapeAttribute(
                            student.year || "-"
                        )}"
                        readonly
                    >

                </div>

            </div>

        </div>


        <!-- ADD DAILY ATTENDANCE -->

        <div class="data-card">

            <h2>Add Daily Attendance</h2>

            <div class="form-grid">

                <div class="form-group">

                    <label>Date</label>

                    <input
                        type="date"
                        id="dailyAttendanceDate"
                    >

                </div>


                <div class="form-group">

                    <label>Subject</label>

                    <input
                        type="text"
                        id="dailyAttendanceSubject"
                        placeholder="Example: Java"
                    >

                </div>


                <div class="form-group">

                    <label>Status</label>

                    <select
                        id="dailyAttendanceStatus"
                    >

                        <option value="Present">
                            Present
                        </option>

                        <option value="Absent">
                            Absent
                        </option>

                        <option value="Late">
                            Late
                        </option>

                    </select>

                </div>

            </div>


            <button
                type="button"
                class="primary-button"
                onclick="saveDailyAttendance('${escapeAttribute(
                    registerNo
                )}')"
            >
                💾 Save Attendance
            </button>

        </div>


        <!-- ATTENDANCE REPORT -->

        <div class="data-card">

            <h2>Attendance Report</h2>

            <div class="form-grid">

                <div class="form-group">

                    <label>Filter by Date</label>

                    <input
                        type="date"
                        id="attendanceFilterDate"
                        onchange="renderDailyAttendanceTable()"
                    >

                </div>


                <div class="form-group">

                    <label>Filter by Subject</label>

                    <input
                        type="text"
                        id="attendanceFilterSubject"
                        placeholder="Example: Java"
                        oninput="renderDailyAttendanceTable()"
                    >

                </div>

            </div>


            <!-- SUMMARY -->

            <div class="attendance-summary-grid">

                <div class="attendance-summary-card">

                    <span>Present</span>

                    <strong id="dailyPresentCount">
                        0
                    </strong>

                </div>


                <div class="attendance-summary-card">

                    <span>Absent</span>

                    <strong id="dailyAbsentCount">
                        0
                    </strong>

                </div>


                <div class="attendance-summary-card">

                    <span>Late</span>

                    <strong id="dailyLateCount">
                        0
                    </strong>

                </div>


                <div class="attendance-summary-card">

                    <span>Attendance</span>

                    <strong
                        id="dailyAttendancePercentage"
                    >
                        0%
                    </strong>

                </div>

            </div>


            <!-- TABLE -->

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>Date</th>

                            <th>Subject</th>

                            <th>Status</th>

                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody
                        id="dailyAttendanceBody"
                    >
                    </tbody>

                </table>

            </div>

        </div>

    `;

    window.currentDailyAttendance =
        attendance;

    window.currentAttendanceRegisterNo =
        registerNo;

    renderDailyAttendanceTable();
}


/* =========================================================
   RENDER DAILY ATTENDANCE TABLE
========================================================= */

function renderDailyAttendanceTable() {

    const body =
        document.getElementById(
            "dailyAttendanceBody"
        );

    if (!body) return;

    const filterDate =
        document.getElementById(
            "attendanceFilterDate"
        )?.value || "";

    const filterSubject =
        document.getElementById(
            "attendanceFilterSubject"
        )?.value
        .trim()
        .toLowerCase() || "";

    const attendance =
        Array.isArray(
            window.currentDailyAttendance
        )
            ? window.currentDailyAttendance
            : [];

    const filtered =
        attendance.filter(item => {

            const dateMatch =
                !filterDate ||
                item.attendance_date === filterDate;

            const subjectMatch =
                !filterSubject ||
                String(item.subject || "")
                    .toLowerCase()
                    .includes(filterSubject);

            return dateMatch && subjectMatch;

        });


    let present = 0;
    let absent = 0;
    let late = 0;


    filtered.forEach(item => {

        if (item.status === "Present") {
            present++;
        }

        if (item.status === "Absent") {
            absent++;
        }

        if (item.status === "Late") {
            late++;
        }

    });


    const total =
        present +
        absent +
        late;

    const percentage =
        total > 0
            ? ((present + late) / total) * 100
            : 0;


    const presentElement =
        document.getElementById(
            "dailyPresentCount"
        );

    const absentElement =
        document.getElementById(
            "dailyAbsentCount"
        );

    const lateElement =
        document.getElementById(
            "dailyLateCount"
        );

    const percentageElement =
        document.getElementById(
            "dailyAttendancePercentage"
        );


    if (presentElement) {
        presentElement.textContent = present;
    }

    if (absentElement) {
        absentElement.textContent = absent;
    }

    if (lateElement) {
        lateElement.textContent = late;
    }

    if (percentageElement) {
        percentageElement.textContent =
            percentage.toFixed(2) + "%";
    }


    if (filtered.length === 0) {

        body.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="table-empty"
                >
                    No attendance records found.
                </td>

            </tr>

        `;

        return;
    }


    body.innerHTML =
        filtered.map(item => {

            let statusClass =
                "attendance-status";

            if (item.status === "Present") {
                statusClass += " present";
            } else if (item.status === "Absent") {
                statusClass += " absent";
            } else {
                statusClass += " late";
            }

            return `

                <tr>

                    <td>
                        ${escapeHTML(
                            item.attendance_date || ""
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            item.subject || ""
                        )}
                    </td>


                    <td>
                        <span class="${statusClass}">
                            ${escapeHTML(
                                item.status || ""
                            )}
                        </span>
                    </td>


                    <td>

                        <button
                            type="button"
                            class="primary-button"
                            onclick="editDailyAttendance(
                                ${Number(item.id)}
                            )"
                        >
                            ✏️ Edit
                        </button>


                        <button
                            type="button"
                            class="danger-button"
                            onclick="deleteDailyAttendance(
                                ${Number(item.id)}
                            )"
                        >
                            🗑️ Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");
}


/* =========================================================
   SAVE DAILY ATTENDANCE
========================================================= */

async function saveDailyAttendance(
    registerNo
) {

    const dateInput =
        document.getElementById(
            "dailyAttendanceDate"
        );

    const subjectInput =
        document.getElementById(
            "dailyAttendanceSubject"
        );

    const statusInput =
        document.getElementById(
            "dailyAttendanceStatus"
        );


    if (
        !dateInput ||
        !subjectInput ||
        !statusInput
    ) {

        alert(
            "Attendance form is not available."
        );

        return;
    }


    const attendanceDate =
        dateInput.value;

    const subject =
        subjectInput.value.trim();

    const status =
        statusInput.value;


    if (!attendanceDate) {

        alert(
            "Please select the date."
        );

        return;
    }


    if (!subject) {

        alert(
            "Please enter the subject."
        );

        return;
    }


    if (
        ![
            "Present",
            "Absent",
            "Late"
        ].includes(status)
    ) {

        alert(
            "Please select a valid status."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                "/api/admin/daily-attendance",
                {
                    method: "POST",

                    body: {

                        registerNo:
                            registerNo,

                        attendanceDate:
                            attendanceDate,

                        subject:
                            subject,

                        status:
                            status
                    }
                }
            );


        alert(
            result.message ||
            "Daily attendance saved successfully."
        );


        subjectInput.value = "";

        statusInput.value =
            "Present";


        await searchAttendance();

    } catch (error) {

        alert(
            "Unable to save attendance: " +
            error.message
        );

    }
}


/* =========================================================
   EDIT DAILY ATTENDANCE
========================================================= */

async function editDailyAttendance(
    attendanceId
) {

    const attendance =
        window.currentDailyAttendance || [];

    const item =
        attendance.find(
            record =>
                Number(record.id) ===
                Number(attendanceId)
        );


    if (!item) {

        alert(
            "Attendance record not found."
        );

        return;
    }


    const newDate =
        prompt(
            "Enter attendance date (YYYY-MM-DD):",
            item.attendance_date || ""
        );


    if (newDate === null) {
        return;
    }


    const newSubject =
        prompt(
            "Enter subject:",
            item.subject || ""
        );


    if (newSubject === null) {
        return;
    }


    const newStatus =
        prompt(
            "Enter status: Present, Absent or Late",
            item.status || "Present"
        );


    if (newStatus === null) {
        return;
    }


    const cleanDate =
        newDate.trim();

    const cleanSubject =
        newSubject.trim();

    const cleanStatus =
        newStatus.trim();


    if (!cleanDate) {

        alert(
            "Date is required."
        );

        return;
    }


    if (!cleanSubject) {

        alert(
            "Subject is required."
        );

        return;
    }


    if (
        ![
            "Present",
            "Absent",
            "Late"
        ].includes(cleanStatus)
    ) {

        alert(
            "Invalid status."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                "/api/admin/daily-attendance/" +
                attendanceId,
                {
                    method: "PUT",

                    body: {

                        attendanceDate:
                            cleanDate,

                        subject:
                            cleanSubject,

                        status:
                            cleanStatus

                    }
                }
            );


        alert(
            result.message ||
            "Attendance updated successfully."
        );


        await searchAttendance();

    } catch (error) {

        alert(
            "Unable to update attendance: " +
            error.message
        );

    }
}


/* =========================================================
   DELETE DAILY ATTENDANCE
========================================================= */

async function deleteDailyAttendance(
    attendanceId
) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this attendance record?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const result =
            await apiRequest(
                "/api/admin/daily-attendance/" +
                attendanceId,
                {
                    method: "DELETE"
                }
            );


        alert(
            result.message ||
            "Attendance deleted successfully."
        );


        await searchAttendance();

    } catch (error) {

        alert(
            "Unable to delete attendance: " +
            error.message
        );

    }
}

/* =========================================================
   VIEW STUDENTS
========================================================= */

async function loadStudents() {
    const content = document.getElementById("contentSection");
    if (!content) return;

    content.innerHTML = `<div class="loading-box">Loading students...</div>`;

    try {
        const data = await apiRequest("/api/admin/students");
        const students = Array.isArray(data.students) ? data.students : [];
        displayStudents(students);
    } catch (error) {
        content.innerHTML = `<div class="error-box">❌ ${escapeHTML(error.message)}</div>`;
    }
}

function displayStudents(students) {
    const content = document.getElementById("contentSection");
    if (!content) return;

    content.innerHTML = `
        <div class="data-card">
            <div class="card-header-row">
                <div>
                    <h2>All Students</h2>
                    <p>Total Students: <strong>${students.length}</strong></p>
                </div>
                <button onclick="showSection('addStudent')" class="primary-button">➕ Add Student</button>
            </div>

            ${students.length === 0 ? `
                <div class="empty-box">
                    <div class="empty-icon">👨‍🎓</div>
                    <p>No students found.</p>
                </div>
            ` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Register No</th>
                                <th>Gender</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Department</th>
                                <th>Year</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr>
                                    <td>${Number(student.id)}</td>
                                    <td>${escapeHTML(student.name)}</td>
                                    <td>${escapeHTML(student.registerNo)}</td>
                                    <td>${getGenderBadge(student.gender)}</td>
                                    <td>${escapeHTML(student.email)}</td>
                                    <td>${escapeHTML(student.phone)}</td>
                                    <td>${escapeHTML(student.department)}</td>
                                    <td>${escapeHTML(student.year)}</td>
                                    <td>
                                        <button type="button" class="small-button" title="View Profile" onclick="openStudentProfile('${escapeAttribute(student.registerNo)}')">
                                            👤
                                        </button>
                                        <button type="button" class="small-danger-button" title="Delete Student" onclick="deleteStudent('${escapeAttribute(student.registerNo)}')">
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function openStudentProfile(registerNo) {
    showSection("studentProfile");

    setTimeout(function () {
        const input = document.getElementById("profileRegisterNo");
        if (input) {
            input.value = registerNo;
            searchStudentProfile();
        }
    }, 100);
}

/* =========================================================
   UTILITIES AND HELPER FUNCTIONS
========================================================= */

function setContent(html) {
    const content = document.getElementById("contentSection");
    if (content) content.innerHTML = html;
}

function setButtonLoading(button, isLoading, originalText = "") {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = "Loading...";
    } else {
        button.disabled = false;
        button.textContent = originalText || button.dataset.originalText || "Submit";
    }
}

function numberValue(val) {
    const num = Number(val);
    return Number.isFinite(num) ? num : 0;
}

function normalizeGender(gender) {
    return String(gender || "").trim().toLowerCase();
}

function getGenderBadge(gender) {
    const normalized = normalizeGender(gender);

    if (normalized === "male") {
        return `<span class="gender-badge male">👨 Male</span>`;
    }

    if (normalized === "female") {
        return `<span class="gender-badge female">👩 Female</span>`;
    }

    return `<span class="gender-badge other">🧑 ${escapeHTML(gender || "Not Specified")}</span>`;
}

function getNumberValue(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    const value = Number(element.value);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = "message-box " + (type || "");
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

/* =========================================================
   GLOBAL ERROR HANDLERS
========================================================= */

window.addEventListener("error", function (event) {
    console.error("Dashboard Error:", event.error || event.message);
});

window.addEventListener("unhandledrejection", function (event) {
    console.error("Unhandled Promise Error:", event.reason);
});