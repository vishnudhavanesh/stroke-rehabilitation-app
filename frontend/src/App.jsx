import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

// ======================================================
// NAVIGATION ITEM
// ======================================================

function NavItem({
  icon,
  label,
  active,
  onClick
}) {
  return (
    <button
      className={`nav-item ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ======================================================
// DASHBOARD LAYOUT
// ======================================================

function DashboardLayout({
  title,
  subtitle,
  children,
  page,
  setPage,
  role,
  logout
}) {
  const patientNavigation = [
    {
      id: "patient-dashboard",
      icon: "⌂",
      label: "Dashboard"
    },
    {
      id: "patient-exercises",
      icon: "✓",
      label: "My Exercises"
    }
  ];

  const therapistNavigation = [
    {
      id: "therapist-dashboard",
      icon: "⌂",
      label: "Dashboard"
    },
    {
      id: "patients",
      icon: "♙",
      label: "Patients"
    }
  ];

  const navigation =
    role === "patient"
      ? patientNavigation
      : therapistNavigation;

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-logo">
            R
          </div>

          <div>
            <h2>RehabCare</h2>
            <span>
              Rehabilitation Platform
            </span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">
            {role === "patient"
              ? "PATIENT"
              : "THERAPIST"}
          </p>

          {navigation.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={page === item.id}
              onClick={() =>
                setPage(item.id)
              }
            />
          ))}
        </div>

        <div className="sidebar-bottom">

          <div className="support-box">
            <div className="support-icon">
              ?
            </div>

            <div>
              <strong>Need help?</strong>
              <p>
                Contact your therapist
              </p>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      <main className="main-area">

        <header className="topbar">

          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="topbar-user">

            <div className="status-dot"></div>

            <span>
              {role === "patient"
                ? "Patient Portal"
                : "Therapist Portal"}
            </span>

          </div>

        </header>

        <section className="content">
          {children}
        </section>

      </main>

    </div>
  );
}

// ======================================================
// MAIN APP
// ======================================================

export default function App() {

  const [page, setPage] =
    useState("login");

  const [patientId, setPatientId] =
    useState("");

  const [profile, setProfile] =
    useState(null);

  const [assessment, setAssessment] =
    useState(null);

  const [patients, setPatients] =
    useState([]);

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [selectedAssignments, setSelectedAssignments] =
    useState([]);

  const [patientExercises, setPatientExercises] =
    useState([]);

  const [patientProgress, setPatientProgress] =
    useState([]);

  const [completedExercises, setCompletedExercises] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // ====================================================
  // PATIENT EXERCISES
  // ====================================================

  async function getExercises(id) {

    try {

      const response = await fetch(
        `${API}/assign-exercises/${encodeURIComponent(
          id
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch exercises"
        );
      }

      const assignments =
        await response.json();

      const exercises = [];

      assignments.forEach(
        (assignment) => {

          if (
            assignment.exercises &&
            Array.isArray(
              assignment.exercises
            )
          ) {

            assignment.exercises.forEach(
              (exercise) => {

                exercises.push({
                  ...exercise,
                  assignedAt:
                    assignment.assignedAt
                });

              }
            );

          }

        }
      );

      setPatientExercises(exercises);

      return exercises;

    } catch (error) {

      console.error(
        "Exercise fetch error:",
        error
      );

      setPatientExercises([]);

      return [];

    }
  }

  // ====================================================
  // PATIENT PROGRESS
  // ====================================================

  async function getProgress(id) {

    try {

      const response = await fetch(
        `${API}/progress/${encodeURIComponent(
          id
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch progress"
        );
      }

      const progress =
        await response.json();

      setPatientProgress(progress);

      const completed = progress
        .filter(
          (item) =>
            item.status === "completed"
        )
        .map(
          (item) =>
            item.exercise
        );

      setCompletedExercises(
        completed
      );

      return progress;

    } catch (error) {

      console.error(
        "Progress fetch error:",
        error
      );

      setPatientProgress([]);
      setCompletedExercises([]);

      return [];

    }
  }

  // ====================================================
  // LOAD PATIENT DATA
  // ====================================================

  async function loadPatientData(id) {

    await Promise.all([
      getExercises(id),
      getProgress(id)
    ]);

  }

  // ====================================================
  // FETCH ALL PATIENTS
  // ====================================================

  async function fetchPatients() {

    try {

      setLoading(true);

      const response = await fetch(
        `${API}/patients`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch patients"
        );
      }

      const data =
        await response.json();

      console.log(
        "Patients received:",
        data
      );

      setPatients(data);

    } catch (error) {

      console.error(
        "Patient fetch error:",
        error
      );

      alert(
        "Unable to load patients"
      );

    } finally {

      setLoading(false);

    }
  }

  // ====================================================
  // PATIENT LOGIN
  // ====================================================

  async function handlePatientLogin() {

    if (!patientId.trim()) {

      alert(
        "Please enter your Patient ID"
      );

      return;
    }

    try {

      setLoading(true);

      const response = await fetch(
        `${API}/patients/${encodeURIComponent(
          patientId.trim()
        )}`
      );

      if (response.ok) {

        const patient =
          await response.json();

        setProfile(patient);

        const assessmentResponse =
          await fetch(
            `${API}/assessments/${encodeURIComponent(
              patient.patientId
            )}`
          );

        if (
          assessmentResponse.ok
        ) {

          const assessments =
            await assessmentResponse.json();

          if (
            assessments.length > 0
          ) {

            setAssessment(
              assessments[0]
            );

            await loadPatientData(
              patient.patientId
            );

            setPage(
              "patient-dashboard"
            );

          } else {

            setPage(
              "assessment"
            );

          }

        } else {

          setPage(
            "assessment"
          );

        }

      } else if (
        response.status === 404
      ) {

        setProfile(null);
        setPage("profile");

      } else {

        throw new Error(
          "Patient login failed"
        );

      }

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      alert(
        "Unable to connect to backend"
      );

    } finally {

      setLoading(false);

    }
  }

  // ====================================================
  // SAVE PATIENT PROFILE
  // ====================================================

  async function saveProfile(
    profileData
  ) {

    try {

      setLoading(true);

      const response = await fetch(
        `${API}/patients`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            ...profileData,
            patientId:
              patientId.trim()
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          "Profile save failed"
        );
      }

      const data =
        await response.json();

      setProfile(
        data.patient
      );

      setPage("assessment");

    } catch (error) {

      console.error(
        "Profile save error:",
        error
      );

      alert(
        "Unable to save profile"
      );

    } finally {

      setLoading(false);

    }
  }

  // ====================================================
  // SAVE ASSESSMENT
  // ====================================================

  async function saveAssessment(
    assessmentData
  ) {

    try {

      setLoading(true);

      const response = await fetch(
        `${API}/assessments`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            patientId:
              patientId.trim(),

            ...assessmentData
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          "Assessment save failed"
        );
      }

      const data =
        await response.json();

      setAssessment(
        data.assessment
      );

      await loadPatientData(
        patientId.trim()
      );

      setPage(
        "patient-dashboard"
      );

    } catch (error) {

      console.error(
        "Assessment save error:",
        error
      );

      alert(
        "Unable to save assessment"
      );

    } finally {

      setLoading(false);

    }
  }

  // ====================================================
  // MARK EXERCISE COMPLETED
  // ====================================================

  async function completeExercise(
    exercise
  ) {

    if (
      completedExercises.includes(
        exercise.name
      )
    ) {
      return;
    }

    try {

      const response = await fetch(
        `${API}/progress`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            patientId:
              profile.patientId,

            patientName:
              profile.name,

            exercise:
              exercise.name,

            status:
              "completed"
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          "Progress save failed"
        );
      }

      setCompletedExercises(
        (previous) => [
          ...previous,
          exercise.name
        ]
      );

      await getProgress(
        profile.patientId
      );

    } catch (error) {

      console.error(
        "Completion error:",
        error
      );

      alert(
        "Unable to save completion"
      );
    }
  }

  // ====================================================
  // ASSIGN EXERCISES
  // ====================================================

  async function assignExercises(
    exercises
  ) {

    try {

      setLoading(true);

      const response = await fetch(
        `${API}/assign-exercises`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            patientId:
              selectedPatient.patientId,

            patientName:
              selectedPatient.name,

            exercises:
              exercises
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          "Assignment failed"
        );
      }

      alert(
        "Exercises assigned successfully"
      );

      await loadAssignmentsForPatient(
        selectedPatient.patientId
      );

      setPage(
        "patient-details"
      );

    } catch (error) {

      console.error(
        "Assignment error:",
        error
      );

      alert(
        "Unable to assign exercises"
      );

    } finally {

      setLoading(false);

    }
  }

  // ====================================================
  // LOAD ASSIGNMENTS FOR THERAPIST
  // ====================================================

  async function loadAssignmentsForPatient(
    id
  ) {

    try {

      const response = await fetch(
        `${API}/assign-exercises/${encodeURIComponent(
          id
        )}`
      );

      if (!response.ok) {
        throw new Error(
          "Unable to fetch assignments"
        );
      }

      const data =
        await response.json();

      const allExercises = [];

      data.forEach(
        (assignment) => {

          if (
            Array.isArray(
              assignment.exercises
            )
          ) {

            assignment.exercises.forEach(
              (exercise) => {

                allExercises.push({
                  ...exercise,
                  assignedAt:
                    assignment.assignedAt
                });

              }
            );

          }

        }
      );

      setSelectedAssignments(
        allExercises
      );

    } catch (error) {

      console.error(
        "Assignment loading error:",
        error
      );

      setSelectedAssignments([]);

    }
  }

  // ====================================================
  // LOGOUT
  // ====================================================

  function logout() {

    setPatientId("");
    setProfile(null);
    setAssessment(null);
    setPatients([]);
    setSelectedPatient(null);
    setSelectedAssignments([]);
    setPatientExercises([]);
    setPatientProgress([]);
    setCompletedExercises([]);

    setPage("login");
  }

  // ====================================================
  // LOGIN SCREEN
  // ====================================================

  if (page === "login") {

    return (
      <LoginScreen
        patientId={patientId}
        setPatientId={setPatientId}
        onPatientLogin={
          handlePatientLogin
        }
        onTherapistLogin={() =>
          setPage(
            "therapist-dashboard"
          )
        }
        loading={loading}
      />
    );
  }

  // ====================================================
  // PATIENT PROFILE
  // ====================================================

  if (page === "profile") {

    return (
      <ProfilePage
        patientId={patientId}
        onSave={saveProfile}
        loading={loading}
      />
    );
  }

  // ====================================================
  // ASSESSMENT
  // ====================================================

  if (page === "assessment") {

    return (
      <AssessmentPage
        patientId={patientId}
        onSave={saveAssessment}
        loading={loading}
      />
    );
  }

  // ====================================================
  // PATIENT DASHBOARD
  // ====================================================

  if (
    page === "patient-dashboard"
  ) {

    return (
      <DashboardLayout
        title="Patient Dashboard"
        subtitle={`Welcome back, ${
          profile?.name || "Patient"
        }`}
        page={page}
        setPage={setPage}
        role="patient"
        logout={logout}
      >

        <PatientDashboard
          profile={profile}
          exercises={patientExercises}
          completed={
            completedExercises
          }
          progress={
            patientProgress
          }
          onExercises={() =>
            setPage(
              "patient-exercises"
            )
          }
        />

      </DashboardLayout>
    );
  }

  // ====================================================
  // PATIENT EXERCISES
  // ====================================================

  if (
    page === "patient-exercises"
  ) {

    return (
      <DashboardLayout
        title="My Exercises"
        subtitle="Exercises assigned by your therapist"
        page={page}
        setPage={setPage}
        role="patient"
        logout={logout}
      >

        <PatientExercises
          exercises={
            patientExercises
          }
          completed={
            completedExercises
          }
          onComplete={
            completeExercise
          }
        />

      </DashboardLayout>
    );
  }

  // ====================================================
  // THERAPIST DASHBOARD
  // ====================================================

  if (
    page === "therapist-dashboard"
  ) {

    return (
      <DashboardLayout
        title="Therapist Dashboard"
        subtitle="Manage patients and rehabilitation plans"
        page={page}
        setPage={setPage}
        role="therapist"
        logout={logout}
      >

        <TherapistDashboard
          patients={patients}
          loading={loading}
          onPatients={async () => {
            await fetchPatients();
            setPage("patients");
          }}
        />

      </DashboardLayout>
    );
  }

  // ====================================================
  // PATIENT LIST
  // ====================================================

  if (page === "patients") {

    return (
      <DashboardLayout
        title="Patients"
        subtitle="View and manage registered patients"
        page={page}
        setPage={setPage}
        role="therapist"
        logout={logout}
      >

        <PatientsPage
          patients={patients}
          loading={loading}
          onSelect={async (patient) => {

            setSelectedPatient(
              patient
            );

            await loadAssignmentsForPatient(
              patient.patientId
            );

            setPage(
              "patient-details"
            );

          }}
        />

      </DashboardLayout>
    );
  }

  // ====================================================
  // PATIENT DETAILS
  // ====================================================

  if (
    page === "patient-details"
  ) {

    return (
      <DashboardLayout
        title="Patient Details"
        subtitle="Review patient information and exercises"
        page={page}
        setPage={setPage}
        role="therapist"
        logout={logout}
      >

        <PatientDetails
          patient={
            selectedPatient
          }
          assignments={
            selectedAssignments
          }
          onAssign={() =>
            setPage(
              "assign-exercises"
            )
          }
          onBack={() =>
            setPage("patients")
          }
          onProgress={async () => {
            await getProgress(
              selectedPatient.patientId
            );

            setPage(
              "therapist-progress"
            );
          }}
        />

      </DashboardLayout>
    );
  }

  // ====================================================
  // ASSIGN EXERCISES
  // ====================================================

  if (
    page === "assign-exercises"
  ) {

    return (
      <DashboardLayout
        title="Assign Exercises"
        subtitle={`Create a rehabilitation plan for ${
          selectedPatient?.name || ""
        }`}
        page={page}
        setPage={setPage}
        role="therapist"
        logout={logout}
      >

        <AssignExercises
          patient={
            selectedPatient
          }
          onSave={
            assignExercises
          }
          onBack={() =>
            setPage(
              "patient-details"
            )
          }
          loading={loading}
        />

      </DashboardLayout>
    );
  }

  // ====================================================
  // THERAPIST PROGRESS
  // ====================================================

  if (
    page === "therapist-progress"
  ) {

    return (
      <DashboardLayout
        title="Patient Progress"
        subtitle={`Exercise completion for ${
          selectedPatient?.name || ""
        }`}
        page={page}
        setPage={setPage}
        role="therapist"
        logout={logout}
      >

        <TherapistProgress
          patient={
            selectedPatient
          }
          progress={
            patientProgress
          }
          assignments={
            selectedAssignments
          }
          onBack={() =>
            setPage(
              "patient-details"
            )
          }
        />

      </DashboardLayout>
    );
  }

  return null;
}

// ======================================================
// LOGIN SCREEN
// ======================================================

function LoginScreen({
  patientId,
  setPatientId,
  onPatientLogin,
  onTherapistLogin,
  loading
}) {

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="auth-brand">
          <div className="brand-logo large">
            R
          </div>

          <div>
            <h1>RehabCare</h1>
            <p>
              Stroke Rehabilitation Platform
            </p>
          </div>
        </div>

        <div className="auth-message">

          <span className="eyebrow">
            REHABILITATION CARE
          </span>

          <h2>
            Recovery begins
            <br />
            with consistent care.
          </h2>

          <p>
            A connected rehabilitation
            platform for patients and
            therapists.
          </p>

        </div>

        <div className="auth-features">

          <div>
            <span>✓</span>
            Personalized exercise plans
          </div>

          <div>
            <span>✓</span>
            Therapist-guided rehabilitation
          </div>

          <div>
            <span>✓</span>
            Progress tracking
          </div>

        </div>

      </div>

      <div className="auth-right">

        <div className="login-card">

          <span className="eyebrow">
            PATIENT PORTAL
          </span>

          <h2>
            Welcome back
          </h2>

          <p className="login-description">
            Enter your Patient ID to
            continue your rehabilitation
            journey.
          </p>

          <label>
            Patient ID
          </label>

          <input
            value={patientId}
            onChange={(e) =>
              setPatientId(
                e.target.value
              )
            }
            placeholder="Example: PATIENT 001"
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                onPatientLogin();
              }
            }}
          />

          <button
            className="primary-button full"
            onClick={
              onPatientLogin
            }
            disabled={loading}
          >
            {loading
              ? "Checking..."
              : "Continue as Patient →"}
          </button>

          <div className="login-divider">
            <span>
              OR
            </span>
          </div>

          <button
            className="secondary-button full"
            onClick={
              onTherapistLogin
            }
          >
            Therapist Login
          </button>

          <p className="login-note">
            Patient ID is provided by
            your rehabilitation center.
          </p>

        </div>

      </div>

    </div>
  );
}

// ======================================================
// PROFILE PAGE
// ======================================================

function ProfilePage({
  patientId,
  onSave,
  loading
}) {

  const [form, setForm] =
    useState({
      name: "",
      age: "",
      gender: "",
      phone: ""
    });

  function update(
    field,
    value
  ) {

    setForm({
      ...form,
      [field]: value
    });

  }

  return (
    <div className="simple-page">

      <div className="form-card">

        <span className="eyebrow">
          STEP 1 OF 2
        </span>

        <h1>
          Complete your profile
        </h1>

        <p className="muted">
          Patient ID:{" "}
          <strong>
            {patientId}
          </strong>
        </p>

        <div className="form-grid">

          <div className="form-group">
            <label>
              Full Name
            </label>

            <input
              value={form.name}
              onChange={(e) =>
                update(
                  "name",
                  e.target.value
                )
              }
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label>
              Age
            </label>

            <input
              type="number"
              value={form.age}
              onChange={(e) =>
                update(
                  "age",
                  e.target.value
                )
              }
              placeholder="Age"
            />
          </div>

          <div className="form-group">
            <label>
              Gender
            </label>

            <select
              value={form.gender}
              onChange={(e) =>
                update(
                  "gender",
                  e.target.value
                )
              }
            >
              <option value="">
                Select gender
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>
              Phone
            </label>

            <input
              value={form.phone}
              onChange={(e) =>
                update(
                  "phone",
                  e.target.value
                )
              }
              placeholder="Phone number"
            />
          </div>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            onSave(form)
          }
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Save & Continue →"}
        </button>

      </div>

    </div>
  );
}

// ======================================================
// ASSESSMENT PAGE
// ======================================================

function AssessmentPage({
  patientId,
  onSave,
  loading
}) {

  const [form, setForm] =
    useState({
      affectedSide: "",
      hand: "",
      arm: "",
      balance: "",
      coordination: "",
      mobility: "",
      dailyActivities: ""
    });

  function update(
    field,
    value
  ) {

    setForm({
      ...form,
      [field]: value
    });

  }

  return (
    <div className="simple-page">

      <div className="form-card wide">

        <span className="eyebrow">
          STEP 2 OF 2
        </span>

        <h1>
          Initial Assessment
        </h1>

        <p className="muted">
          These responses provide
          baseline information for
          therapist review.
        </p>

        <div className="form-grid">

          <FormSelect
            label="Affected Side"
            value={
              form.affectedSide
            }
            onChange={(v) =>
              update(
                "affectedSide",
                v
              )
            }
            options={[
              "Left",
              "Right",
              "Both"
            ]}
          />

          <FormSelect
            label="Hand Function"
            value={form.hand}
            onChange={(v) =>
              update(
                "hand",
                v
              )
            }
            options={[
              "Good",
              "Moderate",
              "Difficult"
            ]}
          />

          <FormSelect
            label="Arm Function"
            value={form.arm}
            onChange={(v) =>
              update(
                "arm",
                v
              )
            }
            options={[
              "Good",
              "Moderate",
              "Difficult"
            ]}
          />

          <FormSelect
            label="Balance"
            value={form.balance}
            onChange={(v) =>
              update(
                "balance",
                v
              )
            }
            options={[
              "Good",
              "Moderate",
              "Difficult"
            ]}
          />

          <FormSelect
            label="Coordination"
            value={
              form.coordination
            }
            onChange={(v) =>
              update(
                "coordination",
                v
              )
            }
            options={[
              "Good",
              "Moderate",
              "Difficult"
            ]}
          />

          <FormSelect
            label="Mobility"
            value={form.mobility}
            onChange={(v) =>
              update(
                "mobility",
                v
              )
            }
            options={[
              "Independent",
              "Needs Support",
              "Difficult"
            ]}
          />

        </div>

        <div className="form-group full-width">
          <label>
            Daily Activities
          </label>

          <textarea
            value={
              form.dailyActivities
            }
            onChange={(e) =>
              update(
                "dailyActivities",
                e.target.value
              )
            }
            placeholder="Describe any difficulty with daily activities..."
          />
        </div>

        <button
          className="primary-button"
          onClick={() =>
            onSave(form)
          }
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Submit Assessment →"}
        </button>

      </div>

    </div>
  );
}

// ======================================================
// FORM SELECT
// ======================================================

function FormSelect({
  label,
  value,
  onChange,
  options
}) {

  return (
    <div className="form-group">

      <label>
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
      >

        <option value="">
          Select
        </option>

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}

      </select>

    </div>
  );
}

// ======================================================
// PATIENT DASHBOARD
// ======================================================

function PatientDashboard({
  profile,
  exercises,
  completed,
  progress,
  onExercises
}) {

  const total =
    exercises.length;

  const completedCount =
    exercises.filter(
      (exercise) =>
        completed.includes(
          exercise.name
        )
    ).length;

  const percentage =
    total === 0
      ? 0
      : Math.round(
          (completedCount /
            total) *
            100
        );

  return (
    <div>

      <div className="welcome-banner">

        <div>

          <span className="eyebrow">
            YOUR REHABILITATION
          </span>

          <h2>
            Good to see you,{" "}
            {profile?.name}
          </h2>

          <p>
            Stay consistent with
            the exercises assigned
            by your therapist.
          </p>

        </div>

        <div className="progress-circle">
          <strong>
            {percentage}%
          </strong>

          <span>
            Complete
          </span>
        </div>

      </div>

      <div className="stat-grid">

        <StatCard
          number={total}
          label="Assigned Exercises"
        />

        <StatCard
          number={completedCount}
          label="Completed"
        />

        <StatCard
          number={
            total -
            completedCount
          }
          label="Remaining"
        />

      </div>

      <div className="section-heading">

        <div>
          <h2>
            Today's Rehabilitation
          </h2>

          <p>
            Exercises assigned by
            your therapist.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={onExercises}
        >
          View All Exercises
        </button>

      </div>

      {exercises.length === 0 ? (

        <div className="empty-card">

          <div className="empty-icon">
            ✓
          </div>

          <h3>
            No exercises assigned yet
          </h3>

          <p>
            Your therapist will add
            your rehabilitation
            exercises here.
          </p>

        </div>

      ) : (

        <div className="exercise-grid">

          {exercises
            .slice(0, 3)
            .map(
              (
                exercise,
                index
              ) => (
                <ExerciseCard
                  key={`${exercise.name}-${index}`}
                  exercise={
                    exercise
                  }
                  completed={completed.includes(
                    exercise.name
                  )}
                  compact
                />
              )
            )}

        </div>

      )}

    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  number,
  label
}) {

  return (
    <div className="stat-card">

      <strong>
        {number}
      </strong>

      <span>
        {label}
      </span>

    </div>
  );
}

// ======================================================
// PATIENT EXERCISES
// ======================================================

function PatientExercises({
  exercises,
  completed,
  onComplete
}) {

  return (
    <div>

      <div className="section-heading">

        <div>
          <h2>
            Assigned Exercises
          </h2>

          <p>
            Follow the instructions
            provided by your therapist.
          </p>
        </div>

      </div>

      {exercises.length === 0 ? (

        <div className="empty-card">

          <div className="empty-icon">
            ✓
          </div>

          <h3>
            No exercises assigned
          </h3>

          <p>
            Your assigned exercises
            will appear here.
          </p>

        </div>

      ) : (

        <div className="exercise-list">

          {exercises.map(
            (
              exercise,
              index
            ) => (

              <ExerciseCard
                key={`${exercise.name}-${index}`}
                exercise={
                  exercise
                }
                completed={
                  completed.includes(
                    exercise.name
                  )
                }
                onComplete={() =>
                  onComplete(
                    exercise
                  )
                }
              />

            )
          )}

        </div>

      )}

    </div>
  );
}

// ======================================================
// EXERCISE CARD
// ======================================================

function ExerciseCard({
  exercise,
  completed,
  onComplete,
  compact = false
}) {

  return (
    <div
      className={`exercise-card ${
        compact
          ? "compact"
          : ""
      }`}
    >

      {exercise.imageUrl ? (

        <img
          className="exercise-image"
          src={
            exercise.imageUrl
          }
          alt={
            exercise.name
          }
          onError={(e) => {
            e.currentTarget.style.display =
              "none";
          }}
        />

      ) : (

        <div className="exercise-image-placeholder">
          <span>+</span>
          <small>
            Exercise
          </small>
        </div>

      )}

      <div className="exercise-content">

        <div className="exercise-header">

          <div>

            <span className="exercise-label">
              THERAPIST ASSIGNED
            </span>

            <h3>
              {exercise.name}
            </h3>

          </div>

          {completed && (
            <span className="completed-badge">
              ✓ Completed
            </span>
          )}

        </div>

        {exercise.description && (
          <p className="exercise-description">
            {exercise.description}
          </p>
        )}

        <div className="exercise-meta">

          {exercise.sets && (
            <span>
              <strong>
                {exercise.sets}
              </strong>
              Sets
            </span>
          )}

          {exercise.repetitions && (
            <span>
              <strong>
                {exercise.repetitions}
              </strong>
              Repetitions
            </span>
          )}

          {exercise.duration && (
            <span>
              <strong>
                {exercise.duration}
              </strong>
              Duration
            </span>
          )}

        </div>

        {!compact &&
          exercise.instructions && (
            <div className="instructions">

              <h4>
                Instructions
              </h4>

              <ol>

                {exercise.instructions
                  .filter(
                    (item) =>
                      item.trim()
                  )
                  .map(
                    (
                      instruction,
                      index
                    ) => (
                      <li
                        key={index}
                      >
                        {instruction}
                      </li>
                    )
                  )}

              </ol>

            </div>
          )}

        <div className="exercise-actions">

          {exercise.videoUrl && (

            <a
              href={
                exercise.videoUrl
              }
              target="_blank"
              rel="noreferrer"
              className="video-button"
            >
              ▶ Watch Video
            </a>

          )}

          {!compact && (
            <button
              className={
                completed
                  ? "completed-button"
                  : "primary-button"
              }
              onClick={
                onComplete
              }
              disabled={
                completed
              }
            >
              {completed
                ? "✓ Exercise Completed"
                : "✓ Mark as Completed"}
            </button>
          )}

        </div>

      </div>

    </div>
  );
}

// ======================================================
// THERAPIST DASHBOARD
// ======================================================

function TherapistDashboard({
  patients,
  loading,
  onPatients
}) {

  return (
    <div>

      <div className="welcome-banner therapist">

        <div>

          <span className="eyebrow">
            THERAPIST WORKSPACE
          </span>

          <h2>
            Rehabilitation Management
          </h2>

          <p>
            Manage patients, assign
            exercises and monitor
            rehabilitation progress.
          </p>

        </div>

        <div className="therapist-icon">
          +
        </div>

      </div>

      <div className="stat-grid">

        <StatCard
          number={patients.length}
          label="Registered Patients"
        />

        <StatCard
          number="—"
          label="Active Plans"
        />

        <StatCard
          number="—"
          label="Progress Reviews"
        />

      </div>

      <div className="section-heading">

        <div>
          <h2>
            Patient Management
          </h2>

          <p>
            Access patient profiles
            and rehabilitation plans.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onPatients}
        >
          {loading
            ? "Loading..."
            : "View All Patients →"}
        </button>

      </div>

    </div>
  );
}

// ======================================================
// PATIENTS PAGE
// ======================================================

function PatientsPage({
  patients,
  loading,
  onSelect
}) {

  return (
    <div>

      <div className="section-heading">

        <div>
          <h2>
            Registered Patients
          </h2>

          <p>
            Select a patient to
            manage their
            rehabilitation plan.
          </p>
        </div>

      </div>

      {loading ? (

        <div className="empty-card">
          Loading patients...
        </div>

      ) : patients.length === 0 ? (

        <div className="empty-card">

          <div className="empty-icon">
            ♙
          </div>

          <h3>
            No patients found
          </h3>

          <p>
            Patients who complete
            registration will appear
            here.
          </p>

        </div>

      ) : (

        <div className="patient-table">

          <div className="table-header">
            <span>
              Patient
            </span>

            <span>
              Patient ID
            </span>

            <span>
              Age
            </span>

            <span>
              Gender
            </span>

            <span>
              Action
            </span>
          </div>

          {patients.map(
            (patient) => (

              <div
                className="table-row"
                key={
                  patient.patientId
                }
              >

                <div className="patient-name">

                  <div className="avatar">
                    {patient.name
                      ?.charAt(0)
                      ?.toUpperCase()}
                  </div>

                  <strong>
                    {patient.name}
                  </strong>

                </div>

                <span>
                  {patient.patientId}
                </span>

                <span>
                  {patient.age}
                </span>

                <span>
                  {patient.gender}
                </span>

                <button
                  className="small-button"
                  onClick={() =>
                    onSelect(
                      patient
                    )
                  }
                >
                  Open →
                </button>

              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}

// ======================================================
// PATIENT DETAILS
// ======================================================

function PatientDetails({
  patient,
  assignments,
  onAssign,
  onBack,
  onProgress
}) {

  return (
    <div>

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Patients
      </button>

      <div className="patient-profile-header">

        <div className="large-avatar">
          {patient?.name
            ?.charAt(0)
            ?.toUpperCase()}
        </div>

        <div>

          <span className="eyebrow">
            PATIENT PROFILE
          </span>

          <h2>
            {patient?.name}
          </h2>

          <p>
            {patient?.patientId}
          </p>

        </div>

      </div>

      <div className="details-grid">

        <div className="detail-card">

          <span>
            Age
          </span>

          <strong>
            {patient?.age}
          </strong>

        </div>

        <div className="detail-card">

          <span>
            Gender
          </span>

          <strong>
            {patient?.gender}
          </strong>

        </div>

        <div className="detail-card">

          <span>
            Phone
          </span>

          <strong>
            {patient?.phone}
          </strong>

        </div>

      </div>

      <div className="section-heading">

        <div>
          <h2>
            Rehabilitation Plan
          </h2>

          <p>
            Exercises currently
            assigned to this patient.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onAssign}
        >
          + Assign Exercise
        </button>

      </div>

      {assignments.length === 0 ? (

        <div className="empty-card">

          <h3>
            No exercises assigned
          </h3>

          <p>
            Start by assigning
            exercises to this patient.
          </p>

        </div>

      ) : (

        <div className="assignment-mini-grid">

          {assignments.map(
            (
              exercise,
              index
            ) => (

              <div
                className="mini-exercise"
                key={`${exercise.name}-${index}`}
              >

                {exercise.imageUrl && (
                  <img
                    src={
                      exercise.imageUrl
                    }
                    alt={
                      exercise.name
                    }
                  />
                )}

                <div>

                  <strong>
                    {exercise.name}
                  </strong>

                  <span>
                    {exercise.duration ||
                      "Duration not specified"}
                  </span>

                </div>

              </div>

            )
          )}

        </div>

      )}

      <div className="progress-action">

        <button
          className="secondary-button"
          onClick={onProgress}
        >
          View Patient Progress →
        </button>

      </div>

    </div>
  );
}

// ======================================================
// ASSIGN EXERCISES PAGE
// ======================================================

function AssignExercises({
  patient,
  onSave,
  onBack,
  loading
}) {

  const emptyExercise = {
    name: "",
    description: "",
    sets: "",
    repetitions: "",
    duration: "",
    imageUrl: "",
    videoUrl: "",
    instructions: [
      "",
      "",
      ""
    ]
  };

  const [exercises, setExercises] =
    useState([
      {
        ...emptyExercise,
        instructions: [
          "",
          "",
          ""
        ]
      }
    ]);

  function updateExercise(
    index,
    field,
    value
  ) {

    const updated =
      [...exercises];

    updated[index] = {
      ...updated[index],
      [field]: value
    };

    setExercises(updated);
  }

  function updateInstruction(
    exerciseIndex,
    instructionIndex,
    value
  ) {

    const updated =
      [...exercises];

    const instructions =
      [
        ...updated[
          exerciseIndex
        ].instructions
      ];

    instructions[
      instructionIndex
    ] = value;

    updated[
      exerciseIndex
    ] = {
      ...updated[
        exerciseIndex
      ],
      instructions
    };

    setExercises(updated);
  }

  function addExercise() {

    setExercises([
      ...exercises,
      {
        ...emptyExercise,
        instructions: [
          "",
          "",
          ""
        ]
      }
    ]);
  }

  function removeExercise(
    index
  ) {

    if (
      exercises.length === 1
    ) {
      return;
    }

    setExercises(
      exercises.filter(
        (_, i) =>
          i !== index
      )
    );
  }

  function handleSave() {

    for (
      const exercise of exercises
    ) {

      if (
        !exercise.name.trim()
      ) {

        alert(
          "Please enter an exercise name."
        );

        return;
      }

    }

    onSave(
      exercises
    );
  }

  return (
    <div>

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Patient
      </button>

      <div className="assignment-intro">

        <span className="eyebrow">
          ASSIGNMENT
        </span>

        <h2>
          Create Exercise Plan
        </h2>

        <p>
          Patient:{" "}
          <strong>
            {patient?.name}
          </strong>
          {" "}({patient?.patientId})
        </p>

      </div>

      {exercises.map(
        (
          exercise,
          index
        ) => (

          <div
            className="assignment-form-card"
            key={index}
          >

            <div className="assignment-card-header">

              <div>
                <span className="exercise-number">
                  EXERCISE {index + 1}
                </span>

                <h3>
                  Exercise Details
                </h3>
              </div>

              {exercises.length >
                1 && (

                <button
                  className="remove-button"
                  onClick={() =>
                    removeExercise(
                      index
                    )
                  }
                >
                  Remove
                </button>

              )}

            </div>

            <div className="form-grid">

              <div className="form-group full-width">

                <label>
                  Exercise Name *
                </label>

                <input
                  value={
                    exercise.name
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Example: Hand Grip Exercise"
                />

              </div>

              <div className="form-group full-width">

                <label>
                  Description
                </label>

                <textarea
                  value={
                    exercise.description
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Describe the purpose of the exercise..."
                />

              </div>

              <div className="form-group">

                <label>
                  Sets
                </label>

                <input
                  value={
                    exercise.sets
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "sets",
                      e.target.value
                    )
                  }
                  placeholder="Example: 3"
                />

              </div>

              <div className="form-group">

                <label>
                  Repetitions
                </label>

                <input
                  value={
                    exercise.repetitions
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "repetitions",
                      e.target.value
                    )
                  }
                  placeholder="Example: 10"
                />

              </div>

              <div className="form-group">

                <label>
                  Duration
                </label>

                <input
                  value={
                    exercise.duration
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "duration",
                      e.target.value
                    )
                  }
                  placeholder="Example: 5 minutes"
                />

              </div>

              <div className="form-group">

                <label>
                  Image URL
                </label>

                <input
                  value={
                    exercise.imageUrl
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "imageUrl",
                      e.target.value
                    )
                  }
                  placeholder="https://example.com/exercise.jpg"
                />

              </div>

              <div className="form-group full-width">

                <label>
                  Video URL
                </label>

                <input
                  value={
                    exercise.videoUrl
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "videoUrl",
                      e.target.value
                    )
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />

              </div>

            </div>

            <div className="instructions-editor">

              <h4>
                Exercise Instructions
              </h4>

              <p>
                Add clear therapist-provided
                instructions for the patient.
              </p>

              {exercise.instructions.map(
                (
                  instruction,
                  instructionIndex
                ) => (

                  <div
                    className="instruction-input"
                    key={
                      instructionIndex
                    }
                  >

                    <span>
                      {instructionIndex +
                        1}
                    </span>

                    <input
                      value={
                        instruction
                      }
                      onChange={(e) =>
                        updateInstruction(
                          index,
                          instructionIndex,
                          e.target.value
                        )
                      }
                      placeholder={`Instruction ${
                        instructionIndex +
                        1
                      }`}
                    />

                  </div>

                )
              )}

            </div>

          </div>

        )
      )}

      <div className="assignment-footer">

        <button
          className="secondary-button"
          onClick={addExercise}
        >
          + Add Another Exercise
        </button>

        <button
          className="primary-button"
          onClick={
            handleSave
          }
          disabled={loading}
        >
          {loading
            ? "Assigning..."
            : "Assign Exercises →"}
        </button>

      </div>

    </div>
  );
}

// ======================================================
// THERAPIST PROGRESS
// ======================================================

function TherapistProgress({
  patient,
  progress,
  assignments,
  onBack
}) {

  const completedNames =
    progress
      .filter(
        (item) =>
          item.status ===
          "completed"
      )
      .map(
        (item) =>
          item.exercise
      );

  const total =
    assignments.length;

  const completedCount =
    assignments.filter(
      (exercise) =>
        completedNames.includes(
          exercise.name
        )
    ).length;

  const percentage =
    total === 0
      ? 0
      : Math.round(
          (completedCount /
            total) *
            100
        );

  return (
    <div>

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Patient
      </button>

      <div className="progress-header">

        <div>

          <span className="eyebrow">
            PROGRESS MONITORING
          </span>

          <h2>
            {patient?.name}
          </h2>

          <p>
            {patient?.patientId}
          </p>

        </div>

        <div className="progress-big">

          <strong>
            {percentage}%
          </strong>

          <span>
            Overall Completion
          </span>

        </div>

      </div>

      <div className="stat-grid">

        <StatCard
          number={total}
          label="Assigned"
        />

        <StatCard
          number={completedCount}
          label="Completed"
        />

        <StatCard
          number={
            total -
            completedCount
          }
          label="Remaining"
        />

      </div>

      <div className="section-heading">

        <div>
          <h2>
            Exercise Progress
          </h2>
        </div>

      </div>

      <div className="progress-list">

        {assignments.map(
          (
            exercise,
            index
          ) => {

            const isCompleted =
              completedNames.includes(
                exercise.name
              );

            return (
              <div
                className="progress-row"
                key={`${exercise.name}-${index}`}
              >

                <div>

                  <strong>
                    {exercise.name}
                  </strong>

                  <span>
                    {exercise.duration ||
                      "Duration not specified"}
                  </span>

                </div>

                <span
                  className={
                    isCompleted
                      ? "status-complete"
                      : "status-pending"
                  }
                >
                  {isCompleted
                    ? "✓ Completed"
                    : "Pending"}
                </span>

              </div>
            );

          }
        )}

      </div>

    </div>
  );
}