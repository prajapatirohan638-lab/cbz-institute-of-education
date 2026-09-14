from flask import Flask, request, jsonify, send_from_directory, redirect
from werkzeug.utils import redirect, secure_filename
from pywebpush import webpush, WebPushException
import os
import requests
import base64
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
SUPABASE_ADMIN_KEY = os.getenv("SUPABASE_ADMIN_KEY", "").strip()
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "").replace("\\n", "\n").strip()
print(
    "VAPID KEY CHECK:",
    VAPID_PRIVATE_KEY.startswith("-----BEGIN EC PRIVATE KEY-----"),
    VAPID_PRIVATE_KEY.endswith("-----END EC PRIVATE KEY-----"),
    len(VAPID_PRIVATE_KEY)
)
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "").strip()
print("VAPID DEBUG:", bool(VAPID_PRIVATE_KEY), bool(VAPID_EMAIL))

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

app = Flask(
    __name__,
    static_folder=".",
    static_url_path=""
)

# =========================
# BASIC SETTINGS
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

NOTES_FOLDER = os.path.join(BASE_DIR, "notes")
SYLLABUS_FOLDER = os.path.join(BASE_DIR, "syllabus")
QUESTION_PAPER_FOLDER = os.path.join(BASE_DIR, "question-paper")
MOCK_TESTS_FILE = os.path.join(BASE_DIR, "mock-tests.json")

# ==============================
# GitHub Storage Configuration
# ==============================

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()

GITHUB_REPO = os.getenv(
    "GITHUB_REPO",
    "prajapatirohan638-lab/cbz-institute-of-education"
).strip()

GITHUB_BRANCH = os.getenv(
    "GITHUB_BRANCH",
    "master"
).strip()

GITHUB_API = f"https://api.github.com/repos/{GITHUB_REPO}/contents"


def github_headers():
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    return headers


def github_raw_url(repo_path):
    return (
        f"https://raw.githubusercontent.com/"
        f"{GITHUB_REPO}/{GITHUB_BRANCH}/{repo_path}"
    )

# ============================================================
# MOCK TEST STORAGE
# ============================================================
# ============================================================
# MOCK TEST STORAGE - GITHUB
# ============================================================

import json
import uuid


MOCK_TESTS_REPO_PATH = "mock-tests.json"


def load_mock_tests():

    if not GITHUB_TOKEN:
        print("GitHub token is not configured.")
        return []

    try:

        response = requests.get(
            f"{GITHUB_API}/{MOCK_TESTS_REPO_PATH}",
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH},
            timeout=30
        )

        # File does not exist yet
        if response.status_code == 404:
            return []

        if response.status_code != 200:
            print(
                "GitHub mock test load error:",
                response.text
            )
            return []

        data = response.json()

        encoded_content = data.get("content", "")
        encoded_content = encoded_content.replace("\n", "")

        decoded_content = base64.b64decode(
            encoded_content
        ).decode("utf-8")

        tests = json.loads(decoded_content)

        if isinstance(tests, list):
            return tests

        return []

    except Exception as e:

        print(
            "Mock test load error:",
            e
        )

        return []


def save_mock_tests(tests):

    if not GITHUB_TOKEN:
        print("GitHub token is not configured.")
        return False

    try:

        file_url = (
            f"{GITHUB_API}/"
            f"{MOCK_TESTS_REPO_PATH}"
        )

        # Check whether mock-tests.json already exists
        response = requests.get(
            file_url,
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH},
            timeout=30
        )

        file_sha = None

        if response.status_code == 200:

            file_data = response.json()
            file_sha = file_data.get("sha")

        elif response.status_code != 404:

            print(
                "GitHub mock test check error:",
                response.text
            )

            return False

        # Convert tests to JSON
        json_content = json.dumps(
            tests,
            indent=4,
            ensure_ascii=False
        )

        # Convert JSON to Base64
        encoded_content = base64.b64encode(
            json_content.encode("utf-8")
        ).decode("utf-8")

        payload = {
            "message": "Update mock tests",
            "content": encoded_content,
            "branch": GITHUB_BRANCH
        }

        # Existing file needs SHA
        if file_sha:
            payload["sha"] = file_sha

        upload_response = requests.put(
            file_url,
            headers=github_headers(),
            json=payload,
            timeout=30
        )

        if upload_response.status_code not in (200, 201):

            print(
                "GitHub mock test save error:",
                upload_response.text
            )

            return False

        print("Mock tests saved to GitHub successfully.")

        return True

    except Exception as e:

        print(
            "Mock test save error:",
            e
        )

        return False

