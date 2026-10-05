# Task Manager

## Description

A simple and modern **Task Manager** web application built using **Node.js**, **Express.js**, and the built-in **File System (`fs`)** module. 

Instead of relying on an external database (like MongoDB or MySQL), every task is persisted directly onto the server's local disk as an individual `.txt` file inside the `tasks/` directory.

---

## Features

* **Create Tasks**: Create tasks with a Title and full Description through an intuitive web form.
* **Save Tasks as `.txt` Files**: Automatically formats and writes each task into a safely named `.txt` file using Node.js `fs.writeFile()`.
* **Display Saved Tasks**: Scans the `tasks/` directory using `fs.readdir()` and displays tasks as interactive cards.
* **Short Previews**: Each task card dynamically extracts the title and provides a concise snippet of the description.
* **Read Complete Task Details**: Dedicated "Read More" page (`/task/:filename`) displaying the full title, complete description, and file metadata.
* **Delete Tasks**: Remove tasks safely using an explicit POST form (`/delete/:filename`) with a browser confirmation dialog and `fs.unlink()`.
* **Path Traversal Security**: Comprehensive input sanitization prevents directory traversal attacks outside the `tasks/` folder.
* **Error Handling & 404 Pages**: Gracefully handles missing files, invalid filenames, or empty submissions without crashing the server.
* **Modern & Responsive UI**: Styled with modern CSS featuring sleek dark mode, glassmorphism accents, live search filtering, and character counters.

---

## Technologies

* **Runtime**: [Node.js](https://nodejs.org/)
* **Web Framework**: [Express.js](https://expressjs.com/)
* **Persistence**: Node.js core `fs` (File System) & `path` modules
* **Frontend**: Vanilla HTML5, Modern CSS3, and JavaScript (ES6+)

---

## How to Run

### 1. Clone the repository
```bash
git clone https://github.com/Charmika1607/task-manager-nodejs.git
cd task-manager-nodejs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the application
```bash
npm start
```

### 4. Open in your browser
Navigate to:
```text
http://localhost:3000
```

*(Optional: Run in development mode with live reload using `npm run dev`)*

---

## File System Methods Used

This application demonstrates the primary asynchronous operations of the Node.js `fs` module:

| Method | Role in this Application | Route / Location |
| :--- | :--- | :--- |
| **`fs.writeFile()`** | Formats and asynchronously saves a new task as a `.txt` file. | `POST /create` |
| **`fs.readdir()`** | Reads the `tasks/` directory to discover all saved `.txt` files. | `GET /` |
| **`fs.readFile()`** | Reads the contents of `.txt` task files to parse title & description, and loads HTML views. | `GET /` & `GET /task/:filename` |
| **`fs.unlink()`** | Asynchronously deletes the specific `.txt` file from the disk. | `POST /delete/:filename` |

---

## Express Routes

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Home page listing all saved tasks as responsive cards. |
| `GET` | `/create` | Form page to enter task title and description. |
| `POST` | `/create` | Form submission endpoint; accesses `req.body`, generates filename, and writes file. |
| `GET` | `/task/:filename` | Task details page; uses `req.params.filename` to read and display full task. |
| `POST` | `/delete/:filename` | Deletes the task file using `req.params.filename` and `fs.unlink()`. |

---

## Project Structure

```text
task-manager-nodejs/
│
├── app.js               # Express application, routes, fs operations & security logic
├── package.json         # Project metadata, dependencies & npm scripts
├── package-lock.json    # Exact dependency tree lockfile
├── .gitignore           # Ignores node_modules, environment variables, and system files
├── README.md            # Project documentation and setup guide
│
├── tasks/               # Storage directory for task .txt files (tracked with .gitkeep)
│   └── .gitkeep
│
├── public/              # Static assets served by Express
│   ├── style.css        # Responsive dark theme, card grid & button styling
│   └── script.js        # Client-side search filtering, character counters & toasts
│
└── views/               # Frontend HTML layout templates
    ├── index.html       # Home page view with task grid & search bar
    ├── create.html      # Task creation form view
    ├── task.html        # "Read More" detail view with delete & copy actions
    └── 404.html         # Custom error and not-found view
```

---

## License

This project is created for educational and college assignment demonstration purposes.
