// ============================================================
// ERODE ARTS AND SCIENCE COLLEGE - STUDENT PORTAL
// COMPLETE APP.JS
// ============================================================

const express = require("express");
const path = require("path");
const crypto = require("crypto");

const db = require("./database");

const app = express();
const PORT = 3000;

// ============================================================
// ADMIN SESSION
// ============================================================

const adminSessions = new Map();

const ADMIN_SESSION_COOKIE = "admin_session";

const ADMIN_SESSION_DURATION =
    8 * 60 * 60 * 1000;


// ============================================================
// CREATE ADMIN SESSION
// ============================================================

function createAdminSession(admin) {

    const token =
        crypto.randomBytes(32).toString("hex");

    adminSessions.set(token, {
        adminId: admin.id,
        username: admin.username,
        expiresAt:
            Date.now() + ADMIN_SESSION_DURATION
    });

    return token;
}


// ============================================================
// GET COOKIE
// ============================================================

function getCookie(req, name) {

    const cookieHeader =
        req.headers.cookie || "";

    const cookies =
        cookieHeader.split(";");

    for (const cookie of cookies) {

        const parts =
            cookie.trim().split("=");

        const key =
            parts.shift();

        if (key === name) {

            return decodeURIComponent(
                parts.join("=")
            );

        }

    }

    return null;
}


// ============================================================
// ADMIN AUTHENTICATION
// ============================================================

function requireAdmin(req, res, next) {

    const token =
        getCookie(
            req,
            ADMIN_SESSION_COOKIE
        );

    if (!token) {

        return res.status(401).json({
            success: false,
            message:
                "Admin login required."
        });

    }

    const session =
        adminSessions.get(token);

    if (!session) {

        return res.status(401).json({
            success: false,
            message:
                "Admin session is invalid or expired."
        });

    }

    if (
        Date.now() >
        session.expiresAt
    ) {

        adminSessions.delete(token);

        return res.status(401).json({
            success: false,
            message:
                "Admin session has expired. Please login again."
        });

    }

    req.admin = session;

    next();
}


// ============================================================
// REMOVE EXPIRED SESSIONS
// ============================================================

setInterval(() => {

    const now = Date.now();

    for (
        const [token, session]
        of adminSessions.entries()
    ) {

        if (
            now >
            session.expiresAt
        ) {

            adminSessions.delete(token);

        }

    }

}, 30 * 60 * 1000);


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ============================================================
// DAILY ATTENDANCE TABLE
// ============================================================

db.serialize(() => {

    db.run(
        `
        CREATE TABLE IF NOT EXISTS daily_attendance (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            student_id INTEGER NOT NULL,

            attendance_date TEXT NOT NULL,

            subject TEXT NOT NULL,

            status TEXT NOT NULL,

            FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE,

            UNIQUE (
                student_id,
                attendance_date,
                subject
            )

        )
        `,
        (err) => {

            if (err) {

                console.error(
                    "Daily attendance table error:",
                    err.message
                );

            } else {

                console.log(
                    "Daily attendance table ready."
                );

            }

        }
    );


    db.run(
        `
        CREATE INDEX IF NOT EXISTS
        idx_daily_attendance_student_date

        ON daily_attendance(
            student_id,
            attendance_date
        )
        `,
        (err) => {

            if (err) {

                console.error(
                    "Daily attendance index error:",
                    err.message
                );

            }

        }
    );

});


// ============================================================
// HOME PAGE
// ============================================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// ============================================================
// SERVER TEST
// ============================================================

app.get(
    "/api/test",
    (req, res) => {

        res.json({
            success: true,
            message:
                "Server is working!"
        });

    }
);


// ============================================================
// STUDENT REGISTRATION
// ============================================================