os.makedirs(NOTES_FOLDER, exist_ok=True)
os.makedirs(SYLLABUS_FOLDER, exist_ok=True)
os.makedirs(QUESTION_PAPER_FOLDER, exist_ok=True)


# =========================
# VALID CLASSES & SUBJECTS
# =========================

CLASSES = {
    f"Class {i}": f"class{i}"
    for i in range(5, 13)
}

SUBJECTS = {
    "Mathematics": "mathematics",
    "Physics": "physics",
    "Chemistry": "chemistry",
    "Biology": "biology",
    "Geography": "geography",
    "History": "history",
    "English": "english"
}


# =========================
# HELPER FUNCTIONS
# =========================

def get_class_slug(class_name):
    class_name = str(class_name or "").strip()

    if class_name in CLASSES:
        return CLASSES[class_name]

    return None


def get_subject_slug(subject):
    subject = str(subject or "").strip()

    if subject in SUBJECTS:
        return SUBJECTS[subject]

    return None


def get_document_folder(base_folder, class_name, subject):
    class_slug = get_class_slug(class_name)
    subject_slug = get_subject_slug(subject)

    if not class_slug or not subject_slug:
        return None

    folder = os.path.join(
        base_folder,
        class_slug,
        subject_slug
    )

    os.makedirs(folder, exist_ok=True)

    return folder


def list_pdfs(base_folder, class_name, subject, url_folder):

    class_slug = get_class_slug(class_name)
    subject_slug = get_subject_slug(subject)

    if not class_slug or not subject_slug:
        return []

    repo_folder = (
        f"{url_folder}/"
        f"{class_slug}/"
        f"{subject_slug}"
    )

    try:
        response = requests.get(
            f"{GITHUB_API}/{repo_folder}",
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH},
            timeout=30
        )

        if response.status_code == 404:
            return []

        if response.status_code != 200:
            print("GitHub list error:", response.text)
            return []

        data = response.json()

        files = []

        for item in data:

            if (
                item.get("type") == "file"
                and item.get("name", "").lower().endswith(".pdf")
            ):
                files.append({
                    "name": item["name"],
                    "path": (
                        f"{url_folder}/"
                        f"{class_slug}/"
                        f"{subject_slug}/"
                        f"{item['name']}"
                    )
                })

        files.sort(
            key=lambda item: item["name"].lower()
        )

        return files

    except Exception as e:
        print("GitHub list error:", e)
        return []


def validate_pdf(file):
    if file is None:
        return False, "No PDF file selected."

    if file.filename == "":
        return False, "No PDF file selected."

    if not file.filename.lower().endswith(".pdf"):
        return False, "Only PDF files are allowed."

    return True, ""


