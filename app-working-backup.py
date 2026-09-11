from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os

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
    folder = get_document_folder(
        base_folder,
        class_name,
        subject
    )

    if not folder or not os.path.exists(folder):
        return []

    files = []

    for filename in os.listdir(folder):

        if filename.lower().endswith(".pdf"):

            files.append({
                "name": filename,
                "path": f"{url_folder}/{CLASSES[class_name]}/{SUBJECTS[subject]}/{filename}"
            })

    files.sort(
        key=lambda item: item["name"].lower()
    )

    return files


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

    folder = get_document_folder(
        base_folder,
        class_name,
        subject
    )

    if folder is None:
        return False, "Invalid class or subject.", None

    filename = secure_filename(file.filename)

    if not filename:
        return False, "Invalid file name.", None

    file_path = os.path.join(folder, filename)

    # Do not overwrite an existing file
    if os.path.exists(file_path):
        return False, "A PDF with this name already exists.", None

    file.save(file_path)

    relative_path = (
        f"{url_folder}/"
        f"{CLASSES[class_name]}/"
        f"{SUBJECTS[subject]}/"
        f"{filename}"
    )

    return True, "PDF uploaded successfully!", relative_path


def delete_document(base_folder, class_name, subject, filename):

    class_slug = get_class_slug(class_name)
    subject_slug = get_subject_slug(subject)

    if not class_slug or not subject_slug:
        return False, "Invalid class or subject."

    folder = os.path.join(
        base_folder,
        class_slug,
        subject_slug
    )

    safe_filename = secure_filename(
        str(filename or "")
    )

    if not safe_filename:
        return False, "Invalid file name."

    file_path = os.path.join(
        folder,
        safe_filename
    )

    # Security check
    folder_real = os.path.realpath(folder)
    file_real = os.path.realpath(file_path)

    if os.path.commonpath(
        [folder_real, file_real]
    ) != folder_real:
        return False, "Invalid file path."

    if not os.path.isfile(file_real):
        return False, "PDF not found."

    try:
        os.remove(file_real)
        return True, "PDF deleted successfully!"
    except Exception:
        return False, "Could not delete the PDF."


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

    return send_from_directory(
        NOTES_FOLDER,
        filename
    )


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

    return send_from_directory(
        SYLLABUS_FOLDER,
        filename
    )


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


@app.route(
    "/question-paper/<path:filename>"
)
def serve_question_paper(filename):

    return send_from_directory(
        QUESTION_PAPER_FOLDER,
        filename
    )


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