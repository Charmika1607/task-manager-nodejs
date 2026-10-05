/**
 * ============================================================================
 * Task Manager Web Application
 * Built for College Assignment / Demonstration
 * 
 * Technologies:
 *  - Node.js (Runtime)
 *  - Express.js (Web Server & Routing)
 *  - File System (fs) (File-based database storing .txt files)
 *  - HTML, CSS, JavaScript (Frontend UI)
 * ============================================================================
 */

// Step 1: Import required Node.js core modules and Express
const express = require("express");
const fs = require("fs");
const path = require("path");

// Step 2: Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Step 3: Configure middleware
// express.urlencoded parses URL-encoded incoming HTML form bodies into req.body
app.use(express.urlencoded({ extended: true }));

// Serve static assets (CSS stylesheet, client-side JavaScript) from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Step 4: Ensure the 'tasks' storage directory exists
// This automatically creates the folder if it does not already exist when starting the server
const tasksDir = path.join(__dirname, "tasks");
if (!fs.existsSync(tasksDir)) {
  fs.mkdirSync(tasksDir, { recursive: true });
  console.log("Created directory: tasks/");
}

/**
 * Helper Utility: Escape HTML entities to prevent Cross-Site Scripting (XSS)
 * when rendering text files onto HTML pages.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Helper Utility: Parse task file content into Title and Description
 * Format:
 * Title: <title>
 * 
 * Description:
 * <description>
 */
