const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.createDepartment = async (name) => {
    const result = await pool.query(
        'INSERT INTO departments (name) VALUES ($1) RETURNING *',
        [name]
    );
    return result.rows[0];
};

exports.createSubject = async ({ name, code, semester, department_id, faculty_id }) => {
    const result = await pool.query(
        `INSERT INTO subjects (name, code, semester, department_id, faculty_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, code, semester, department_id, faculty_id || null]
    );
    return result.rows[0];
};

exports.assignFacultyToSubject = async (subjectId, facultyId) => {
    await pool.query(
        'UPDATE subjects SET faculty_id = $1 WHERE id = $2',
        [facultyId, subjectId]
    );
};

exports.createTeacher = async ({ name, empid, email, password, phoneno, department_id }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO teachers (name, empid, email, password, phoneno, department_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, empid, email`,
        [name, empid, email, hashedPassword, phoneno, department_id]
    );
    return result.rows[0];
};

exports.createStudent = async ({ name, email, password, phoneno, curr_sem, year, department_id }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO students (name, email, password, phoneno, curr_sem, year, department_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, curr_sem`,
        [name, email, hashedPassword, phoneno, curr_sem, year, department_id]
    );
    return result.rows[0];
};

// Initializes results for ALL students currently enrolled in that Department and Semester
exports.initializeSemesterExam = async (department_id, semester) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Fetch all subjects mapped to this semester and department
        const subjectsRes = await client.query(
            'SELECT id, faculty_id FROM subjects WHERE department_id = $1 AND semester = $2',
            [department_id, semester]
        );

        const subjectsList = subjectsRes.rows;
        if (subjectsList.length === 0) {
            throw new Error('No subjects found for this Department and Semester. Create subjects first.');
        }

        // Verify all subjects have an assigned teacher
        const unassigned = subjectsList.filter(s => !s.faculty_id);
        if (unassigned.length > 0) {
            throw new Error(`Cannot initialize exam: ${unassigned.length} subject(s) lack an assigned faculty.`);
        }

        // 2. Fetch all students currently enrolled in this department & semester
        const studentsRes = await client.query(
            'SELECT id FROM students WHERE department_id = $1 AND curr_sem = $2',
            [department_id, semester]
        );

        const studentsList = studentsRes.rows;
        if (studentsList.length === 0) {
            throw new Error('No active students found in this Department and Semester.');
        }

        let initializedCount = 0;

        for (const student of studentsList) {
            // Check if result record already exists
            const checkRes = await client.query(
                'SELECT id FROM results WHERE student_id = $1 AND semester = $2',
                [student.id, semester]
            );

            let resultId;
            if (checkRes.rows.length === 0) {
                const newRes = await client.query(
                    `INSERT INTO results (student_id, semester, department_id, is_published)
                     VALUES ($1, $2, $3, FALSE)
                     RETURNING id`,
                    [student.id, semester, department_id]
                );
                resultId = newRes.rows[0].id;
            } else {
                resultId = checkRes.rows[0].id;
            }

            // Create blank marks rows for each subject
            for (const sub of subjectsList) {
                await client.query(
                    `INSERT INTO marks (result_id, subject_id, student_id, mark, is_submitted)
                     VALUES ($1, $2, $3, NULL, FALSE)
                     ON CONFLICT (result_id, subject_id, student_id) DO NOTHING`,
                    [resultId, sub.id, student.id]
                );
            }
            initializedCount++;
        }

        await client.query('COMMIT');
        return { message: `Exam initialized for ${initializedCount} students across ${subjectsList.length} subjects.` };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Check if all students in that semester & department have all subject marks submitted and publish
exports.publishSemesterResults = async (department_id, semester) => {
    // 1. Check for any unsubmitted marks in this cohort
    const pendingQuery = await pool.query(
        `SELECT m.id, sub.name AS subject_name, s.name AS student_name, t.name AS faculty_name
         FROM marks m
         JOIN results r ON m.result_id = r.id
         JOIN subjects sub ON m.subject_id = sub.id
         JOIN students s ON m.student_id = s.id
         LEFT JOIN teachers t ON sub.faculty_id = t.id
         WHERE r.department_id = $1 
           AND r.semester = $2 
           AND m.is_submitted = FALSE`,
        [department_id, semester]
    );

    if (pendingQuery.rows.length > 0) {
        return {
            ready: false,
            message: 'Cannot publish semester results. Some subject marks are still unsubmitted by faculty.',
            pendingEntries: pendingQuery.rows
        };
    }

    // 2. Fetch all cohort results to publish
    const resultsQuery = await pool.query(
        `SELECT r.id, r.student_id, s.name AS student_name
         FROM results r
         JOIN students s ON r.student_id = s.id
         WHERE r.department_id = $1 AND r.semester = $2 AND r.is_published = FALSE`,
        [department_id, semester]
    );

    const resultsToPublish = resultsQuery.rows;
    if (resultsToPublish.length === 0) {
        return { ready: false, message: 'No unpublished semester results found.' };
    }

    // Mark results as published (No AI generation triggered here)
    await pool.query(
        'UPDATE results SET is_published = TRUE WHERE department_id = $1 AND semester = $2',
        [department_id, semester]
    );

    return {
        ready: true,
        message: `Successfully published results for ${resultsToPublish.length} students.`
    };
};

exports.getLookups = async () => {
    const [departments, teachers, students, subjects] = await Promise.all([
        pool.query('SELECT id, name FROM departments ORDER BY name ASC'),
        pool.query('SELECT id, name, empid, email, department_id FROM teachers ORDER BY name ASC'),
        pool.query('SELECT id, name, email, curr_sem, department_id FROM students ORDER BY name ASC'),
        pool.query(`
            SELECT s.id, s.name, s.code, s.semester, s.department_id, s.faculty_id, t.name as faculty_name 
            FROM subjects s 
            LEFT JOIN teachers t ON s.faculty_id = t.id 
            ORDER BY s.semester ASC, s.name ASC
        `)
    ]);

    return {
        departments: departments.rows,
        teachers: teachers.rows,
        students: students.rows,
        subjects: subjects.rows
    };
};