const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

let database;

// ===============================
// DATABASE CONNECTION
// ===============================

async function connectDatabase() {
  try {
    console.log("Connecting to MongoDB...");

    await client.connect();

    database = client.db(
      process.env.MONGODB_DB || "rehabcare"
    );

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
}

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "RehabCare Backend is running"
  });
});

// ===============================
// PATIENT PROFILE
// ===============================

// SAVE / UPDATE PATIENT
app.post("/patients", async (req, res) => {
  try {
    const patientData = {
      patientId: req.body.patientId,
      name: req.body.name,
      age: req.body.age,
      gender: req.body.gender,
      phone: req.body.phone,
      updatedAt: new Date()
    };

    await database
      .collection("patients")
      .updateOne(
        {
          patientId: patientData.patientId
        },
        {
          $set: patientData
        },
        {
          upsert: true
        }
      );

    console.log("Patient Profile Saved:");
    console.log(patientData);

    res.json({
      message: "Patient profile saved successfully",
      patient: patientData
    });
  } catch (error) {
    console.error("Patient Save Error:", error);

    res.status(500).json({
      message: "Failed to save patient profile"
    });
  }
});

// GET ALL PATIENTS
app.get("/patients", async (req, res) => {
  try {
    const patients = await database
      .collection("patients")
      .find({})
      .sort({
        updatedAt: -1
      })
      .toArray();

    console.log("Patients Fetched:", patients.length);

    res.json(patients);
  } catch (error) {
    console.error("Patients Fetch Error:", error);

    res.status(500).json({
      message: "Failed to fetch patients"
    });
  }
});

// GET ONE PATIENT
app.get("/patients/:patientId", async (req, res) => {
  try {
    const patient = await database
      .collection("patients")
      .findOne({
        patientId: req.params.patientId
      });

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found"
      });
    }

    res.json(patient);
  } catch (error) {
    console.error("Patient Fetch Error:", error);

    res.status(500).json({
      message: "Failed to fetch patient"
    });
  }
});

// ===============================
// ASSESSMENTS
// ===============================

// SAVE ASSESSMENT
app.post("/assessments", async (req, res) => {
  try {
    const assessment = {
      patientId: req.body.patientId,
      affectedSide: req.body.affectedSide,
      hand: req.body.hand,
      arm: req.body.arm,
      balance: req.body.balance,
      coordination: req.body.coordination,
      mobility: req.body.mobility,
      dailyActivities: req.body.dailyActivities,
      createdAt: new Date()
    };

    await database
      .collection("assessments")
      .insertOne(assessment);

    console.log("Assessment Saved:");
    console.log(assessment);

    res.json({
      message: "Assessment saved successfully",
      assessment: assessment
    });
  } catch (error) {
    console.error("Assessment Save Error:", error);

    res.status(500).json({
      message: "Failed to save assessment"
    });
  }
});

// GET PATIENT ASSESSMENTS
app.get("/assessments/:patientId", async (req, res) => {
  try {
    const assessments = await database
      .collection("assessments")
      .find({
        patientId: req.params.patientId
      })
      .sort({
        createdAt: -1
      })
      .toArray();

    res.json(assessments);
  } catch (error) {
    console.error("Assessment Fetch Error:", error);

    res.status(500).json({
      message: "Failed to fetch assessments"
    });
  }
});

// ===============================
// EXERCISE ASSIGNMENTS
// ===============================

// ASSIGN EXERCISES
app.post("/assign-exercises", async (req, res) => {
  try {
    const assignment = {
      patientId: req.body.patientId,
      patientName: req.body.patientName,
      exercises: req.body.exercises,
      assignedAt: new Date()
    };

    await database
      .collection("assignments")
      .insertOne(assignment);

    console.log("Exercises Assigned:");
    console.log(assignment);

    res.json({
      message: "Exercises assigned successfully",
      assignment: assignment
    });
  } catch (error) {
    console.error(
      "Exercise Assignment Error:",
      error
    );

    res.status(500).json({
      message: "Failed to assign exercises"
    });
  }
});

// GET ASSIGNED EXERCISES
app.get(
  "/assign-exercises/:patientId",
  async (req, res) => {
    try {
      const assignments = await database
        .collection("assignments")
        .find({
          patientId: req.params.patientId
        })
        .sort({
          assignedAt: -1
        })
        .toArray();

      res.json(assignments);
    } catch (error) {
      console.error(
        "Assignment Fetch Error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch assigned exercises"
      });
    }
  }
);

// ===============================
// PATIENT PROGRESS
// ===============================

// SAVE PROGRESS
app.post("/progress", async (req, res) => {
  try {
    const progress = {
      patientId: req.body.patientId,
      patientName: req.body.patientName,
      exercise: req.body.exercise,
      status: req.body.status,
      completedAt: new Date()
    };

    await database
      .collection("progress")
      .insertOne(progress);

    console.log("Progress Saved:");
    console.log(progress);

    res.json({
      message: "Progress saved successfully",
      progress: progress
    });
  } catch (error) {
    console.error(
      "Progress Save Error:",
      error
    );

    res.status(500).json({
      message: "Failed to save progress"
    });
  }
});

// GET PATIENT PROGRESS
app.get(
  "/progress/:patientId",
  async (req, res) => {
    try {
      const progress = await database
        .collection("progress")
        .find({
          patientId: req.params.patientId
        })
        .sort({
          completedAt: -1
        })
        .toArray();

      res.json(progress);
    } catch (error) {
      console.error(
        "Progress Fetch Error:",
        error
      );

      res.status(500).json({
        message: "Failed to fetch progress"
      });
    }
  }
);

// ===============================
// START SERVER
// ===============================

async function startServer() {
  await connectDatabase();

  app.listen(5000, () => {
    console.log(
      "RehabCare Backend running on port 5000"
    );

    console.log(
      "Server: http://localhost:5000"
    );
  });
}

startServer();