def upload_document(base_folder, class_name, subject, file, url_folder):

    valid, message = validate_pdf(file)

    if not valid:
        return False, message, None

    class_slug = get_class_slug(class_name)
    subject_slug = get_subject_slug(subject)

    if not class_slug or not subject_slug:
        return False, "Invalid class or subject.", None

    filename = secure_filename(file.filename)

    if not filename:
        return False, "Invalid file name.", None

    # GitHub file path
    repo_path = (
        f"{url_folder}/"
        f"{class_slug}/"
        f"{subject_slug}/"
        f"{filename}"
    )

    if not GITHUB_TOKEN:
        return False, "GitHub storage is not configured.", None

    # Check whether file already exists on GitHub
    check_url = f"{GITHUB_API}/{repo_path}"

    check_response = requests.get(
        check_url,
        headers=github_headers(),
        params={"ref": GITHUB_BRANCH},
        timeout=30
    )

    if check_response.status_code == 200:
        return False, "A PDF with this name already exists.", None

    if check_response.status_code != 404:
        return False, "Could not check GitHub storage.", None

    try:
        # Read PDF
        file_bytes = file.read()

        # Convert PDF to Base64
        encoded_file = base64.b64encode(file_bytes).decode("utf-8")

        # Upload to GitHub
        response = requests.put(
            check_url,
            headers=github_headers(),
            json={
                "message": f"Upload {filename}",
                "content": encoded_file,
                "branch": GITHUB_BRANCH
            },
            timeout=60
        )

        if response.status_code not in (200, 201):
            return False, "Could not upload PDF to GitHub.", None

        relative_path = (
            f"{url_folder}/"
            f"{class_slug}/"
            f"{subject_slug}/"
            f"{filename}"
        )

        return True, "PDF uploaded successfully!", relative_path

    except Exception as e:
        print("GitHub upload error:", e)
        return False, "An error occurred while uploading the PDF.", None


def delete_document(base_folder, class_name, subject, filename):

    class_slug = get_class_slug(class_name)
    subject_slug = get_subject_slug(subject)

    if not class_slug or not subject_slug:
        return False, "Invalid class or subject."

    safe_filename = secure_filename(
        str(filename or "")
    )

    if not safe_filename:
        return False, "Invalid file name."

    # Decide GitHub folder
    if os.path.normpath(base_folder) == os.path.normpath(NOTES_FOLDER):
        url_folder = "notes"

    elif os.path.normpath(base_folder) == os.path.normpath(SYLLABUS_FOLDER):
        url_folder = "syllabus"

    elif os.path.normpath(base_folder) == os.path.normpath(QUESTION_PAPER_FOLDER):
        url_folder = "question-paper"

    else:
        return False, "Invalid document folder."

    repo_path = (
        f"{url_folder}/"
        f"{class_slug}/"
        f"{subject_slug}/"
        f"{safe_filename}"
    )

    if not GITHUB_TOKEN:
        return False, "GitHub storage is not configured."

    try:
        file_url = f"{GITHUB_API}/{repo_path}"

        # Get file information and SHA
        response = requests.get(
            file_url,
            headers=github_headers(),
            params={"ref": GITHUB_BRANCH},
            timeout=30
        )

        if response.status_code == 404:
            return False, "PDF not found."

        if response.status_code != 200:
            return False, "Could not find PDF on GitHub."

        file_data = response.json()
        file_sha = file_data.get("sha")

        # Delete from GitHub
        delete_response = requests.delete(
            file_url,
            headers=github_headers(),
            json={
                "message": f"Delete {safe_filename}",
                "sha": file_sha,
                "branch": GITHUB_BRANCH
            },
            timeout=30
        )

        if delete_response.status_code != 200:
            print("GitHub delete error:", delete_response.text)
            return False, "Could not delete PDF from GitHub."

        return True, "PDF deleted successfully!"

    except Exception as e:
        print("GitHub delete error:", e)
        return False, "An error occurred while deleting the PDF."


# =========================
# HOME PAGE
# =========================

@app.route("/")
def home():
    return send_from_directory(
        BASE_DIR,
        "index.html"
    )


# =========================
# HEALTH CHECK
# =========================

@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "message": "CBZ Institute server is running."
    })

@app.route("/api/notices", methods=["GET"])
def get_notices():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return jsonify({
            "success": False,
            "message": "Supabase is not configured."
        }), 500

    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/notices",
            headers=supabase_headers(),
            params={
                "select": "id,title,message,created_at",
                "order": "created_at.desc"
            },
            timeout=15
        )

        if response.status_code != 200:
            print("Supabase notices error:", response.text)
            return jsonify({
                "success": False,
                "message": "Could not load notices."
            }), 500

        return jsonify({
            "success": True,
            "notices": response.json()
        })

    except Exception as e:
        print("Supabase connection error:", e)
        return jsonify({
            "success": False,
            "message": "Supabase connection failed."
        }), 500