app.post(
    "/api/register",
    (req, res) => {

        const {
            name,
            registerNo,
            email,
            phone,
            department,
            year,
            gender,
            password
        } = req.body;


        if (
            !name ||
            !registerNo ||
            !email ||
            !phone ||
            !department ||
            !year ||
            !gender ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All fields are required."
            });

        }


        db.run(
            `
            INSERT INTO students
            (
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender,
                password
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender,
                password
            ],
            function (err) {

                if (err) {

                    console.error(
                        "Registration error:",
                        err.message
                    );

                    return res.status(400).json({
                        success: false,
                        message:
                            "Register Number already exists."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Student registered successfully!",
                    studentId:
                        this.lastID
                });

            }
        );

    }
);


// ============================================================
// STUDENT LOGIN
// ============================================================

app.post(
    "/api/login",
    (req, res) => {

        const {
            registerNo,
            password
        } = req.body;


        if (
            !registerNo ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Register Number and Password are required."
            });

        }


        db.get(
            `
            SELECT
                id,
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender
            FROM students
            WHERE registerNo = ?
            AND password = ?
            `,
            [
                registerNo,
                password
            ],
            (err, student) => {

                if (err) {

                    console.error(
                        "Student login error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Invalid Register Number or Password."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Login successful!",
                    student
                });

            }
        );

    }
);


// ============================================================
// ADMIN LOGIN
// ============================================================

app.post(
    "/api/admin/login",
    (req, res) => {

        const {
            username,
            password
        } = req.body;


        if (
            !username ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Username and password are required."
            });

        }


        db.get(
            `
            SELECT
                id,
                username
            FROM admins
            WHERE username = ?
            AND password = ?
            `,
            [
                username,
                password
            ],
            (err, admin) => {

                if (err) {

                    console.error(
                        "Admin database error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Admin database error."
                    });

                }


                if (!admin) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Invalid admin username or password."
                    });

                }


                const sessionToken =
                    createAdminSession(admin);


                res.setHeader(
                    "Set-Cookie",
                    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(ADMIN_SESSION_DURATION / 1000)}`
                );


                return res.json({
                    success: true,
                    message:
                        "Admin login successful!",
                    admin
                });

            }
        );

    }
);


// ============================================================
// STUDENT PROFILE
// ============================================================

app.get(
    "/api/student/:registerNo",
    (req, res) => {

        const registerNo =
            req.params.registerNo;


        db.get(
            `
            SELECT
                id,
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    console.error(
                        "Get profile error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                return res.json({
                    success: true,
                    student
                });

            }
        );

    }
);


app.put(
    "/api/student/:registerNo",
    (req, res) => {

        const registerNo =
            req.params.registerNo;

        const {
            name,
            email,
            phone,
            gender
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !gender
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, Email, Phone and Gender are required."
            });

        }


        db.run(
            `
            UPDATE students
            SET
                name = ?,
                email = ?,
                phone = ?,
                gender = ?
            WHERE registerNo = ?
            `,
            [
                name,
                email,
                phone,
                gender,
                registerNo
            ],
            function (err) {

                if (err) {

                    console.error(
                        "Update profile error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to update profile."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Profile updated successfully!"
                });

            }
        );

    }
);


// ============================================================
// ADMIN API SECURITY
// ============================================================

app.use(
    "/api/admin",
    (req, res, next) => {

        if (
            req.path === "/login" &&
            req.method === "POST"
        ) {

            return next();

        }


        if (
            req.path === "/logout" &&
            req.method === "POST"
        ) {

            return next();

        }


        return requireAdmin(
            req,
            res,
            next
        );

    }
);


// ============================================================
// ADMIN LOGOUT
// ============================================================

app.post(
    "/api/admin/logout",
    (req, res) => {

        const token =
            getCookie(
                req,
                ADMIN_SESSION_COOKIE
            );


        if (token) {

            adminSessions.delete(token);

        }


        res.setHeader(
            "Set-Cookie",
            `${ADMIN_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
        );


        return res.json({
            success: true,
            message:
                "Admin logged out successfully."
        });

    }
);


// ============================================================
// ADMIN SESSION
// ============================================================

app.get(
    "/api/admin/session",
    (req, res) => {

        return res.json({
            success: true,
            admin: {
                id:
                    req.admin.adminId,
                username:
                    req.admin.username
            }
        });

    }
);


// ============================================================
// ADMIN - GET ALL STUDENTS
// ============================================================

app.get(
    "/api/admin/students",
    (req, res) => {

        db.all(
            `
            SELECT
                id,
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender
            FROM students
            ORDER BY id DESC
            `,
            [],
            (err, students) => {

                if (err) {

                    console.error(
                        "Get students error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to get students."
                    });

                }


                return res.json({
                    success: true,
                    students
                });

            }
        );

    }
);


// ============================================================
// ADMIN - ADD STUDENT
// ============================================================

