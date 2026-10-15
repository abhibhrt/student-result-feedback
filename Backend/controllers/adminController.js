const adminService = require('../services/adminService');

exports.createDepartment = async (req, res) => {
    try {
        const dept = await adminService.createDepartment(req.body.name);
        res.status(201).json(dept);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSubject = async (req, res) => {
    try {
        const sub = await adminService.createSubject(req.body);
        res.status(201).json(sub);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.assignFaculty = async (req, res) => {
    try {
        await adminService.assignFacultyToSubject(req.params.subjectId, req.body.faculty_id);
        res.json({ message: 'Faculty assigned to subject.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTeacher = async (req, res) => {
    try {
        const teacher = await adminService.createTeacher(req.body);
        res.status(201).json(teacher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const student = await adminService.createStudent(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.initializeSemesterExam = async (req, res) => {
    try {
        const { department_id, semester } = req.body;
        const result = await adminService.initializeSemesterExam(department_id, semester);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.publishSemesterResults = async (req, res) => {
    try {
        const { department_id, semester } = req.body;
        const response = await adminService.publishSemesterResults(department_id, semester);
        if (!response.ready) {
            return res.status(400).json(response);
        }
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLookups = async (req, res) => {
    try {
        const data = await adminService.getLookups();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};