@app.route("/api/notices", methods=["POST"])
def add_notice():
    if not SUPABASE_URL or not SUPABASE_ADMIN_KEY:
        return jsonify({
            "success": False,
            "message": "Supabase is not configured."
        }), 500

    try:
        data = request.get_json() or {}

        title = (data.get("title") or "").strip()
        message = (data.get("message") or "").strip()

        if not title or not message:
            return jsonify({
                "success": False,
                "message": "Title and message are required."
            }), 400

        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/notices",
            headers={
                "apikey": SUPABASE_ADMIN_KEY,
                "Authorization": f"Bearer {SUPABASE_ADMIN_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "title": title,
                "message": message
            },
            timeout=15
        )

        if response.status_code not in (200, 201):
            print("Supabase add notice error:", response.text)
            return jsonify({
                "success": False,
                "message": "Could not add notice."
            }), 500

        send_push_notification(title, message)

        return jsonify({
            "success": True,
            "notice": response.json()[0]
        })

    except Exception as e:
        print("Add notice error:", e)
        return jsonify({
            "success": False,
            "message": "Failed to add notice."
        }), 500

# ============================================================
# PUSH NOTIFICATIONS
# ============================================================

def send_push_notification(title, message):
    if not SUPABASE_URL or not SUPABASE_ADMIN_KEY:
        print("Supabase is not configured.")
        return

    if not VAPID_PRIVATE_KEY or not VAPID_EMAIL:
        print("VAPID settings are not configured.")
        return

    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/push_subscriptions",
        headers={
            "apikey": SUPABASE_ADMIN_KEY,
            "Authorization": f"Bearer {SUPABASE_ADMIN_KEY}"
        },
        params={
            "select": "id,subscription"
        },
        timeout=15
    )

    if response.status_code != 200:
        print("Could not load push subscriptions:", response.text)
        return

    subscriptions = response.json()

    for item in subscriptions:
        try:
            webpush(
                subscription_info=item["subscription"],
                data=json.dumps({
                    "title": title,
                    "body": message
                }),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": VAPID_EMAIL
                }
            )

        except WebPushException as e:
            print("Push notification failed:", e)

        except Exception as e:
            print("Push notification error:", e)


@app.route("/api/push-subscription", methods=["POST"])
def save_push_subscription():

    print("DEBUG:", bool(SUPABASE_URL), bool(SUPABASE_ADMIN_KEY))

            

    if not SUPABASE_URL or not SUPABASE_ADMIN_KEY:
        return jsonify({
            "success": False,
            "message": "Supabase is not configured."
        }), 500

    try:
        data = request.get_json(silent=True) or {}
        subscription = data.get("subscription")

        if not subscription:
            return jsonify({
                "success": False,
                "message": "Push subscription is required."
            }), 400

        endpoint = subscription.get("endpoint")

        if not endpoint:
            return jsonify({
                "success": False,
                "message": "Subscription endpoint is missing."
            }), 400

        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/push_subscriptions",
            headers={
                "apikey": SUPABASE_ADMIN_KEY,
                "Authorization": f"Bearer {SUPABASE_ADMIN_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "endpoint": endpoint,
                "subscription": subscription
            },
            timeout=15
        )

        if response.status_code == 409:
            response = requests.patch(
                f"{SUPABASE_URL}/rest/v1/push_subscriptions",
                headers={
                    "apikey": SUPABASE_ADMIN_KEY,
                    "Authorization": f"Bearer {SUPABASE_ADMIN_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                params={
                    "endpoint": f"eq.{endpoint}"
                },
                json={
                    "subscription": subscription
                },
                timeout=15
            )

        if response.status_code not in (200, 201):
            print(
                "Supabase push subscription error:",
                response.text
            )

            return jsonify({
                "success": False,
                "message": "Could not save push subscription."
            }), 500

        return jsonify({
            "success": True,
            "message": "Push subscription saved."
        })

    except Exception as e:
        print("Push subscription error:", e)

        return jsonify({
            "success": False,
            "message": "Failed to save push subscription."
        }), 500