app.post(
    "/api/admin/student",
    (req, res) => {

        const {
            name,
            registerNo,
            email,
            phone,
            department,
            year,
            gender,
            password
        } = req.body;


        if (
            !name ||
            !registerNo ||
            !email ||
            !phone ||
            !department ||
            !year ||
            !gender ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All student fields are required."
            });

        }


        db.run(
            `
            INSERT INTO students
            (
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender,
                password
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender,
                password
            ],
            function (err) {

                if (err) {

                    console.error(
                        "Admin add student error:",
                        err.message
                    );

                    return res.status(400).json({
                        success: false,
                        message:
                            "Register Number already exists."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Student added successfully!",
                    studentId:
                        this.lastID
                });

            }
        );

    }
);


// ============================================================
// ADMIN - GET STUDENT BY REGISTER NUMBER
// ============================================================

app.get(
    "/api/admin/student/:registerNo",
    (req, res) => {

        const registerNo =
            req.params.registerNo;


        db.get(
            `
            SELECT
                id,
                name,
                registerNo,
                email,
                phone,
                department,
                year,
                gender
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    console.error(
                        "Search student error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error while searching for student."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                return res.json({
                    success: true,
                    student
                });

            }
        );

    }
);


// ============================================================
// ADMIN - UPDATE STUDENT
// ============================================================

app.put(
    "/api/admin/student/:registerNo",
    (req, res) => {

        const registerNo =
            req.params.registerNo;

        const {
            name,
            email,
            phone,
            department,
            year,
            gender,
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !department ||
            !year ||
            !gender
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All student details are required."
            });

        }


        let sql;
        let values;


        if (
            password &&
            password.trim()
        ) {

            sql = `
                UPDATE students
                SET
                    name = ?,
                    email = ?,
                    phone = ?,
                    department = ?,
                    year = ?,
                    gender = ?,
                    password = ?
                WHERE registerNo = ?
            `;


            values = [
                name,
                email,
                phone,
                department,
                year,
                gender,
                password.trim(),
                registerNo
            ];

        } else {

            sql = `
                UPDATE students
                SET
                    name = ?,
                    email = ?,
                    phone = ?,
                    department = ?,
                    year = ?,
                    gender = ?
                WHERE registerNo = ?
            `;


            values = [
                name,
                email,
                phone,
                department,
                year,
                gender,
                registerNo
            ];

        }


        db.run(
            sql,
            values,
            function (err) {

                if (err) {

                    console.error(
                        "Update student error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to update student."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Student updated successfully!"
                });

            }
        );

    }
);


// ============================================================
// ADMIN - DELETE STUDENT
// ============================================================