function parseTaskContent(content) {
  // Extract Title line
  const titleMatch = content.match(/^Title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled Task";

  // Extract Description after "Description:"
  const descSeparator = "Description:\n";
  const descSeparatorCRLF = "Description:\r\n";

  let description = "";
  const indexLF = content.indexOf(descSeparator);
  const indexCRLF = content.indexOf(descSeparatorCRLF);

  if (indexLF !== -1) {
    description = content.substring(indexLF + descSeparator.length).trim();
  } else if (indexCRLF !== -1) {
    description = content.substring(indexCRLF + descSeparatorCRLF.length).trim();
  } else {
    // Fallback if formatting differs
    description = content.replace(/^Title:.*$/m, "").trim();
  }

  return { title, description };
}

/**
 * Helper Utility: Render the 404/Error page
 */
function renderError(res, statusCode, title, message) {
  const errorPagePath = path.join(__dirname, "views", "404.html");
  fs.readFile(errorPagePath, "utf8", (err, html) => {
    if (err) {
      return res.status(statusCode).send(`<h1>${title}</h1><p>${message}</p>`);
    }
    const rendered = html
      .replace(/{{ERROR_TITLE}}/g, escapeHtml(title))
      .replace(/{{ERROR_MESSAGE}}/g, escapeHtml(message));
    res.status(statusCode).send(rendered);
  });
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * ----------------------------------------------------------------------------
 * ROUTE 1: Home Page (GET /)
 * ----------------------------------------------------------------------------
 * Concept Demonstrated:
 *  - fs.readdir() -> Reads the directory of all .txt task files
 *  - fs.readFile() -> Reads each task file to extract title & preview
 *  - Dynamic HTML generation without external template engines
 * ----------------------------------------------------------------------------
 */
app.get("/", (req, res) => {
  // 1. Use fs.readdir() to read all files stored in the 'tasks' directory
  fs.readdir(tasksDir, (err, files) => {
    if (err) {
      console.error("Error reading tasks directory:", err);
      return renderError(res, 500, "Server Error", "Could not access the tasks directory.");
    }

    // Filter only .txt files (ignore any hidden files or other formats)
    const taskFiles = files.filter((file) => file.endsWith(".txt"));

    // Read the views/index.html layout
    const indexPath = path.join(__dirname, "views", "index.html");
    fs.readFile(indexPath, "utf8", (err, template) => {
      if (err) {
        console.error("Error reading index.html template:", err);
        return res.status(500).send("Error loading home page template.");
      }

      // If no tasks exist, display an attractive "No tasks yet" empty state
      if (taskFiles.length === 0) {
        const emptyStateHtml = `
          <div class="empty-state">
            <div class="empty-icon">&#128221;</div>
            <h2 class="empty-title">No tasks yet</h2>
            <p class="empty-desc">You haven't created any tasks so far. Get started by clicking the button below!</p>
            <a href="/create" class="btn btn-primary">+ Create Your First Task</a>
          </div>
        `;
        const rendered = template
          .replace("{{TASK_CARDS}}", emptyStateHtml)
          .replace("{{TASK_COUNT}}", "0");
        return res.send(rendered);
      }

      // Read each .txt file asynchronously using fs.readFile()
      let pendingReads = taskFiles.length;
      const tasksData = [];

      taskFiles.forEach((filename) => {
        const filePath = path.join(tasksDir, filename);

        // 2. Use fs.readFile() to read each individual task file's contents
        fs.readFile(filePath, "utf8", (readErr, content) => {
          if (!readErr && content) {
            const parsed = parseTaskContent(content);
            tasksData.push({
              filename: filename,
              title: parsed.title,
              description: parsed.description,
            });
          }

          pendingReads--;
          // Once all files have been read:
          if (pendingReads === 0) {
            // Sort tasks: newest first (based on timestamp in filename or default order)
            tasksData.reverse();

            // Generate HTML cards for each task
            const cardsHtml = tasksData
              .map((task) => {
                // Generate a short preview of the description (max 110 characters)
                const isLong = task.description.length > 110;
                const preview = isLong
                  ? task.description.substring(0, 110) + "..."
                  : task.description;

                const escapedTitle = escapeHtml(task.title);
                const escapedPreview = escapeHtml(preview);
                const safeFilename = encodeURIComponent(task.filename);

                return `
                  <article class="task-card" data-title="${escapedTitle.toLowerCase()}" data-preview="${escapedPreview.toLowerCase()}">
                    <div class="card-top">
                      <div class="card-badge">&#128196; Text File</div>
                      <h2 class="task-title">${escapedTitle}</h2>
                      <p class="task-preview">${escapedPreview || "<em>No description provided</em>"}</p>
                    </div>
                    <div class="card-footer">
                      <span class="file-tag">${escapeHtml(task.filename)}</span>
                      <div class="card-actions">
                        <a href="/task/${safeFilename}" class="btn btn-readmore">
                          Read More &rarr;
                        </a>
                        <form action="/delete/${safeFilename}" method="POST" onsubmit="return confirm('Are you sure you want to delete this task?');" class="delete-form">
                          <button type="submit" class="btn btn-delete">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                `;
              })
              .join("\n");

            // Replace placeholders in the HTML template
            const rendered = template
              .replace("{{TASK_CARDS}}", cardsHtml)
              .replace("{{TASK_COUNT}}", tasksData.length.toString());

            res.send(rendered);
          }
        });
      });
    });
  });
});

/**
 * ----------------------------------------------------------------------------
 * ROUTE 2: Create Task Page (GET /create)
 * ----------------------------------------------------------------------------
 * Displays the form where users can input Task Title and Task Description.
 * ----------------------------------------------------------------------------
 */
app.get("/create", (req, res) => {
  const createPagePath = path.join(__dirname, "views", "create.html");
  res.sendFile(createPagePath);
});

/**
 * ----------------------------------------------------------------------------
 * ROUTE 3: Save Task (POST /create)
 * ----------------------------------------------------------------------------
 * Concepts Demonstrated:
 *  - req.body -> Retrieves submitted form data (title & description)
 *  - Validation -> Ensures fields are not empty / whitespace-only
 *  - Safe Filename Generation -> Sanitizes title + adds timestamp
 *  - fs.writeFile() -> Saves task text file to the /tasks folder
 * ----------------------------------------------------------------------------
 */
app.post("/create", (req, res) => {
  // 1. Use req.body to access the submitted HTML form fields
  const title = req.body.title ? req.body.title.trim() : "";
  const description = req.body.description ? req.body.description.trim() : "";

  // Validation: Check that title and description are not empty
  if (!title || !description) {
    return renderError(
      res,
      400,
      "Validation Error",
      "Both Task Title and Task Description are required."
    );
  }

  // 2. Generate safe filename from task title + timestamp to prevent duplicates
  // Removes special characters, replaces spaces with hyphens, limits to 35 chars
  const sanitizedTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 35) || "task";

  const timestamp = Date.now();
  const filename = `${sanitizedTitle}-${timestamp}.txt`;
  const filePath = path.join(tasksDir, filename);

  // 3. Prepare the exact file content format requested
  const fileContent = `Title: ${title}\n\nDescription:\n${description}\n`;

  // 4. Use fs.writeFile() to write the file asynchronously to disk
  fs.writeFile(filePath, fileContent, "utf8", (err) => {
    if (err) {
      console.error("Error writing task file:", err);
      return renderError(
        res,
        500,
        "File Save Error",
        "Could not save the task file to disk. Please try again."
      );
    }

    console.log(`[Task Created] Saved to: tasks/${filename}`);

    // Redirect user back to the home page with a query parameter for toast notification
    res.redirect("/?created=true");
  });
});

/**
 * ----------------------------------------------------------------------------
 * ROUTE 4: Read More / Task Details (GET /task/:filename)
 * ----------------------------------------------------------------------------
 * Concepts Demonstrated:
 *  - req.params.filename -> Captures dynamic URL parameter
 *  - Security Check -> Prevents path traversal attacks (e.g. "../" or invalid names)
 *  - fs.readFile() -> Reads the specific task .txt file
 *  - 404 Error Handling -> Displays a custom not-found page if file doesn't exist
 * ----------------------------------------------------------------------------
 */
app.get("/task/:filename", (req, res) => {
  // 1. Use req.params to get the requested filename from the route URL
  const filename = req.params.filename;

  // Path Traversal Security Verification:
  // Ensure the filename is strictly a single .txt file name without directories or relative jumps
  if (
    !filename ||
    !filename.endsWith(".txt") ||
    path.basename(filename) !== filename ||
    filename.includes("..")
  ) {
    return renderError(
      res,
      400,
      "Invalid File Request",
      "The specified filename contains invalid characters or an unsupported path."
    );
  }

  const filePath = path.join(tasksDir, filename);

  // 2. Use fs.readFile() to read the complete task file
  fs.readFile(filePath, "utf8", (err, content) => {
    // If the file does not exist (ENOENT) or reading fails, show proper 404 page
    if (err) {
      if (err.code === "ENOENT") {
        return renderError(
          res,
          404,
          "Task File Not Found",
          `The requested task file "${filename}" does not exist in the tasks directory.`
        );
      }
      console.error("Error reading file:", err);
      return renderError(res, 500, "Read Error", "An error occurred while reading the task file.");
    }

    // Parse Title and Description
    const parsed = parseTaskContent(content);

    // Read the views/task.html detail view template
    const taskPagePath = path.join(__dirname, "views", "task.html");
    fs.readFile(taskPagePath, "utf8", (templateErr, template) => {
      if (templateErr) {
        console.error("Error reading task.html template:", templateErr);
        return res.status(500).send("Error loading task details page template.");
      }

      // Substitute variables in the template
      const rendered = template
        .replace(/{{TASK_TITLE}}/g, escapeHtml(parsed.title))
        .replace(/{{TASK_DESCRIPTION}}/g, escapeHtml(parsed.description))
        .replace(/{{TASK_FILENAME}}/g, escapeHtml(filename))
        .replace(/{{TASK_FILENAME_RAW}}/g, encodeURIComponent(filename));

      res.send(rendered);
    });
  });
});

/**
 * ----------------------------------------------------------------------------
 * ROUTE 5: Delete Task (POST /delete/:filename)
 * ----------------------------------------------------------------------------
 * Concepts Demonstrated:
 *  - req.params.filename -> Identifies which .txt file to delete via URL parameter
 *  - Security Check -> Prevents path traversal and restricts deletion strictly to /tasks
 *  - fs.unlink() -> Node.js File System method to remove the file from disk
 *  - Error Handling -> Handles non-existent files (ENOENT) and other I/O errors gracefully
 *  - res.redirect("/") -> Automatically returns user to the home page
 * ----------------------------------------------------------------------------
 */
app.post("/delete/:filename", (req, res) => {
  // 1. Use req.params to extract the target filename
  const filename = req.params.filename;

  // 2. Security validation: prevent path traversal attacks (e.g. "../" or invalid names)
  if (
    !filename ||
    !filename.endsWith(".txt") ||
    path.basename(filename) !== filename ||
    filename.includes("..")
  ) {
    return renderError(
      res,
      400,
      "Invalid File Request",
      "The specified filename contains invalid characters or an unsupported path."
    );
  }

  // Ensure file is strictly located inside the tasks directory
  const filePath = path.join(tasksDir, filename);
  if (!filePath.startsWith(tasksDir)) {
    return renderError(
      res,
      403,
      "Access Denied",
      "Forbidden: Cannot access files outside the tasks directory."
    );
  }

  // 3. Use fs.unlink() to asynchronously delete the .txt file from the tasks folder
  fs.unlink(filePath, (err) => {
    if (err) {
      // Handle the case where the task file does not exist (ENOENT)
      if (err.code === "ENOENT") {
        console.warn(`[Delete Warning] File not found: ${filename}`);
        return renderError(
          res,
          404,
          "Task File Not Found",
          `The task file "${filename}" could not be deleted because it does not exist.`
        );
      }

      // Handle any other system or permission errors without crashing the server
      console.error(`[Delete Error] Could not delete ${filename}:`, err);
      return renderError(
        res,
        500,
        "Delete Error",
        "Could not delete the task file from the server."
      );
    }

    console.log(`[Task Deleted] Removed file using fs.unlink(): tasks/${filename}`);

    // 4. Return to the home page; the deleted task will no longer appear
    res.redirect("/?deleted=true");
  });
});

// Alias route for backwards compatibility if needed
app.post("/task/:filename/delete", (req, res) => {
  res.redirect(307, `/delete/${encodeURIComponent(req.params.filename)}`);
});

/**
 * ----------------------------------------------------------------------------
 * 404 Fallback Handler for any unhandled routes
 * ----------------------------------------------------------------------------
 */
app.use((req, res) => {
  renderError(
    res,
    404,
    "Page Not Found",
    "The page you are looking for does not exist."
  );
});

// Step 5: Start the Express Server
app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`  Task Manager Server is running!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Storage Directory: ${tasksDir}`);
  console.log("==================================================");
});