# ============================================================
# NOTES
# ============================================================

@app.route("/upload-note", methods=["POST"])
def upload_note():

    class_name = request.form.get(
        "className",
        ""
    ).strip()

    subject = request.form.get(
        "subject",
        ""
    ).strip()

    file = request.files.get("file")

    if class_name not in CLASSES:
        return jsonify({
            "success": False,
            "message": "Please select a valid class."
        }), 400

    if subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "message": "Please select a valid subject."
        }), 400

    success, message, path = upload_document(
        NOTES_FOLDER,
        class_name,
        subject,
        file,
        "notes"
    )

    if not success:
        status = 409 if "already exists" in message else 400

        return jsonify({
            "success": False,
            "message": message
        }), status

    return jsonify({
        "success": True,
        "message": message,
        "file": path
    })


@app.route(
    "/get-notes/<path:class_name>/<path:subject>",
    methods=["GET"]
)
def get_notes(class_name, subject):

    if class_name not in CLASSES or subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "files": [],
            "message": "Invalid class or subject."
        }), 400

    files = list_pdfs(
        NOTES_FOLDER,
        class_name,
        subject,
        "notes"
    )

    return jsonify({
        "success": True,
        "files": files
    })


@app.route("/delete-note", methods=["POST"])
def delete_note():

    data = request.get_json(
        silent=True
    ) or {}

    class_name = str(
        data.get("className", "")
    ).strip()

    subject = str(
        data.get("subject", "")
    ).strip()

    filename = str(
        data.get("filename", "")
    ).strip()

    success, message = delete_document(
        NOTES_FOLDER,
        class_name,
        subject,
        filename
    )

    if not success:
        return jsonify({
            "success": False,
            "message": message
        }), 400

    return jsonify({
        "success": True,
        "message": message
    })


@app.route("/notes/<path:filename>")
def serve_notes(filename):
    github_path = f"notes/{filename}"
    return redirect(github_raw_url(github_path))


# ============================================================
# SYLLABUS
# ============================================================

@app.route("/upload-syllabus", methods=["POST"])
def upload_syllabus():

    class_name = request.form.get(
        "className",
        ""
    ).strip()

    subject = request.form.get(
        "subject",
        ""
    ).strip()

    file = request.files.get("file")

    if class_name not in CLASSES:
        return jsonify({
            "success": False,
            "message": "Please select a valid class."
        }), 400

    if subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "message": "Please select a valid subject."
        }), 400

    success, message, path = upload_document(
        SYLLABUS_FOLDER,
        class_name,
        subject,
        file,
        "syllabus"
    )

    if not success:
        status = 409 if "already exists" in message else 400

        return jsonify({
            "success": False,
            "message": message
        }), status

    return jsonify({
        "success": True,
        "message": message,
        "file": path
    })


@app.route(
    "/get-syllabus/<path:class_name>/<path:subject>",
    methods=["GET"]
)
def get_syllabus(class_name, subject):

    if class_name not in CLASSES or subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "files": [],
            "message": "Invalid class or subject."
        }), 400

    files = list_pdfs(
        SYLLABUS_FOLDER,
        class_name,
        subject,
        "syllabus"
    )

    return jsonify({
        "success": True,
        "files": files
    })


@app.route("/delete-syllabus", methods=["POST"])
def delete_syllabus():

    data = request.get_json(
        silent=True
    ) or {}

    class_name = str(
        data.get("className", "")
    ).strip()

    subject = str(
        data.get("subject", "")
    ).strip()

    filename = str(
        data.get("filename", "")
    ).strip()

    success, message = delete_document(
        SYLLABUS_FOLDER,
        class_name,
        subject,
        filename
    )

    if not success:
        return jsonify({
            "success": False,
            "message": message
        }), 400

    return jsonify({
        "success": True,
        "message": message
    })


@app.route("/syllabus/<path:filename>")
def serve_syllabus(filename):
    github_path = f"syllabus/{filename}"
    return redirect(github_raw_url(github_path))