app.delete(
    "/api/admin/student/:registerNo",
    (req, res) => {

        const registerNo =
            req.params.registerNo;


        db.get(
            `
            SELECT id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    console.error(
                        "Delete student search error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                const studentId =
                    student.id;


                db.serialize(() => {

                    db.run(
                        "DELETE FROM marks WHERE student_id = ?",
                        [studentId]
                    );


                    db.run(
                        "DELETE FROM fees WHERE student_id = ?",
                        [studentId]
                    );


                    db.run(
                        "DELETE FROM attendance WHERE student_id = ?",
                        [studentId]
                    );


                    db.run(
                        "DELETE FROM daily_attendance WHERE student_id = ?",
                        [studentId]
                    );


                    db.run(
                        "DELETE FROM students WHERE id = ?",
                        [studentId],
                        function (deleteError) {

                            if (deleteError) {

                                console.error(
                                    "Delete student error:",
                                    deleteError.message
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to delete student."
                                });

                            }


                            return res.json({
                                success: true,
                                message:
                                    "Student deleted successfully!"
                            });

                        }
                    );

                });

            }
        );

    }
);


// ============================================================
// ADMIN - ADD MARKS
// ============================================================

app.post(
    "/api/admin/marks",
    (req, res) => {

        const {
            registerNo,
            semester,
            subject,
            internal,
            external
        } = req.body;


        if (
            !registerNo ||
            !semester ||
            !subject ||
            internal === undefined ||
            external === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All marks fields are required."
            });

        }


        const internalMark =
            Number(internal);

        const externalMark =
            Number(external);


        if (
            !Number.isFinite(internalMark) ||
            !Number.isFinite(externalMark)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Internal and external marks must be numbers."
            });

        }


        if (
            internalMark < 0 ||
            internalMark > 25 ||
            externalMark < 0 ||
            externalMark > 75
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Internal marks must be 0-25 and external marks must be 0-75."
            });

        }


        const total =
            internalMark +
            externalMark;


        db.get(
            `
            SELECT id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                db.run(
                    `
                    INSERT INTO marks
                    (
                        student_id,
                        semester,
                        subject,
                        marks,
                        internal,
                        external,
                        total
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        student.id,
                        semester,
                        subject.trim(),
                        total,
                        internalMark,
                        externalMark,
                        total
                    ],
                    function (insertError) {

                        if (insertError) {

                            console.error(
                                "Save marks error:",
                                insertError.message
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to save marks."
                            });

                        }


                        return res.json({
                            success: true,
                            message:
                                "Marks saved successfully!",
                            markId:
                                this.lastID
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// ADMIN - GET ALL MARKS
// ============================================================

app.get(
    "/api/admin/marks",
    (req, res) => {

        db.all(
            `
            SELECT
                marks.id,
                students.registerNo,
                students.name AS student_name,
                marks.semester,
                marks.subject,
                marks.internal,
                marks.external,
                marks.total
            FROM marks
            INNER JOIN students
                ON students.id = marks.student_id
            ORDER BY marks.id DESC
            `,
            [],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Get all marks error:",
                        err.message
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to retrieve marks."
                    });

                }


                return res.json({
                    success: true,
                    marks: rows
                });

            }
        );

    }
);


// ============================================================
// ADMIN - GET MARKS FOR ONE STUDENT
// ============================================================

app.get(
    "/api/admin/student/:registerNo/marks",
    (req, res) => {

        const registerNo =
            req.params.registerNo;

        const semester =
            req.query.semester;


        db.get(
            `
            SELECT id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error while finding student."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                let sql = `
                    SELECT
                        marks.id,
                        students.registerNo,
                        students.name AS student_name,
                        marks.semester,
                        marks.subject,
                        marks.internal,
                        marks.external,
                        marks.total
                    FROM marks
                    INNER JOIN students
                        ON students.id = marks.student_id
                    WHERE marks.student_id = ?
                `;


                const params =
                    [student.id];


                if (semester) {

                    sql +=
                        " AND marks.semester = ?";

                    params.push(
                        semester
                    );

                }


                sql +=
                    " ORDER BY marks.id ASC";


                db.all(
                    sql,
                    params,
                    (marksError, rows) => {

                        if (marksError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to retrieve student marks."
                            });

                        }


                        return res.json({
                            success: true,
                            marks:
                                rows
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// STUDENT - GET MARKS
// ============================================================

app.get(
    "/api/student/:registerNo/marks",
    (req, res) => {

        const registerNo =
            req.params.registerNo;

        const semester =
            req.query.semester;


        db.get(
            `
            SELECT id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                let sql = `
                    SELECT
                        id,
                        semester,
                        subject,
                        internal,
                        external,
                        total
                    FROM marks
                    WHERE student_id = ?
                `;


                const params =
                    [student.id];


                if (semester) {

                    sql +=
                        " AND semester = ?";

                    params.push(
                        semester
                    );

                }


                sql +=
                    " ORDER BY id ASC";


                db.all(
                    sql,
                    params,
                    (marksError, marks) => {

                        if (marksError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to get marks."
                            });

                        }


                        return res.json({
                            success: true,
                            marks
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// ADMIN - UPDATE MARKS
// ============================================================

app.put(
    "/api/admin/marks/:id",
    (req, res) => {

        const markId =
            req.params.id;

        const {
            internal,
            external,
            subject,
            semester
        } = req.body;


        const internalMark =
            Number(internal);

        const externalMark =
            Number(external);


        if (
            !subject ||
            !semester ||
            !Number.isFinite(internalMark) ||
            !Number.isFinite(externalMark)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid marks details are required."
            });

        }


        if (
            internalMark < 0 ||
            internalMark > 25 ||
            externalMark < 0 ||
            externalMark > 75
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Internal marks must be 0-25 and external marks must be 0-75."
            });

        }


        const total =
            internalMark +
            externalMark;


        db.run(
            `
            UPDATE marks
            SET
                semester = ?,
                subject = ?,
                marks = ?,
                internal = ?,
                external = ?,
                total = ?
            WHERE id = ?
            `,
            [
                semester,
                subject.trim(),
                total,
                internalMark,
                externalMark,
                total,
                markId
            ],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to update marks."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Marks record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Marks updated successfully!"
                });

            }
        );

    }
);


// ============================================================
// ADMIN - DELETE MARKS
// ============================================================

app.delete(
    "/api/admin/marks/:id",
    (req, res) => {

        db.run(
            `
            DELETE FROM marks
            WHERE id = ?
            `,
            [req.params.id],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to delete marks."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Marks record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Marks deleted successfully!"
                });

            }
        );

    }
);


// ============================================================
// ADMIN - ADD FEES
// ============================================================

