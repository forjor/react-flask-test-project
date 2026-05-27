import os
import sqlite3
import uuid
import requests
from flask import Flask, jsonify, request, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

_DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "cats.db")


def get_db():
    if "db" not in g:
        db_path = os.environ.get("DB_PATH", _DEFAULT_DB_PATH)
        g.db = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    with app.app_context():
        db = get_db()
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS cats (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                image_url TEXT NOT NULL,
                width INTEGER,
                height INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()


@app.route("/api/cats", methods=["GET"])
def list_cats():
    db = get_db()
    cats = db.execute(
        "SELECT * FROM cats ORDER BY created_at DESC, rowid DESC"
    ).fetchall()
    return jsonify([dict(cat) for cat in cats])


@app.route("/api/cats", methods=["POST"])
def create_cat():
    data = request.get_json(silent=True) or {}
    name = data.get("name", "Mystery Cat")

    # Fetch a random cat image from cataas.com
    cat_id = str(uuid.uuid4())
    width = 400
    height = 300
    image_url = f"https://cataas.com/cat?{cat_id}"

    db = get_db()
    db.execute(
        "INSERT INTO cats (id, name, image_url, width, height) VALUES (?, ?, ?, ?, ?)",
        (cat_id, name, image_url, width, height),
    )
    db.commit()

    cat = db.execute("SELECT * FROM cats WHERE id = ?", (cat_id,)).fetchone()
    return jsonify(dict(cat)), 201


@app.route("/api/cats/<cat_id>", methods=["GET"])
def get_cat(cat_id):
    db = get_db()
    cat = db.execute("SELECT * FROM cats WHERE id = ?", (cat_id,)).fetchone()
    if cat is None:
        return jsonify({"error": "Cat not found"}), 404
    return jsonify(dict(cat))


@app.route("/api/cats/<cat_id>", methods=["DELETE"])
def delete_cat(cat_id):
    db = get_db()
    cat = db.execute("SELECT * FROM cats WHERE id = ?", (cat_id,)).fetchone()
    if cat is None:
        return jsonify({"error": "Cat not found"}), 404
    db.execute("DELETE FROM cats WHERE id = ?", (cat_id,))
    db.commit()
    return jsonify({"message": "Cat deleted"}), 200


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
