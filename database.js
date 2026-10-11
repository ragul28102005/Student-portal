const path = require("path");
const sqlite3 = require("sqlite3").verbose();


// ============================================
// DATABASE CONNECTION
// ============================================

const dbPath = path.join(__dirname, "student.db");

const db = new sqlite3.Database(
    dbPath,
    (err) => {

        if (err) {

            console.error(
                "Database connection failed:",
                err.message
            );

        } else {

            console.log(
                "Connected to SQLite database."
            );

        }

    }
);


// ============================================
// DATABASE SETUP
// ============================================

db.serialize(() => {


    // ========================================
    // ENABLE FOREIGN KEYS
    // ========================================

    db.run(
        `PRAGMA foreign_keys = ON`
    );


    // ========================================
    // STUDENTS TABLE
    // ========================================

    db.run(
        `
        CREATE TABLE IF NOT EXISTS students (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            registerNo TEXT UNIQUE NOT NULL,

            email TEXT NOT NULL,

            phone TEXT NOT NULL,

            department TEXT NOT NULL,

            year TEXT NOT NULL,

            password TEXT NOT NULL,

            gender TEXT NOT NULL
                DEFAULT 'Not Specified'

        )
        `,
        (err) => {

            if (err) {

                console.error(
                    "Students table error:",
                    err.message
                );

            } else {

                console.log(
                    "Students table ready."
                );

            }

        }
    );


    // ========================================
    // ADD GENDER TO OLD DATABASE
    // ========================================
    // This is important because your existing
    // student.db may not have gender column.
    // ========================================

    db.run(
        `
        ALTER TABLE students
        ADD COLUMN gender TEXT NOT NULL
        DEFAULT 'Not Specified'
        `,
        (err) => {

            if (err) {

                if (
                    err.message
                        .toLowerCase()
                        .includes("duplicate column name")
                ) {

                    console.log(
                        "Gender column already exists."
                    );

                } else {

                    console.error(
                        "Gender column error:",
                        err.message
                    );

                }

            } else {

                console.log(
                    "Gender column added to students table."
                );

            }

        }
    );


    // ========================================
    // ADMINS TABLE
    // ========================================

    db.run(
        `
        CREATE TABLE IF NOT EXISTS admins (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            username TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL

        )
        `,
        (err) => {

            if (err) {

                console.error(
                    "Admins table error:",
                    err.message
                );

            } else {

                console.log(
                    "Admins table ready."
                );

            }

        }
    );


    // ========================================
    // DEFAULT ADMIN
    // ========================================

    db.run(
        `
        INSERT OR IGNORE INTO admins
        (username, password)

        VALUES (?, ?)
        `,
        [
            "rj",
            "rj123"
        ],
        (err) => {

            if (err) {

                console.error(
                    "Default admin error:",
                    err.message
                );

            } else {

                console.log(
                    "Default admin created."
                );

            }

        }
    );


    // ========================================
    // MARKS TABLE
    // ========================================

    db.run(
        `
        CREATE TABLE IF NOT EXISTS marks (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            student_id INTEGER NOT NULL,

            semester TEXT NOT NULL,

            subject TEXT NOT NULL,

            marks INTEGER NOT NULL
                DEFAULT 0,

            internal INTEGER NOT NULL
                DEFAULT 0,

            external INTEGER NOT NULL
                DEFAULT 0,

            total INTEGER NOT NULL
                DEFAULT 0,

            FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE

        )
        `,
        (err) => {

            if (err) {

                console.error(
                    "Marks table error:",
                    err.message
                );

            } else {

                console.log(
                    "Marks table ready."
                );

            }

        }
    );


    // ========================================
    // FEES TABLE
    // ========================================

    db.run(
        `
        CREATE TABLE IF NOT EXISTS fees (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            student_id INTEGER NOT NULL,

            total_fees REAL NOT NULL
                DEFAULT 0,

            paid_fees REAL NOT NULL
                DEFAULT 0,

            pending_fees REAL NOT NULL
                DEFAULT 0,

            tuition_fee REAL NOT NULL
                DEFAULT 0,

            tuition_status TEXT NOT NULL
                DEFAULT 'Pending',

            exam_fee REAL NOT NULL
                DEFAULT 0,

            exam_status TEXT NOT NULL
                DEFAULT 'Pending',

            hostel_fee REAL NOT NULL
                DEFAULT 0,

            hostel_status TEXT NOT NULL
                DEFAULT 'Pending',

            FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE

        )
        `,
        (err) => {

            if (err) {

                console.error(
                    "Fees table error:",
                    err.message
                );

            } else {

                console.log(
                    "Fees table ready."
                );

            }

        }
    );

        }
    );

/* =========================================================
   DAILY ATTENDANCE TABLE
========================================================= */

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


/* =========================================================
   DAILY ATTENDANCE INDEX
========================================================= */

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

        } else {

            console.log(
                "Daily attendance index ready."
            );

        }

    }
);


// ============================================
// EXPORT DATABASE
// ============================================

module.exports = db;