app.post(
    "/api/admin/fees",
    (req, res) => {

        const {
            registerNo,
            tuitionFee,
            tuitionStatus,
            examFee,
            examStatus,
            hostelFee,
            hostelStatus,
            paidFees
        } = req.body;


        if (!registerNo) {

            return res.status(400).json({
                success: false,
                message:
                    "Register Number is required."
            });

        }


        const tuition =
            Number(tuitionFee) || 0;

        const exam =
            Number(examFee) || 0;

        const hostel =
            Number(hostelFee) || 0;

        const paid =
            Number(paidFees) || 0;


        if (
            tuition < 0 ||
            exam < 0 ||
            hostel < 0 ||
            paid < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Fee amounts cannot be negative."
            });

        }


        const total =
            tuition +
            exam +
            hostel;


        const pending =
            Math.max(
                total - paid,
                0
            );


        db.get(
            `
            SELECT id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                db.run(
                    `
                    INSERT INTO fees
                    (
                        student_id,
                        total_fees,
                        paid_fees,
                        pending_fees,
                        tuition_fee,
                        tuition_status,
                        exam_fee,
                        exam_status,
                        hostel_fee,
                        hostel_status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        student.id,
                        total,
                        paid,
                        pending,
                        tuition,
                        tuitionStatus ||
                            "Pending",
                        exam,
                        examStatus ||
                            "Pending",
                        hostel,
                        hostelStatus ||
                            "Pending"
                    ],
                    function (insertError) {

                        if (insertError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to save fees."
                            });

                        }


                        return res.json({
                            success: true,
                            message:
                                "Fees saved successfully!",
                            feeId:
                                this.lastID
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// STUDENT - GET FEES
// ============================================================

app.get(
    "/api/student/:registerNo/fees",
    (req, res) => {

        db.get(
            `
            SELECT
                f.id,
                f.total_fees,
                f.paid_fees,
                f.pending_fees,
                f.tuition_fee,
                f.tuition_status,
                f.exam_fee,
                f.exam_status,
                f.hostel_fee,
                f.hostel_status
            FROM fees f
            INNER JOIN students s
                ON f.student_id = s.id
            WHERE s.registerNo = ?
            ORDER BY f.id DESC
            LIMIT 1
            `,
            [req.params.registerNo],
            (err, fees) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to get fees."
                    });

                }


                return res.json({
                    success: true,
                    fees:
                        fees || null
                });

            }
        );

    }
);


// ============================================================
// ADMIN - SEARCH FEES
// ============================================================

app.get(
    "/api/admin/student/:registerNo/fees",
    (req, res) => {

        const registerNo =
            req.params.registerNo;


        if (!registerNo) {

            return res.status(400).json({
                success: false,
                message:
                    "Register Number is required."
            });

        }


        db.get(
            `
            SELECT
                f.id,
                f.total_fees,
                f.paid_fees,
                f.pending_fees,
                f.tuition_fee,
                f.tuition_status,
                f.exam_fee,
                f.exam_status,
                f.hostel_fee,
                f.hostel_status,
                s.name AS student_name,
                s.registerNo AS register_no
            FROM fees f
            INNER JOIN students s
                ON f.student_id = s.id
            WHERE s.registerNo = ?
            ORDER BY f.id DESC
            LIMIT 1
            `,
            [registerNo],
            (err, fees) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load fee details."
                    });

                }


                if (!fees) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "No fee record found for this student.",
                        fees:
                            null
                    });

                }


                return res.json({
                    success: true,
                    fees
                });

            }
        );

    }
);


// ============================================================
// ADMIN - UPDATE FEES
// ============================================================

app.put(
    "/api/admin/fees/:id",
    (req, res) => {

        const {
            tuitionFee,
            tuitionStatus,
            examFee,
            examStatus,
            hostelFee,
            hostelStatus,
            paidFees
        } = req.body;


        const tuition =
            Number(tuitionFee) || 0;

        const exam =
            Number(examFee) || 0;

        const hostel =
            Number(hostelFee) || 0;

        const paid =
            Number(paidFees) || 0;


        if (
            tuition < 0 ||
            exam < 0 ||
            hostel < 0 ||
            paid < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Fee amounts cannot be negative."
            });

        }


        const total =
            tuition +
            exam +
            hostel;


        const pending =
            Math.max(
                total - paid,
                0
            );


        db.run(
            `
            UPDATE fees
            SET
                total_fees = ?,
                paid_fees = ?,
                pending_fees = ?,
                tuition_fee = ?,
                tuition_status = ?,
                exam_fee = ?,
                exam_status = ?,
                hostel_fee = ?,
                hostel_status = ?
            WHERE id = ?
            `,
            [
                total,
                paid,
                pending,
                tuition,
                tuitionStatus ||
                    "Pending",
                exam,
                examStatus ||
                    "Pending",
                hostel,
                hostelStatus ||
                    "Pending",
                req.params.id
            ],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to update fees."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Fee record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Fees updated successfully!"
                });

            }
        );

    }
);


