# Happy Labs Backend API

A lightweight, local-first backend API built with Node.js, Express.js, and SQLite3 to serve customer enquiries and portfolio items.

## Technologies Used
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3 (Local file-based SQL database)
- **Tooling**: Nodemon (Auto-reloads on changes), Dotenv (Config management)

---

## Installation & Running

1. **Navigate to the Backend Directory**:
   ```bash
   cd /Applications/Setapp/nagul-freelance/happy-backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000` by default (defined in `.env`).*

4. **Verify Database Initialization**:
   - On the first boot, the server will automatically create `database.sqlite` and seed it using the SQL table scripts inside `schema.sql`.

---

## API Endpoints

### 1. Portfolio Items (`/api/portfolio`)
- **GET `/api/portfolio`**: Fetch all portfolio projects.
- **POST `/api/portfolio`**: Add a new portfolio item.
  - Body (JSON): `{"category": "webdesign", "title": "New Project", "date": "August 2026", "img": "/img/folio1.jpg", "lead": "Short intro", "body": "Long description"}`
- **PUT `/api/portfolio/:id`**: Edit an existing project by ID.
  - Body (JSON): Fields to update.
- **DELETE `/api/portfolio/:id`**: Delete a project by ID.

### 2. Customer Enquiries (`/api/enquiries`)
- **GET `/api/enquiries`**: Fetch all customer contact messages.
- **POST `/api/enquiries`**: Submit a new enquiry (used by the frontend contact form).
  - Body (JSON): `{"name": "John Doe", "email": "john@doe.com", "message": "Hello!"}`
- **PUT `/api/enquiries/:id`**: Toggle enquiry read/unread status.
- **DELETE `/api/enquiries/:id`**: Delete an enquiry by ID.