# ============================================================
# QUESTION PAPERS
# ============================================================

@app.route("/upload-question-paper", methods=["POST"])
def upload_question_paper():

    class_name = request.form.get(
        "className",
        ""
    ).strip()

    subject = request.form.get(
        "subject",
        ""
    ).strip()

    file = request.files.get("file")

    if class_name not in CLASSES:
        return jsonify({
            "success": False,
            "message": "Please select a valid class."
        }), 400

    if subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "message": "Please select a valid subject."
        }), 400

    success, message, path = upload_document(
        QUESTION_PAPER_FOLDER,
        class_name,
        subject,
        file,
        "question-paper"
    )

    if not success:
        status = 409 if "already exists" in message else 400

        return jsonify({
            "success": False,
            "message": message
        }), status

    return jsonify({
        "success": True,
        "message": message,
        "file": path
    })


@app.route(
    "/get-question-papers/<path:class_name>/<path:subject>",
    methods=["GET"]
)
def get_question_papers(class_name, subject):

    if class_name not in CLASSES or subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "files": [],
            "message": "Invalid class or subject."
        }), 400

    files = list_pdfs(
        QUESTION_PAPER_FOLDER,
        class_name,
        subject,
        "question-paper"
    )

    return jsonify({
        "success": True,
        "files": files
    })


@app.route(
    "/delete-question-paper",
    methods=["POST"]
)
def delete_question_paper():

    data = request.get_json(
        silent=True
    ) or {}

    class_name = str(
        data.get("className", "")
    ).strip()

    subject = str(
        data.get("subject", "")
    ).strip()

    filename = str(
        data.get("filename", "")
    ).strip()

    success, message = delete_document(
        QUESTION_PAPER_FOLDER,
        class_name,
        subject,
        filename
    )

    if not success:
        return jsonify({
            "success": False,
            "message": message
        }), 400

    return jsonify({
        "success": True,
        "message": message
    })


@app.route("/question-paper/<path:filename>")
def serve_question_paper(filename):
    github_path = f"question-paper/{filename}"
    return redirect(github_raw_url(github_path))

# ============================================================
# MOCK TEST API
# ============================================================

@app.route("/api/mock-tests", methods=["GET"])
def get_all_mock_tests():

    tests = load_mock_tests()

    return jsonify({
        "success": True,
        "tests": tests
    })


@app.route("/api/mock-tests", methods=["POST"])
def create_mock_test():

    data = request.get_json(silent=True) or {}

    class_name = str(data.get("className", "")).strip()
    subject = str(data.get("subject", "")).strip()
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()

    try:
        duration = int(data.get("duration", 10))
    except (TypeError, ValueError):
        duration = 10

    questions = data.get("questions", [])

    if class_name not in CLASSES:
        return jsonify({
            "success": False,
            "message": "Please select a valid class."
        }), 400

    if subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "message": "Please select a valid subject."
        }), 400

    if not title:
        return jsonify({
            "success": False,
            "message": "Test title is required."
        }), 400

    if duration < 1:
        return jsonify({
            "success": False,
            "message": "Duration must be at least 1 minute."
        }), 400

    if not isinstance(questions, list) or len(questions) == 0:
        return jsonify({
            "success": False,
            "message": "At least one question is required."
        }), 400

    cleaned_questions = []

    for question in questions:

        question_text = str(
            question.get("question", "")
        ).strip()

        options = question.get("options", [])
        answer = question.get("answer")

        if not question_text:
            return jsonify({
                "success": False,
                "message": "Every question must have question text."
            }), 400

        if not isinstance(options, list) or len(options) != 4:
            return jsonify({
                "success": False,
                "message": "Every question must have exactly 4 options."
            }), 400

        cleaned_options = [
            str(option).strip()
            for option in options
        ]

        if any(not option for option in cleaned_options):
            return jsonify({
                "success": False,
                "message": "All four options are required."
            }), 400

        try:
            answer = int(answer)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Please select the correct answer."
            }), 400

        if answer not in [0, 1, 2, 3]:
            return jsonify({
                "success": False,
                "message": "Correct answer must be between option 1 and 4."
            }), 400

        cleaned_questions.append({
            "question": question_text,
            "options": cleaned_options,
            "answer": answer
        })

    tests = load_mock_tests()

    new_test = {
        "id": uuid.uuid4().hex,
        "className": class_name,
        "subject": subject,
        "title": title,
        "description": description,
        "duration": duration,
        "questions": cleaned_questions
    }

    tests.append(new_test)

    save_mock_tests(tests)

    return jsonify({
        "success": True,
        "message": "Mock test created successfully.",
        "test": new_test
    }), 201


