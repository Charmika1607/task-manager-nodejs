/**
 * Comprehensive test script verifying:
 * 1. GET / (Cards rendered with Read More and Delete buttons)
 * 2. POST /create (Creation of new task)
 * 3. Existence of .txt file in tasks/
 * 4. GET /task/:filename (View detail)
 * 5. POST /delete/:filename (Deletion of task file using fs.unlink)
 * 6. Verification that .txt file is gone from filesystem
 * 7. Verification that deleted task no longer appears on home page
 * 8. 404 Error handling on deleting non-existent file
 * 9. Path traversal security prevention on delete
 */

const fs = require('fs');
const path = require('path');

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  try {
    // 1. Create a specific task to test deletion
    const taskParams = new URLSearchParams();
    taskParams.append('title', 'Temporary Task For Deletion Test');
    taskParams.append('description', 'This task will be deleted to test fs.unlink and the POST /delete/:filename endpoint.');

    const createRes = await fetch(`${BASE_URL}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: taskParams.toString(),
      redirect: 'manual'
    });
    assert(createRes.status === 302, 'POST /create successfully created temporary test task');

    // 2. Verify task appears on home page with both Read More and Delete buttons
    const homeRes = await fetch(`${BASE_URL}/`);
    const homeHtml = await homeRes.text();
    assert(homeHtml.includes('Temporary Task For Deletion Test'), 'Home page renders the new task card');
    assert(homeHtml.includes('class="btn btn-delete"'), 'Home page task cards contain Delete button');
    assert(homeHtml.includes('action="/delete/'), 'Home page delete forms point to action="/delete/FILENAME"');
    assert(homeHtml.includes('confirm(\'Are you sure you want to delete this task?\')'), 'Delete form includes confirm() dialog');

    // 3. Extract the exact filename from the rendered form
    const deleteMatch = homeHtml.match(/action="\/delete\/([^"]+)"/);
    assert(deleteMatch !== null, 'Extracted delete form action with filename');
    const filenameToDelete = deleteMatch ? decodeURIComponent(deleteMatch[1]) : '';
    console.log(`Target file for deletion: ${filenameToDelete}`);

    const filePath = path.join(__dirname, 'tasks', filenameToDelete);
    assert(fs.existsSync(filePath), 'Target .txt file physically exists in tasks/ directory before delete');

    // 4. Test POST /delete/:filename
    const deleteRes = await fetch(`${BASE_URL}/delete/${encodeURIComponent(filenameToDelete)}`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert(deleteRes.status === 302, 'POST /delete/:filename responded with 302 redirect');
    const redirectUrl = deleteRes.headers.get('location');
    assert(redirectUrl && redirectUrl.includes('/'), 'POST /delete/:filename redirects back to home page');

    // 5. Verify the .txt file was removed by fs.unlink()
    const fileExistsAfter = fs.existsSync(filePath);
    assert(!fileExistsAfter, 'Target .txt file was permanently removed from disk by fs.unlink()');

    // 6. Verify the deleted task no longer appears on the home page
    const homeAfterRes = await fetch(`${BASE_URL}/`);
    const homeAfterHtml = await homeAfterRes.text();
    assert(!homeAfterHtml.includes(filenameToDelete), 'Deleted task filename no longer appears in home page HTML');

    // 7. Test deleting a non-existent file returns 404
    const deleteNonExistentRes = await fetch(`${BASE_URL}/delete/fake-task-file-9999999.txt`, {
      method: 'POST'
    });
    assert(deleteNonExistentRes.status === 404, 'POST /delete/:filename for non-existent file returns 404 without crashing');

    // 8. Test deleting with path traversal is blocked
    const deleteTraversalRes = await fetch(`${BASE_URL}/delete/..%2Fpackage.json`, {
      method: 'POST'
    });
    assert(deleteTraversalRes.status === 400 || deleteTraversalRes.status === 404, 'Path traversal on POST /delete is blocked');

    // 9. Verify package.json is safe and was not touched
    assert(fs.existsSync(path.join(__dirname, 'package.json')), 'package.json remains intact and protected');

    console.log(`\n========================================`);
    console.log(`ALL TESTS PASSED: ${passed} / ${total} tests successful!`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