// ============================================================
// ADMIN - DELETE FEES
// ============================================================

app.delete(
    "/api/admin/fees/:id",
    (req, res) => {

        db.run(
            `
            DELETE FROM fees
            WHERE id = ?
            `,
            [req.params.id],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to delete fee record."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Fee record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Fees deleted successfully!"
                });

            }
        );

    }
);


// ============================================================
// OLD SEMESTER ATTENDANCE - ADD
// ============================================================

app.post(
    "/api/admin/attendance",
    (req, res) => {

        const {
            registerNo,
            semester,
            totalClasses,
            presentClasses
        } = req.body;


        if (
            !registerNo ||
            !semester ||
            totalClasses === undefined ||
            presentClasses === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "All attendance fields are required."
            });

        }


        const total =
            Number(totalClasses);

        const present =
            Number(presentClasses);


        if (
            !Number.isFinite(total) ||
            !Number.isFinite(present) ||
            total <= 0 ||
            present < 0 ||
            present > total
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance values."
            });

        }


        const absent =
            total - present;


        const percentage =
            Number(
                (
                    (present / total) *
                    100
                ).toFixed(2)
            );


        db.get(
            `
            SELECT id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                db.run(
                    `
                    INSERT INTO attendance
                    (
                        student_id,
                        semester,
                        total_classes,
                        present_classes,
                        absent_classes,
                        attendance_percentage
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        student.id,
                        semester,
                        total,
                        present,
                        absent,
                        percentage
                    ],
                    function (insertError) {

                        if (insertError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to save attendance."
                            });

                        }


                        return res.json({
                            success: true,
                            message:
                                "Attendance saved successfully!",
                            attendanceId:
                                this.lastID
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// STUDENT - GET OLD ATTENDANCE
// ============================================================

app.get(
    "/api/student/:registerNo/attendance",
    (req, res) => {

        db.all(
            `
            SELECT
                a.id,
                a.semester,
                a.total_classes,
                a.present_classes,
                a.absent_classes,
                a.attendance_percentage
            FROM attendance a
            INNER JOIN students s
                ON a.student_id = s.id
            WHERE s.registerNo = ?
            ORDER BY a.id DESC
            `,
            [req.params.registerNo],
            (err, attendance) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to get attendance."
                    });

                }


                return res.json({
                    success: true,
                    attendance
                });

            }
        );

    }
);


// ============================================================
// ADMIN - SEARCH OLD ATTENDANCE
// ============================================================

app.get(
    "/api/admin/student/:registerNo/attendance",
    (req, res) => {

        const registerNo =
            req.params.registerNo;

        const semester =
            req.query.semester;


        let sql = `
            SELECT
                a.id,
                a.semester,
                a.total_classes,
                a.present_classes,
                a.absent_classes,
                a.attendance_percentage,
                s.name AS student_name,
                s.registerNo AS register_no
            FROM attendance a
            INNER JOIN students s
                ON a.student_id = s.id
            WHERE s.registerNo = ?
        `;


        const params =
            [registerNo];


        if (semester) {

            sql +=
                " AND a.semester = ?";

            params.push(
                semester
            );

        }


        sql +=
            " ORDER BY a.id DESC";


        db.all(
            sql,
            params,
            (err, attendance) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to load attendance."
                    });

                }


                return res.json({
                    success: true,
                    attendance
                });

            }
        );

    }
);


// ============================================================
// ADMIN - UPDATE OLD ATTENDANCE
// ============================================================

app.put(
    "/api/admin/attendance/:id",
    (req, res) => {

        const {
            semester,
            totalClasses,
            presentClasses
        } = req.body;


        const total =
            Number(totalClasses);

        const present =
            Number(presentClasses);


        if (
            !semester ||
            !Number.isFinite(total) ||
            !Number.isFinite(present) ||
            total <= 0 ||
            present < 0 ||
            present > total
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance details."
            });

        }


        const absent =
            total - present;


        const percentage =
            Number(
                (
                    (present / total) *
                    100
                ).toFixed(2)
            );


        db.run(
            `
            UPDATE attendance
            SET
                semester = ?,
                total_classes = ?,
                present_classes = ?,
                absent_classes = ?,
                attendance_percentage = ?
            WHERE id = ?
            `,
            [
                semester,
                total,
                present,
                absent,
                percentage,
                req.params.id
            ],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to update attendance."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Attendance record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Attendance updated successfully!"
                });

            }
        );

    }
);