@app.route("/api/mock-tests/<test_id>", methods=["PUT"])
def update_mock_test(test_id):

    data = request.get_json(silent=True) or {}

    tests = load_mock_tests()

    test = next(
        (item for item in tests if item.get("id") == test_id),
        None
    )

    if test is None:
        return jsonify({
            "success": False,
            "message": "Mock test not found."
        }), 404

    class_name = str(data.get("className", "")).strip()
    subject = str(data.get("subject", "")).strip()
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()

    try:
        duration = int(data.get("duration", 10))
    except (TypeError, ValueError):
        duration = 10

    questions = data.get("questions", [])

    if class_name not in CLASSES:
        return jsonify({
            "success": False,
            "message": "Please select a valid class."
        }), 400

    if subject not in SUBJECTS:
        return jsonify({
            "success": False,
            "message": "Please select a valid subject."
        }), 400

    if not title:
        return jsonify({
            "success": False,
            "message": "Test title is required."
        }), 400

    if duration < 1:
        return jsonify({
            "success": False,
            "message": "Duration must be at least 1 minute."
        }), 400

    if not isinstance(questions, list) or len(questions) == 0:
        return jsonify({
            "success": False,
            "message": "At least one question is required."
        }), 400

    cleaned_questions = []

    for question in questions:

        question_text = str(
            question.get("question", "")
        ).strip()

        options = question.get("options", [])
        answer = question.get("answer")

        if not question_text:
            return jsonify({
                "success": False,
                "message": "Every question must have question text."
            }), 400

        if not isinstance(options, list) or len(options) != 4:
            return jsonify({
                "success": False,
                "message": "Every question must have exactly 4 options."
            }), 400

        cleaned_options = [
            str(option).strip()
            for option in options
        ]

        if any(not option for option in cleaned_options):
            return jsonify({
                "success": False,
                "message": "All four options are required."
            }), 400

        try:
            answer = int(answer)
        except (TypeError, ValueError):
            return jsonify({
                "success": False,
                "message": "Please select the correct answer."
            }), 400

        if answer not in [0, 1, 2, 3]:
            return jsonify({
                "success": False,
                "message": "Correct answer must be between option 1 and 4."
            }), 400

        cleaned_questions.append({
            "question": question_text,
            "options": cleaned_options,
            "answer": answer
        })

    test["className"] = class_name
    test["subject"] = subject
    test["title"] = title
    test["description"] = description
    test["duration"] = duration
    test["questions"] = cleaned_questions

    save_mock_tests(tests)

    return jsonify({
        "success": True,
        "message": "Mock test updated successfully.",
        "test": test
    })


@app.route("/api/mock-tests/<test_id>", methods=["DELETE"])
def delete_mock_test(test_id):

    tests = load_mock_tests()

    new_tests = [
        test for test in tests
        if test.get("id") != test_id
    ]

    if len(new_tests) == len(tests):
        return jsonify({
            "success": False,
            "message": "Mock test not found."
        }), 404

    save_mock_tests(new_tests)

    return jsonify({
        "success": True,
        "message": "Mock test deleted successfully."
    })

# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("")
    print("=" * 60)
    print("CBZ Institute of Education")
    print("Flask Server Started")
    print("=" * 60)
    print("Website: http://127.0.0.1:5001")
    print("Press CTRL+C to stop the server.")
    print("=" * 60)
    print("")

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=True
    )