import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("edu_path.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'student',
    ssc_gpa REAL,
    hsc_gpa REAL,
    group_name TEXT,
    last_active DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- Public/Private
    location TEXT NOT NULL,
    description TEXT,
    min_ssc_gpa REAL,
    min_hsc_gpa REAL,
    website TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS scholarships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    university_id INTEGER,
    amount TEXT,
    deadline DATE,
    description TEXT,
    FOREIGN KEY (university_id) REFERENCES universities(id)
  );

  CREATE TABLE IF NOT EXISTS scholarship_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    scholarship_id INTEGER,
    status TEXT DEFAULT 'pending',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scholarship_id) REFERENCES scholarships(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    university_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (university_id) REFERENCES universities(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    type TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial data
const insertUni = db.prepare("INSERT OR IGNORE INTO universities (name, type, location, description, min_ssc_gpa, min_hsc_gpa, website) VALUES (?, ?, ?, ?, ?, ?, ?)");

// Seed Admin User
const insertAdmin = db.prepare("INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
insertAdmin.run("System Admin", "admin@edupath.bd", "admin123", "admin");

// Public Universities
insertUni.run("University of Dhaka", "Public", "Dhaka", "The oldest and most prestigious university in Bangladesh, offering a wide range of disciplines.", 4.5, 4.5, "https://www.du.ac.bd");
insertUni.run("BUET", "Public", "Dhaka", "Bangladesh University of Engineering and Technology, the premier engineering institution.", 5.0, 5.0, "https://www.buet.ac.bd");
insertUni.run("Jahangirnagar University", "Public", "Savar", "A fully residential public university known for its scenic campus and research.", 4.0, 4.0, "https://www.juniv.edu");
insertUni.run("University of Rajshahi", "Public", "Rajshahi", "One of the largest and oldest universities in the country with a rich academic history.", 4.0, 4.0, "https://www.ru.ac.bd");
insertUni.run("University of Chittagong", "Public", "Chittagong", "A major public research university located in the hills of Chittagong.", 4.0, 4.0, "https://www.cu.ac.bd");
insertUni.run("SUST", "Public", "Sylhet", "Shahjalal University of Science and Technology, a leader in science and tech education.", 4.5, 4.5, "https://www.sust.edu");
insertUni.run("Khulna University", "Public", "Khulna", "A top-tier public university known for its academic excellence and discipline.", 4.0, 4.0, "https://ku.ac.bd");
insertUni.run("Jagannath University", "Public", "Dhaka", "A prominent public university located in the heart of Old Dhaka.", 4.0, 4.0, "https://jnu.ac.bd");
insertUni.run("Bangladesh Agricultural University", "Public", "Mymensingh", "The premier institution for agricultural education and research.", 4.0, 4.0, "https://www.bau.edu.bd");

// Private Universities
insertUni.run("North South University", "Private", "Dhaka", "The first private university in Bangladesh, known for its business and engineering programs.", 3.5, 3.5, "https://www.northsouth.edu");
insertUni.run("BRAC University", "Private", "Dhaka", "A leading private university focused on liberal arts and social impact.", 3.5, 3.5, "https://www.bracu.ac.bd");
insertUni.run("AIUB", "Private", "Dhaka", "American International University-Bangladesh, excellence in engineering and technology.", 3.0, 3.0, "https://www.aiub.edu");
insertUni.run("East West University", "Private", "Dhaka", "A top-ranked private university with strong business and science faculties.", 3.0, 3.0, "https://www.ewubd.edu");
insertUni.run("Independent University, Bangladesh", "Private", "Dhaka", "Known for its modern campus and diverse range of undergraduate programs.", 3.0, 3.0, "https://www.iub.edu.bd");
insertUni.run("United International University", "Private", "Dhaka", "A rapidly growing private university with a focus on research and innovation.", 3.0, 3.0, "https://www.uiu.ac.bd");
insertUni.run("AUST", "Private", "Dhaka", "Ahsanullah University of Science and Technology, highly regarded for engineering.", 4.0, 4.0, "https://www.aust.edu");
insertUni.run("Daffodil International University", "Private", "Dhaka", "A leading private university with a strong focus on ICT and entrepreneurship.", 2.5, 2.5, "https://daffodilvarsity.edu.bd");

// Seed Scholarships
const insertScholarship = db.prepare("INSERT OR IGNORE INTO scholarships (name, university_id, amount, deadline, description) VALUES (?, ?, ?, ?, ?)");
insertScholarship.run("NSU Merit Scholarship", 10, "100% Tuition Waiver", "2025-06-30", "Awarded to top performers in the admission test. Requires maintaining a minimum CGPA of 3.5 throughout the program.");
insertScholarship.run("BRACU Need-based Aid", 11, "Up to 100% Waiver", "2025-07-15", "Financial assistance for students with demonstrated financial need. Requires submission of income tax returns and other financial documents.");
insertScholarship.run("AIUB Academic Excellence", 12, "50% Tuition Waiver", "2025-08-01", "For students maintaining a CGPA of 3.8 or above. Applicable for the subsequent semester.");
insertScholarship.run("DU Merit Grant", 1, "Monthly Stipend", "2025-05-20", "Awarded to the top 10 students in each faculty based on admission test results.");
insertScholarship.run("BUET Research Fellowship", 2, "Full Funding", "2025-09-15", "For undergraduate students participating in faculty-led research projects in engineering.");
insertScholarship.run("EWU Medha Lalon", 13, "100% Waiver", "2025-06-15", "Merit-based scholarship for students with GPA 5.0 in both SSC and HSC.");
insertScholarship.run("IUB Financial Grant", 14, "25-50% Waiver", "2025-07-20", "Need-based grant for students from low-income families or remote areas.");
insertScholarship.run("UIU Innovation Award", 15, "Fixed Grant", "2025-10-10", "Awarded to students who demonstrate exceptional projects in the UIU Innovation Lab.");

// Store active WebSocket connections
const clients = new Map<number, WebSocket>();

function sendNotification(userId: number, message: string) {
  try {
    const stmt = db.prepare("INSERT INTO notifications (user_id, message) VALUES (?, ?)");
    stmt.run(userId, message);
    
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "NOTIFICATION", message }));
    }
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get("userId") || "0");
    
    if (userId) {
      clients.set(userId, ws);
      ws.on("close", () => clients.delete(userId));
    }
  });

  app.use(express.json());

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, ssc_gpa, hsc_gpa, group_name } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, password, ssc_gpa, hsc_gpa, group_name) VALUES (?, ?, ?, ?, ?, ?)");
      const result = stmt.run(name, email, password, ssc_gpa, hsc_gpa, group_name);
      res.json({ id: result.lastInsertRowid, name, email, role: 'student' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
    if (user) {
      db.prepare("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/ping", (req, res) => {
    const { user_id } = req.body;
    if (user_id) {
      db.prepare("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?").run(user_id);
    }
    res.json({ success: true });
  });

  app.get("/api/universities", (req, res) => {
    const unis = db.prepare("SELECT * FROM universities").all();
    res.json(unis);
  });

  app.get("/api/scholarships", (req, res) => {
    const scholarships = db.prepare(`
      SELECT s.*, u.name as university_name 
      FROM scholarships s 
      JOIN universities u ON s.university_id = u.id
    `).all();
    res.json(scholarships);
  });

  app.post("/api/applications", (req, res) => {
    const { user_id, university_id } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO applications (user_id, university_id) VALUES (?, ?)");
      stmt.run(user_id, university_id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/applications/:userId", (req, res) => {
    const apps = db.prepare(`
      SELECT a.*, u.name as university_name 
      FROM applications a 
      JOIN universities u ON a.university_id = u.id 
      WHERE a.user_id = ?
    `).all(req.params.userId);
    
    const scholarshipApps = db.prepare(`
      SELECT sa.*, s.name as scholarship_name, u.name as university_name
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarship_id = s.id
      JOIN universities u ON s.university_id = u.id
      WHERE sa.user_id = ?
    `).all(req.params.userId);

    res.json({ universityApps: apps, scholarshipApps });
  });

  app.post("/api/scholarship-applications", (req, res) => {
    const { user_id, scholarship_id } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO scholarship_applications (user_id, scholarship_id) VALUES (?, ?)");
      stmt.run(user_id, scholarship_id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Documents Endpoints
  app.get("/api/documents/:userId", (req, res) => {
    const docs = db.prepare("SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
    res.json(docs);
  });

  app.post("/api/documents", (req, res) => {
    const { user_id, name, type } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO documents (user_id, name, type) VALUES (?, ?, ?)");
      const result = stmt.run(user_id, name, type);
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Notifications Endpoints
  app.get("/api/notifications/:userId", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(req.params.userId);
    res.json(notifications);
  });

  app.post("/api/notifications/read", (req, res) => {
    const { user_id } = req.body;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(user_id);
    res.json({ success: true });
  });

  // Update Application Status with Notification
  app.put("/api/admin/applications/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      const appData = db.prepare("SELECT user_id, university_id FROM applications WHERE id = ?").get(req.params.id) as any;
      const uni = db.prepare("SELECT name FROM universities WHERE id = ?").get(appData.university_id) as any;
      
      db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
      
      sendNotification(appData.user_id, `Your application for ${uni.name} has been ${status}.`);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/scholarship-applications/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      const appData = db.prepare("SELECT user_id, scholarship_id FROM scholarship_applications WHERE id = ?").get(req.params.id) as any;
      const scholarship = db.prepare("SELECT name FROM scholarships WHERE id = ?").get(appData.scholarship_id) as any;
      
      db.prepare("UPDATE scholarship_applications SET status = ? WHERE id = ?").run(status, req.params.id);
      
      sendNotification(appData.user_id, `Your scholarship application for ${scholarship.name} has been ${status}.`);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/documents/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      const doc = db.prepare("SELECT user_id, name FROM documents WHERE id = ?").get(req.params.id) as any;
      db.prepare("UPDATE documents SET status = ? WHERE id = ?").run(status, req.params.id);
      sendNotification(doc.user_id, `Your document "${doc.name}" has been ${status}.`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin CRUD for Universities
  app.post("/api/admin/universities", (req, res) => {
    const { name, type, location, description, min_ssc_gpa, min_hsc_gpa, website } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO universities (name, type, location, description, min_ssc_gpa, min_hsc_gpa, website) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const result = stmt.run(name, type, location, description, min_ssc_gpa, min_hsc_gpa, website);
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/universities/:id", (req, res) => {
    const { name, type, location, description, min_ssc_gpa, min_hsc_gpa, website } = req.body;
    try {
      const stmt = db.prepare("UPDATE universities SET name = ?, type = ?, location = ?, description = ?, min_ssc_gpa = ?, min_hsc_gpa = ?, website = ? WHERE id = ?");
      stmt.run(name, type, location, description, min_ssc_gpa, min_hsc_gpa, website, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/universities/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM universities WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin CRUD for Scholarships
  app.post("/api/admin/scholarships", (req, res) => {
    const { name, university_id, amount, deadline, description } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO scholarships (name, university_id, amount, deadline, description) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(name, university_id, amount, deadline, description);
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/admin/scholarships/:id", (req, res) => {
    const { name, university_id, amount, deadline, description } = req.body;
    try {
      const stmt = db.prepare("UPDATE scholarships SET name = ?, university_id = ?, amount = ?, deadline = ?, description = ? WHERE id = ?");
      stmt.run(name, university_id, amount, deadline, description, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/scholarships/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM scholarships WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // User Profile Update
  app.put("/api/users/:id", (req, res) => {
    const { name, ssc_gpa, hsc_gpa, group_name } = req.body;
    try {
      const stmt = db.prepare("UPDATE users SET name = ?, ssc_gpa = ?, hsc_gpa = ?, group_name = ? WHERE id = ?");
      stmt.run(name, ssc_gpa, hsc_gpa, group_name, req.params.id);
      const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin Endpoints
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, ssc_gpa, hsc_gpa, group_name, last_active, created_at FROM users").all();
    res.json(users);
  });

  app.get("/api/admin/applications", (req, res) => {
    const apps = db.prepare(`
      SELECT a.*, u.name as university_name, us.name as student_name, us.email as student_email
      FROM applications a 
      JOIN universities u ON a.university_id = u.id 
      JOIN users us ON a.user_id = us.id
    `).all();

    const scholarshipApps = db.prepare(`
      SELECT sa.*, s.name as scholarship_name, u.name as university_name, us.name as student_name, us.email as student_email
      FROM scholarship_applications sa
      JOIN scholarships s ON sa.scholarship_id = s.id
      JOIN universities u ON s.university_id = u.id
      JOIN users us ON sa.user_id = us.id
    `).all();

    res.json({ universityApps: apps, scholarshipApps });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