// ============================================================
// ADMIN - DELETE OLD ATTENDANCE
// ============================================================

app.delete(
    "/api/admin/attendance/:id",
    (req, res) => {

        db.run(
            `
            DELETE FROM attendance
            WHERE id = ?
            `,
            [req.params.id],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to delete attendance."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Attendance record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Attendance deleted successfully!"
                });

            }
        );

    }
);


// ============================================================
// DAILY ATTENDANCE HELPERS
// ============================================================

function isValidAttendanceStatus(status) {

    return [
        "Present",
        "Absent",
        "Late"
    ].includes(status);

}


function isValidAttendanceDate(value) {

    return /^\d{4}-\d{2}-\d{2}$/.test(
        String(value || "")
    );

}


// ============================================================
// ADMIN - ADD DAILY ATTENDANCE
// ============================================================

app.post(
    "/api/admin/daily-attendance",
    (req, res) => {

        const {
            registerNo,
            attendanceDate,
            subject,
            status
        } = req.body;


        if (
            !registerNo ||
            !attendanceDate ||
            !subject ||
            !status
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Register number, date, subject and status are required."
            });

        }


        if (
            !isValidAttendanceDate(
                attendanceDate
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid date format. Use YYYY-MM-DD."
            });

        }


        if (
            !isValidAttendanceStatus(
                status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance status."
            });

        }


        db.get(
            `
            SELECT
                id
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                const cleanSubject =
                    subject.trim();


                db.get(
                    `
                    SELECT
                        id
                    FROM daily_attendance
                    WHERE student_id = ?
                    AND attendance_date = ?
                    AND LOWER(subject) = LOWER(?)
                    `,
                    [
                        student.id,
                        attendanceDate,
                        cleanSubject
                    ],
                    (duplicateError, existing) => {

                        if (duplicateError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Database error."
                            });

                        }


                        if (existing) {

                            return res.status(409).json({
                                success: false,
                                message:
                                    "Attendance for this subject and date already exists."
                            });

                        }


                        db.run(
                            `
                            INSERT INTO daily_attendance
                            (
                                student_id,
                                attendance_date,
                                subject,
                                status
                            )
                            VALUES (?, ?, ?, ?)
                            `,
                            [
                                student.id,
                                attendanceDate,
                                cleanSubject,
                                status
                            ],
                            function (insertError) {

                                if (insertError) {

                                    console.error(
                                        "Add daily attendance error:",
                                        insertError.message
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Unable to save daily attendance."
                                    });

                                }


                                return res.json({
                                    success: true,
                                    message:
                                        "Daily attendance saved successfully!",
                                    attendanceId:
                                        this.lastID
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ============================================================
// ADMIN - GET DAILY ATTENDANCE
// ============================================================

app.get(
    "/api/admin/student/:registerNo/daily-attendance",
    (req, res) => {

        const registerNo =
            req.params.registerNo;


        db.get(
            `
            SELECT
                id,
                name,
                registerNo,
                department,
                year
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                db.all(
                    `
                    SELECT
                        id,
                        attendance_date,
                        subject,
                        status
                    FROM daily_attendance
                    WHERE student_id = ?
                    ORDER BY
                        attendance_date DESC,
                        id DESC
                    `,
                    [student.id],
                    (attendanceError, attendance) => {

                        if (attendanceError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to load daily attendance."
                            });

                        }


                        return res.json({
                            success: true,
                            student,
                            attendance:
                                attendance || []
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// STUDENT - GET DAILY ATTENDANCE
// ============================================================

app.get(
    "/api/student/:registerNo/daily-attendance",
    (req, res) => {

        const registerNo =
            req.params.registerNo;


        db.get(
            `
            SELECT
                id,
                name,
                registerNo,
                department,
                year
            FROM students
            WHERE registerNo = ?
            `,
            [registerNo],
            (err, student) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Student not found."
                    });

                }


                db.all(
                    `
                    SELECT
                        id,
                        attendance_date,
                        subject,
                        status
                    FROM daily_attendance
                    WHERE student_id = ?
                    ORDER BY
                        attendance_date DESC,
                        id DESC
                    `,
                    [student.id],
                    (attendanceError, attendance) => {

                        if (attendanceError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Unable to load attendance."
                            });

                        }


                        return res.json({
                            success: true,
                            student,
                            attendance:
                                attendance || []
                        });

                    }
                );

            }
        );

    }
);


