
const db = require("./database");

db.run(
    `INSERT INTO marks
    (student_id, semester, subject, marks, internal, external, total)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [1, "Semester 1", "Programming in C", 80, 20, 60, 80],
    function (err) {
        if (err) {
            console.error("Error:", err.message);
        } else {
            console.log("Sample marks added successfully!");
            console.log("Marks record ID:", this.lastID);
        }

        db.close();
    }
);