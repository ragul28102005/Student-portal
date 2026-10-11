
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Connect to the project database
const dbPath = path.join(__dirname, "student.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Database connection failed:");
        console.error(err.message);
        return;
    }

    console.log("========================================");
    console.log("   STUDENT DATABASE VERIFICATION");
    console.log("========================================");
    console.log("✅ Connected to student.db\n");

    checkStudents();
});

// Helper: print records safely
function printRecords(title, rows, fields) {
    console.log("\n========================================");
    console.log(title);
    console.log("========================================");

    if (rows.length === 0) {
        console.log("⚠️ No records found.");
    } else {
        rows.forEach((row, index) => {
            console.log(`\nRecord ${index + 1}`);
            console.log("----------------------------------------");

            fields.forEach((field) => {
                if (field in row) {
                    console.log(`${field.padEnd(22)}:`, row[field] ?? "-");
                }
            });
        });

        console.log(`\nTotal ${title} records: ${rows.length}`);
    }
}

// 1. Check Students
function checkStudents() {
    console.log("\n========================================");
    console.log("👨‍🎓 STUDENTS");
    console.log("========================================");

    const sql = `
        SELECT id, name, registerNo, email, phone,
               department, year, gender
        FROM students
        ORDER BY id
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("❌ Students error:", err.message);
        } else {
            printRecords("STUDENTS", rows, [
                "id", "name", "registerNo", "email",
                "phone", "department", "year", "gender"
            ]);
        }

        checkMarks();
    });
}

// 2. Check Marks
function checkMarks() {
    db.all("SELECT * FROM marks ORDER BY id", [], (err, rows) => {
        if (err) {
            console.error("\n❌ Marks error:", err.message);
        } else {
            printRecords("📊 MARKS", rows, [
                "id", "registerNo", "semester",
                "subject", "internal", "external", "total"
            ]);
        }

        checkFees();
    });
}

// 3. Check Fees
function checkFees() {
    db.all("SELECT * FROM fees ORDER BY id", [], (err, rows) => {
        if (err) {
            console.error("\n❌ Fees error:", err.message);
        } else {
            printRecords("💰 FEES", rows, [
                "id", "registerNo", "semester",
                "total_fees", "paid_fees", "pending_fees",
                "totalFees", "paidFees", "pendingFees",
                "tuition_fee", "tuition_status",
                "exam_fee", "exam_status",
                "hostel_fee", "hostel_status"
            ]);
        }

        checkAttendance();
    });
}

// 4. Check Attendance
function checkAttendance() {
    db.all("SELECT * FROM attendance ORDER BY id", [], (err, rows) => {
        if (err) {
            console.error("\n❌ Attendance error:", err.message);
        } else {
            printRecords("📅 ATTENDANCE", rows, [
                "id", "registerNo", "semester",
                "total_classes", "present_classes",
                "absent_classes", "attendance_percentage",
                "totalClasses", "presentClasses",
                "absentClasses", "attendancePercentage"
            ]);
        }

        closeDatabase();
    });
}

// Close database connection
function closeDatabase() {
    console.log("\n========================================");
    console.log("DATABASE VERIFICATION COMPLETE");
    console.log("========================================");

    db.close((err) => {
        if (err) {
            console.error("❌ Error closing database:", err.message);
        } else {
            console.log("✅ Database connection closed.");
        }
    });
}