// ============================================================
// ADMIN - UPDATE DAILY ATTENDANCE
// ============================================================

app.put(
    "/api/admin/daily-attendance/:id",
    (req, res) => {

        const attendanceId =
            req.params.id;

        const {
            attendanceDate,
            subject,
            status
        } = req.body;


        if (
            !attendanceDate ||
            !subject ||
            !status
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Date, subject and status are required."
            });

        }


        if (
            !isValidAttendanceDate(
                attendanceDate
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid date format. Use YYYY-MM-DD."
            });

        }


        if (
            !isValidAttendanceStatus(
                status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid attendance status."
            });

        }


        const cleanSubject =
            subject.trim();


        db.get(
            `
            SELECT
                id,
                student_id
            FROM daily_attendance
            WHERE id = ?
            `,
            [attendanceId],
            (findError, existing) => {

                if (findError) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database error."
                    });

                }


                if (!existing) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Attendance record not found."
                    });

                }


                db.get(
                    `
                    SELECT
                        id
                    FROM daily_attendance
                    WHERE student_id = ?
                    AND attendance_date = ?
                    AND LOWER(subject) = LOWER(?)
                    AND id != ?
                    `,
                    [
                        existing.student_id,
                        attendanceDate,
                        cleanSubject,
                        attendanceId
                    ],
                    (duplicateError, duplicate) => {

                        if (duplicateError) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Database error."
                            });

                        }


                        if (duplicate) {

                            return res.status(409).json({
                                success: false,
                                message:
                                    "Another attendance record already exists for this date and subject."
                            });

                        }


                        db.run(
                            `
                            UPDATE daily_attendance
                            SET
                                attendance_date = ?,
                                subject = ?,
                                status = ?
                            WHERE id = ?
                            `,
                            [
                                attendanceDate,
                                cleanSubject,
                                status,
                                attendanceId
                            ],
                            function (updateError) {

                                if (updateError) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Unable to update attendance."
                                    });

                                }


                                if (
                                    this.changes === 0
                                ) {

                                    return res.status(404).json({
                                        success: false,
                                        message:
                                            "Attendance record not found."
                                    });

                                }


                                return res.json({
                                    success: true,
                                    message:
                                        "Daily attendance updated successfully!"
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);


// ============================================================
// ADMIN - DELETE DAILY ATTENDANCE
// ============================================================

app.delete(
    "/api/admin/daily-attendance/:id",
    (req, res) => {

        db.run(
            `
            DELETE FROM daily_attendance
            WHERE id = ?
            `,
            [req.params.id],
            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to delete attendance."
                    });

                }


                if (
                    this.changes === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Attendance record not found."
                    });

                }


                return res.json({
                    success: true,
                    message:
                        "Daily attendance deleted successfully!"
                });

            }
        );

    }
);


// ============================================================
// 404 API HANDLER
// ============================================================

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({
            success: false,
            message:
                "API route not found."
        });

    }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "SERVER ERROR:",
            err
        );


        return res.status(500).json({
            success: false,
            message:
                "Internal server error."
        });

    }
);


// ============================================================
// START SERVER
// ============================================================

const server =
    app.listen(
        PORT,
        "127.0.0.1",
        () => {

            console.log("");
            console.log(
                "===================================="
            );

            console.log(
                " STUDENT PORTAL SERVER STARTED"
            );

            console.log(
                "===================================="
            );

            console.log(
                `Website: http://127.0.0.1:${PORT}`
            );

            console.log(
                `Server Test: http://127.0.0.1:${PORT}/api/test`
            );

            console.log("");

            console.log(
                "Admin API Security:"
            );

            console.log(
                "HttpOnly session cookie enabled"
            );

            console.log(
                "Daily attendance API enabled"
            );

            console.log(
                "===================================="
            );

            console.log("");

        }
    );


// ============================================================
// SERVER ERROR
// ============================================================

server.on(
    "error",
    (error) => {

        console.error("");
        console.error(
            "===================================="
        );

        console.error(
            "SERVER FAILED TO START"
        );

        console.error(
            "===================================="
        );

        console.error(error);

        console.error("");

    }
);